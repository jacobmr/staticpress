import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getRepoConfig } from '@/lib/cookies'
import { GitHubClient } from '@/lib/github'
import { getThemeProfile, isThemeSupported } from '@/lib/theme-profiles'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST() {
    try {
        const session = await auth()
        if (!session?.user?.id || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const repoConfig = await getRepoConfig()
        if (!repoConfig) {
            return NextResponse.json({ error: 'No repository configured' }, { status: 404 })
        }

        const github = new GitHubClient(session.accessToken)

        // Get current config file
        let configFilename = 'hugo.toml'
        let configFile = await github.getFile(repoConfig.owner, repoConfig.repo, 'hugo.toml')

        if (!configFile) {
            configFile = await github.getFile(repoConfig.owner, repoConfig.repo, 'hugo.yaml')
            configFilename = 'hugo.yaml'
        }
        if (!configFile) {
            configFile = await github.getFile(repoConfig.owner, repoConfig.repo, 'config.toml')
            configFilename = 'config.toml'
        }

        if (!configFile) {
            return NextResponse.json({ error: 'Could not find hugo.toml, hugo.yaml, or config.toml' }, { status: 404 })
        }

        let hugoConfigContent = configFile.content
        let modified = false
        let fixMessage = ''

        // Detect theme from config
        const themeMatch = hugoConfigContent.match(/theme\s*=\s*["']([^"']+)["']/)
        const themeId = themeMatch?.[1] || repoConfig.theme || 'papermod'

        // Get theme profile (will fall back to papermod for unsupported themes)
        const themeProfile = getThemeProfile(themeId)

        // Validate current config
        const validation = themeProfile.validateConfig(hugoConfigContent)

        // Fix 1: Ensure unsafe markup is enabled (required for images)
        if (!hugoConfigContent.includes('unsafe = true')) {
            if (hugoConfigContent.includes('[markup.goldmark.renderer]')) {
                hugoConfigContent = hugoConfigContent.replace(
                    '[markup.goldmark.renderer]',
                    '[markup.goldmark.renderer]\n      unsafe = true'
                )
            } else if (hugoConfigContent.includes('[markup.goldmark]')) {
                hugoConfigContent = hugoConfigContent.replace(
                    '[markup.goldmark]',
                    '[markup.goldmark]\n    [markup.goldmark.renderer]\n      unsafe = true'
                )
            } else if (hugoConfigContent.includes('[markup]')) {
                hugoConfigContent = hugoConfigContent.replace(
                    '[markup]',
                    '[markup]\n  [markup.goldmark]\n    [markup.goldmark.renderer]\n      unsafe = true'
                )
            } else {
                hugoConfigContent += `
[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`
            }
            modified = true
            fixMessage += 'Enabled unsafe markup for images. '
        }

        // Fix 2: Add missing params based on theme profile
        if (!hugoConfigContent.includes('[params]')) {
            hugoConfigContent += '\n' + themeProfile.config.paramsTemplate + '\n'
            modified = true
            fixMessage += `Added missing params for ${themeProfile.name} theme. `
        } else if (validation.errors.length > 0) {
            // Theme-specific fixes based on validation errors
            for (const error of validation.errors) {
                if (error.includes('nested [params.author]') && themeId === 'ananke') {
                    // Remove nested author block for Ananke
                    hugoConfigContent = hugoConfigContent.replace(/\[params\.author\][^\[]*/, '')
                    // Add simple author if missing
                    if (!hugoConfigContent.match(/^\s*author\s*=/m)) {
                        hugoConfigContent = hugoConfigContent.replace(
                            '[params]',
                            `[params]\n  author = "StaticPress User"`
                        )
                    }
                    modified = true
                    fixMessage += 'Fixed author param format for Ananke theme. '
                }
            }
        }

        // Fix 3: Update baseURL if it's still example.org
        if (hugoConfigContent.match(/baseURL\s*=\s*["']https?:\/\/example\.org\/?["']/)) {
            const isUserSite = repoConfig.repo.toLowerCase() === `${repoConfig.owner.toLowerCase()}.github.io`
            const newBaseURL = isUserSite
                ? `https://${repoConfig.owner}.github.io/`
                : `https://${repoConfig.owner}.github.io/${repoConfig.repo}/`

            hugoConfigContent = hugoConfigContent.replace(
                /baseURL\s*=\s*["']https?:\/\/example\.org\/?["']/,
                `baseURL = "${newBaseURL}"`
            )
            modified = true
            fixMessage += 'Updated baseURL to GitHub Pages URL. '
        }

        // Fix 4: Install Image Render Hook (fixes broken images in subdirectories)
        const renderHookPath = 'layouts/_default/_markup/render-image.html'
        const renderHookContent = `{{- $u := urls.Parse .Destination -}}
{{- $isRemote := or (strings.HasPrefix .Destination "http://") (strings.HasPrefix .Destination "https://") (strings.HasPrefix .Destination "//") -}}
{{- if $isRemote -}}
  {{- $u = .Destination -}}
{{- else -}}
  {{- $u = .Destination | absURL | safeURL -}}
{{- end -}}
<img src="{{ $u }}" alt="{{ .Text }}"{{ with .Title }} title="{{ . }}"{{ end }} loading="lazy" />`

        // Check if hook exists
        const hookFile = await github.getFile(repoConfig.owner, repoConfig.repo, renderHookPath)
        if (!hookFile || hookFile.content !== renderHookContent) {
            await github.createOrUpdateFile(
                repoConfig.owner,
                repoConfig.repo,
                renderHookPath,
                renderHookContent,
                'fix: Add image render hook for correct path resolution',
                hookFile?.sha
            )
            fixMessage += 'Installed image render hook. '

            // If we only updated the hook, trigger build
            if (!modified) {
                await github.triggerWorkflowDispatch(repoConfig.owner, repoConfig.repo)
                return NextResponse.json({ success: true, message: fixMessage })
            }
        }

        if (modified) {
            await github.createOrUpdateFile(
                repoConfig.owner,
                repoConfig.repo,
                configFilename,
                hugoConfigContent,
                `fix: Repair configuration (StaticPress)\n\n${fixMessage}`,
                configFile.sha
            )

            // Trigger build
            await github.triggerWorkflowDispatch(repoConfig.owner, repoConfig.repo)

            return NextResponse.json({ success: true, message: fixMessage })
        }

        // Add warning if using unsupported theme
        if (!isThemeSupported(themeId)) {
            return NextResponse.json({
                success: true,
                message: 'Configuration is already correct.',
                warning: `Theme "${themeId}" is no longer fully supported. Consider switching to PaperMod or Ananke for best results.`
            })
        }

        return NextResponse.json({ success: true, message: 'Configuration is already correct.' })

    } catch (error) {
        logger.error('Fix config API error', {
            error: error instanceof Error ? error.message : 'Unknown error'
        })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
