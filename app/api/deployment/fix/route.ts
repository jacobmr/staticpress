import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getRepoConfig } from '@/lib/cookies'
import { GitHubClient } from '@/lib/github'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const repoConfig = await getRepoConfig()
        if (!repoConfig) {
            return NextResponse.json({ error: 'No repository configured' }, { status: 404 })
        }

        const { logs } = await req.json()
        if (!logs) {
            return NextResponse.json({ error: 'No logs provided' }, { status: 400 })
        }

        const github = new GitHubClient(session.accessToken)
        let fixed = false
        let fixMessage = ''

        // 1. Get current hugo.toml
        const hugoConfigContent = await github.getFileContent(
            repoConfig.owner,
            repoConfig.repo,
            'hugo.toml'
        )

        if (!hugoConfigContent) {
            return NextResponse.json({ error: 'Could not read hugo.toml' }, { status: 500 })
        }

        // --- Heuristics for Auto-Fixing ---

        // Fix 1: Poison Theme / Author Param Issue
        // Error: can't evaluate field name in type string
        // Context: .Site.Language.Params.Author.name
        // Also catches: "nil pointer dereference" in partials/head/meta.html which is often related
        if (logs.includes("can't evaluate field name in type string") || logs.includes("partials/head/meta.html")) {
            // The theme expects [params.author] to be a table with a name field, but it might be a string
            // or it expects it under [languages.en.params.author]

            let newConfig = hugoConfigContent
            let modified = false

            // Check if author is a simple string and convert to object
            if (newConfig.match(/^author\s*=\s*["'][^"']+["']/m)) {
                newConfig = newConfig.replace(
                    /^author\s*=\s*(["'])([^"']+)(["'])/m,
                    `[params.author]\n    name = $1$2$3`
                )
                fixMessage = 'Converted author param to object structure'
                modified = true
            }

            // If [params.author] doesn't exist at all, add it
            if (!newConfig.includes('[params.author]')) {
                // If [params] exists, append to it
                if (newConfig.includes('[params]')) {
                    newConfig = newConfig.replace('[params]', `[params]
  [params.author]
    name = "StaticPress User"
    bio = "Writer"`)
                } else {
                    // Otherwise append to end
                    newConfig += `
[params]
  [params.author]
    name = "StaticPress User"
    bio = "Writer"
`
                }
                fixMessage = 'Added missing [params.author] configuration'
                modified = true
            }

            // Also ensure brand param exists (another common Poison issue)
            if (!newConfig.includes('brand =')) {
                if (newConfig.includes('[params]')) {
                    newConfig = newConfig.replace('[params]', `[params]
  brand = "My Blog"`)
                    modified = true
                }
            }

            if (modified) {
                fixed = true
                await github.createOrUpdateFile(
                    repoConfig.owner,
                    repoConfig.repo,
                    'hugo.toml',
                    newConfig,
                    `fix: ${fixMessage} (Auto-fixed by StaticPress)`
                )
            }
        }

        // Fix 2: Generic "Scratch is nil" or "nil pointer" often means missing params
        // We can try to ensure basic params exist
        if (!fixed && (logs.includes("nil pointer dereference") || logs.includes("can't evaluate field"))) {
            // Add common params that might be missing
            let newConfig = hugoConfigContent
            if (!newConfig.includes('description =')) {
                newConfig += '\ndescription = "My Awesome Blog"\n'
                fixed = true
            }
            if (!newConfig.includes('[params]')) {
                newConfig += '\n[params]\n'
                fixed = true
            }

            if (fixed) {
                fixMessage = 'Added generic missing parameters'
                await github.createOrUpdateFile(
                    repoConfig.owner,
                    repoConfig.repo,
                    'hugo.toml',
                    newConfig,
                    `fix: ${fixMessage} (Auto-fixed by StaticPress)`
                )
            }
        }

        if (fixed) {
            // Trigger a new build
            await github.triggerWorkflowDispatch(repoConfig.owner, repoConfig.repo)
            return NextResponse.json({ success: true, message: fixMessage })
        } else {
            return NextResponse.json({ success: false, message: 'Could not identify a specific fix for this error.' })
        }

    } catch (error) {
        console.error('Auto-fix API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
