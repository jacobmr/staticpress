import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getRepoConfig } from '@/lib/cookies'
import { GitHubClient } from '@/lib/github'

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

        // Ensure unsafe markup is enabled (required for images)
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

        // Ensure basic params exist (theme-specific fixes)
        // Detect which theme is being used
        const isPoisonTheme = hugoConfigContent.includes('theme = "poison"')
        const isAnankeTheme = hugoConfigContent.includes('theme = "ananke"')

        if (isPoisonTheme && !hugoConfigContent.includes('[params.author]')) {
            // Poison theme needs author as a nested object
            if (hugoConfigContent.includes('[params]')) {
                hugoConfigContent = hugoConfigContent.replace('[params]', `[params]
  [params.author]
    name = "StaticPress User"
    bio = "Writer"`)
            } else {
                hugoConfigContent += `
[params]
  [params.author]
    name = "StaticPress User"
    bio = "Writer"
`
            }
            modified = true
            fixMessage += 'Added missing author params for Poison theme. '
        } else if (isAnankeTheme) {
            // Ananke theme needs author as a simple string
            // Remove nested author if it exists
            if (hugoConfigContent.includes('[params.author]')) {
                // Remove the nested author block
                hugoConfigContent = hugoConfigContent.replace(/\[params\.author\][^\[]*/, '')
                modified = true
            }
            // Ensure simple author param exists
            if (!hugoConfigContent.match(/^\s*author\s*=/m)) {
                if (hugoConfigContent.includes('[params]')) {
                    hugoConfigContent = hugoConfigContent.replace('[params]', `[params]
  author = "StaticPress User"`)
                } else {
                    hugoConfigContent += `
[params]
  author = "StaticPress User"
`
                }
                modified = true
                fixMessage += 'Fixed author param for Ananke theme. '
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
        // This ensures markdown images ![](/images/foo.jpg) are correctly resolved relative to baseURL
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
            // We don't set modified=true here because this is a separate file update
            // But we should append to message so user knows
            fixMessage += 'Installed image render hook. '

            // If we only updated the hook, we still need to trigger a build
            // If modified is true, the build trigger below handles it.
            // If modified is false, we need to ensure we trigger build.
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

        return NextResponse.json({ success: true, message: 'Configuration is already correct.' })

    } catch (error) {
        console.error('Fix config API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
