import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createDeploymentProjectSchema } from '@/lib/validation/schemas'
import type { DeploymentPlatform, DeploymentCredentials, ProjectConfig } from '@/lib/deployment'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = await getSupabaseClient()

    // Get user's repositories first
    const { data: repositories } = await supabase
      .from('repositories')
      .select('id')
      .eq('user_id', user.id)

    if (!repositories || repositories.length === 0) {
      return NextResponse.json({ projects: [] })
    }

    const repositoryIds = repositories.map((r: { id: number }) => r.id)

    // Get deployment projects for user's repositories
    const { data: projects, error } = await supabase
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
        updated_at
      `)
      .in('repository_id', repositoryIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Get repository info for each project
    const { data: repoInfo } = await supabase
      .from('repositories')
      .select('id, owner, repo')
      .in('id', repositoryIds)

    const repoMap = new Map(repoInfo?.map((r: { id: number; owner: string; repo: string }) => [r.id, r]) || [])

    const formattedProjects = (projects || []).map((p: { id: number; repository_id: number; platform: string; project_id: string; project_name: string; production_url: string | null; custom_domains: string[] | null; is_active: boolean; created_at: string; updated_at: string }) => ({
      id: p.id,
      repositoryId: p.repository_id,
      repository: repoMap.get(p.repository_id),
      platform: p.platform,
      projectId: p.project_id,
      projectName: p.project_name,
      productionUrl: p.production_url,
      customDomains: p.custom_domains || [],
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }))

    return NextResponse.json({ projects: formattedProjects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const result = createDeploymentProjectSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const {
      platform,
      name,
      repositoryId,
      framework,
      buildCommand,
      outputDirectory,
      environmentVariables,
      rootDirectory,
    } = result.data

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient, logEvent } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = await getSupabaseClient()

    // Verify repository belongs to user
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('id, owner, repo')
      .eq('id', repositoryId)
      .eq('user_id', user.id)
      .single()

    if (repoError || !repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Get platform credentials
    const { data: platformData, error: platformError } = await supabase
      .from('deployment_platforms')
      .select('access_token, team_id, account_id')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()

    if (platformError || !platformData) {
      return NextResponse.json(
        { error: 'Platform not connected. Please connect the platform first.' },
        { status: 400 }
      )
    }

    // Create project with deployment provider
    const { getDeploymentProvider } = await import('@/lib/deployment')
    const provider = await getDeploymentProvider(platform as DeploymentPlatform)

    const credentials: DeploymentCredentials = {
      platform: platform as DeploymentPlatform,
      accessToken: platformData.access_token,
      teamId: platformData.team_id,
      accountId: platformData.account_id,
    }

    const projectConfig: ProjectConfig = {
      name,
      framework,
      buildCommand,
      outputDirectory,
      environmentVariables: environmentVariables as Record<string, string> | undefined,
      rootDirectory,
    }

    const deploymentProject = await provider.createProject(
      credentials,
      projectConfig,
      repository.owner,
      repository.repo
    )

    // Store project in database
    const { data: newProject, error: insertError } = await supabase
      .from('deployment_projects')
      .insert({
        repository_id: repositoryId,
        platform,
        project_id: deploymentProject.id,
        project_name: deploymentProject.name,
        production_url: deploymentProject.productionUrl,
        custom_domains: deploymentProject.customDomains,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing project:', insertError)
      return NextResponse.json({ error: 'Failed to store project' }, { status: 500 })
    }

    // Log event
    await logEvent('deployment_project_created', user.id, {
      platform,
      project_name: name,
      repository: `${repository.owner}/${repository.repo}`,
    })

    return NextResponse.json({
      success: true,
      project: {
        id: newProject.id,
        repositoryId,
        platform,
        projectId: deploymentProject.id,
        projectName: deploymentProject.name,
        productionUrl: deploymentProject.productionUrl,
        customDomains: deploymentProject.customDomains,
        isActive: true,
        createdAt: newProject.created_at,
      },
    })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
