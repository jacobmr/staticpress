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

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = await getSupabaseClient()

    // Get project and verify ownership through repository
    const { data: project, error } = await supabase
      .from('deployment_projects')
      .select(`
        id,
        repository_id,
        platform,
        project_id,
        project_name,
        production_url,
        custom_domains,
        is_active,
        created_at,
        updated_at,
        repositories!inner (
          id,
          user_id,
          owner,
          repo
        )
      `)
      .eq('id', projectId)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify ownership
    const repositories = project.repositories as unknown as { user_id: number; owner: string; repo: string }[]
    const repository = repositories[0]
    if (repository.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get platform credentials
    const { data: platformData } = await supabase
      .from('deployment_platforms')
      .select('access_token, team_id, account_id')
      .eq('user_id', user.id)
      .eq('platform', project.platform)
      .single()

    // Get latest deployment info from provider if credentials exist
    let providerProject = null
    if (platformData) {
      try {
        const { getDeploymentProvider } = await import('@/lib/deployment')
        const provider = await getDeploymentProvider(project.platform as DeploymentPlatform)

        const credentials: DeploymentCredentials = {
          platform: project.platform as DeploymentPlatform,
          accessToken: platformData.access_token,
          teamId: platformData.team_id,
          accountId: platformData.account_id,
        }

        providerProject = await provider.getProject(credentials, project.project_id)
      } catch {
        // Continue without provider data if fetch fails
      }
    }

    return NextResponse.json({
      project: {
        id: project.id,
        repositoryId: project.repository_id,
        repository: {
          owner: repository.owner,
          repo: repository.repo,
        },
        platform: project.platform,
        projectId: project.project_id,
        projectName: project.project_name,
        productionUrl: providerProject?.productionUrl || project.production_url,
        customDomains: providerProject?.customDomains || project.custom_domains || [],
        isActive: project.is_active,
        createdAt: project.created_at,
        updatedAt: providerProject?.updatedAt || project.updated_at,
      },
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { data: platformData } = await supabase
      .from('deployment_platforms')
      .select('access_token, team_id, account_id')
      .eq('user_id', user.id)
      .eq('platform', project.platform)
      .single()

    // Delete project from provider if credentials exist
    if (platformData) {
      try {
        const { getDeploymentProvider } = await import('@/lib/deployment')
        const provider = await getDeploymentProvider(project.platform as DeploymentPlatform)

        const credentials: DeploymentCredentials = {
          platform: project.platform as DeploymentPlatform,
          accessToken: platformData.access_token,
          teamId: platformData.team_id,
          accountId: platformData.account_id,
        }

        await provider.deleteProject(credentials, project.project_id)
      } catch (providerError) {
        console.error('Error deleting project from provider:', providerError)
        // Continue with database deletion even if provider deletion fails
      }
    }

    // Delete project from database
    const { error: deleteError } = await supabase
      .from('deployment_projects')
      .delete()
      .eq('id', projectId)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    // Log event
    await logEvent('deployment_project_deleted', user.id, {
      platform: project.platform,
      project_name: project.project_name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
