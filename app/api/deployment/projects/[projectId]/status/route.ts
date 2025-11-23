import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { DeploymentPlatform, DeploymentCredentials } from '@/lib/deployment'

export async function GET(
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const deploymentId = searchParams.get('deploymentId')

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient } = await import('@/lib/db')
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
        repositories!inner (
          user_id
        )
      `)
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify ownership
    const repositories = project.repositories as unknown as { user_id: number }[]
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

    // Get deployment status from provider
    const { getDeploymentProvider } = await import('@/lib/deployment')
    const provider = await getDeploymentProvider(project.platform as DeploymentPlatform)

    const credentials: DeploymentCredentials = {
      platform: project.platform as DeploymentPlatform,
      accessToken: platformData.access_token,
      teamId: platformData.team_id,
      accountId: platformData.account_id,
    }

    // If no deploymentId provided, get latest from database
    let targetDeploymentId = deploymentId
    if (!targetDeploymentId) {
      const { data: latestDeployment } = await supabase
        .from('deployment_history')
        .select('deployment_id')
        .eq('project_id', projectId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (!latestDeployment) {
        return NextResponse.json({ error: 'No deployments found' }, { status: 404 })
      }

      targetDeploymentId = latestDeployment.deployment_id
    }

    const statusResult = await provider.getDeploymentStatus(
      credentials,
      project.project_id,
      targetDeploymentId as string
    )

    // Update deployment history if status has changed
    if (statusResult.status) {
      const updateData: Record<string, unknown> = {
        status: statusResult.status,
      }

      if (statusResult.completedAt) {
        updateData.completed_at = statusResult.completedAt
      }

      if (statusResult.error) {
        updateData.error_message = statusResult.error
      }

      if (statusResult.deploymentUrl) {
        updateData.deployment_url = statusResult.deploymentUrl
      }

      await supabase
        .from('deployment_history')
        .update(updateData)
        .eq('project_id', projectId)
        .eq('deployment_id', targetDeploymentId)
    }

    return NextResponse.json({
      status: statusResult.status,
      deploymentId: targetDeploymentId,
      deploymentUrl: statusResult.deploymentUrl,
      previewUrl: statusResult.previewUrl,
      createdAt: statusResult.createdAt,
      completedAt: statusResult.completedAt,
      error: statusResult.error,
    })
  } catch (error) {
    console.error('Error fetching deployment status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployment status' },
      { status: 500 }
    )
  }
}
