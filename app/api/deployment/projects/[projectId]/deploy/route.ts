import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deploySchema } from '@/lib/validation/schemas'
import type { DeploymentPlatform, DeploymentCredentials } from '@/lib/deployment'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'
    const { rateLimitCheck } = await import('@/lib/cache')
    if (!rateLimitCheck(`deploy:${ip}`, 10, 60)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()

    // Validate request body
    const result = deploySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { branch, commitSha, isProduction } = result.data

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient, logEvent } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = await getSupabaseClient()

    // Get project and verify ownership
    const { data: project, error: fetchError } = await supabase
      .from('deployment_projects')
      .select(`
        id,
        platform,
        project_id,
        project_name,
        repositories!inner (
          user_id,
          owner,
          repo
        )
      `)
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify ownership
    const repositories = project.repositories as unknown as { user_id: number; owner: string; repo: string }[]
    const repository = repositories[0]
    if (repository.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get platform credentials
    const { data: platformData, error: platformError } = await supabase
      .from('deployment_platforms')
      .select('access_token, team_id, account_id')
      .eq('user_id', user.id)
      .eq('platform', project.platform)
      .single()

    if (platformError || !platformData) {
      return NextResponse.json(
        { error: 'Platform not connected' },
        { status: 400 }
      )
    }

    // Trigger deployment
    const { getDeploymentProvider } = await import('@/lib/deployment')
    const provider = await getDeploymentProvider(project.platform as DeploymentPlatform)

    const credentials: DeploymentCredentials = {
      platform: project.platform as DeploymentPlatform,
      accessToken: platformData.access_token,
      teamId: platformData.team_id,
      accountId: platformData.account_id,
    }

    const deploymentResult = await provider.deploy(credentials, project.project_id, {
      branch,
      commitSha,
      isProduction,
    })

    if (!deploymentResult.success) {
      return NextResponse.json(
        { error: deploymentResult.error || 'Deployment failed' },
        { status: 500 }
      )
    }

    // Store deployment history
    const { error: historyError } = await supabase
      .from('deployment_history')
      .insert({
        project_id: projectId,
        deployment_id: deploymentResult.deploymentId,
        status: 'pending',
        deployment_url: deploymentResult.deploymentUrl,
        preview_url: deploymentResult.previewUrl,
        commit_sha: commitSha,
        triggered_by: 'api',
        started_at: new Date().toISOString(),
      })

    if (historyError) {
      console.error('Error storing deployment history:', historyError)
      // Don't fail the request if history storage fails
    }

    // Log event
    await logEvent('deployment_triggered', user.id, {
      platform: project.platform,
      project_name: project.project_name,
      repository: `${repository.owner}/${repository.repo}`,
      is_production: isProduction,
    })

    return NextResponse.json({
      success: true,
      deployment: {
        id: deploymentResult.deploymentId,
        url: deploymentResult.deploymentUrl,
        previewUrl: deploymentResult.previewUrl,
      },
    })
  } catch (error) {
    console.error('Error triggering deployment:', error)
    return NextResponse.json(
      { error: 'Failed to trigger deployment' },
      { status: 500 }
    )
  }
}
