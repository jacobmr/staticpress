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

        // Get current hugo.toml
        let hugoConfigContent = await github.getFileContent(
            repoConfig.owner,
            repoConfig.repo,
            'hugo.toml'
        )

        if (!hugoConfigContent) {
            return NextResponse.json({ error: 'Could not read hugo.toml' }, { status: 500 })
        }

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

        // Ensure basic params exist (fixes Poison theme crashes)
        if (!hugoConfigContent.includes('[params.author]')) {
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
            fixMessage += 'Added missing author params. '
        }

        if (modified) {
            await github.createOrUpdateFile(
                repoConfig.owner,
                repoConfig.repo,
                'hugo.toml',
                hugoConfigContent,
                `fix: Repair configuration (StaticPress)\n\n${fixMessage}`
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
