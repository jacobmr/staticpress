import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getRepoConfig } from '@/lib/cookies'
import { GitHubClient } from '@/lib/github'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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

        // Get deployment status
        const status = await github.getLatestDeploymentStatus(
            repoConfig.owner,
            repoConfig.repo,
            'main' // TODO: Support custom branches
        )

        // If no deployment status found, check if Pages is enabled at all
        if (!status) {
            const pagesStatus = await github.getGitHubPagesStatus(repoConfig.owner, repoConfig.repo)
            if (pagesStatus) {
                return NextResponse.json({
                    provider: 'GitHub Pages',
                    state: pagesStatus.status === 'built' ? 'success' : pagesStatus.status === 'building' ? 'pending' : 'error',
                    description: `GitHub Pages is ${pagesStatus.status}`,
                    url: pagesStatus.url,
                    updated_at: new Date().toISOString()
                })
            }
        }

        return NextResponse.json({ status })

    } catch (error) {
        console.error('Deployment status API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
