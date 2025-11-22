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

        const searchParams = req.nextUrl.searchParams
        const runId = searchParams.get('runId')

        if (!runId) {
            // If no runId provided, try to find the latest failed run
            // This is a bit of a shortcut; ideally we'd pass the run ID from the status
            // But for now let's just list workflow runs
            const github = new GitHubClient(session.accessToken)
            const { data: runs } = await github.octokit.rest.actions.listWorkflowRunsForRepo({
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                status: 'failure',
                per_page: 1,
            })

            if (runs.workflow_runs.length > 0) {
                const latestRun = runs.workflow_runs[0]
                const logs = await github.getDeploymentLogs(repoConfig.owner, repoConfig.repo, latestRun.id)
                return NextResponse.json({ logs })
            }

            return NextResponse.json({ error: 'No failed runs found' }, { status: 404 })
        }

        // If runId provided (not implemented in UI yet but ready)
        const github = new GitHubClient(session.accessToken)
        const logs = await github.getDeploymentLogs(repoConfig.owner, repoConfig.repo, parseInt(runId))

        return NextResponse.json({ logs })

    } catch (error) {
        console.error('Deployment logs API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
