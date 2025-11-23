import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { setupDeploymentSchema } from '@/lib/validation/schemas'
import type { DeploymentPlatform, DeploymentCredentials, ProjectConfig } from '@/lib/deployment'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate request body
    const result = setupDeploymentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { platform, repositoryId } = result.data

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient, logEvent } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const supabase = await getSupabaseClient()

    // Get repository configuration
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .eq('user_id', user.id)
      .single()

    if (repoError || !repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    // Get platform credentials
    const { data: platformCredentials, error: credError } = await supabase
      .from('deployment_platforms')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()

    if (credError || !platformCredentials) {
      return NextResponse.json(
        { error: 'Platform not connected. Please connect the platform first.' },
        { status: 400 }
      )
    }

    // Get deployment provider
    const { getDeploymentProvider } = await import('@/lib/deployment')
    const provider = await getDeploymentProvider(platform as DeploymentPlatform)

    // Build credentials object
    const credentials: DeploymentCredentials = {
      platform: platform as DeploymentPlatform,
      accessToken: platformCredentials.access_token,
      teamId: platformCredentials.team_id,
      accountId: platformCredentials.account_id,
    }

    // Build project configuration
    const projectConfig: ProjectConfig = {
      name: `${repository.owner}-${repository.repo}`,
      framework: repository.engine === 'hugo' ? 'hugo' : 'other',
      buildCommand: repository.engine === 'hugo' ? 'hugo --gc --minify' : 'npm run build',
      outputDirectory: repository.engine === 'hugo' ? 'public' : 'dist',
      environmentVariables: {
        HUGO_VERSION: '0.123.0',
      },
    }

    // Create project using provider's autoSetupProject or createProject
    let project
    try {
      project = await provider.createProject(
        credentials,
        projectConfig,
        repository.owner,
        repository.repo
      )
    } catch (createError) {
      console.error('Error creating deployment project:', createError)
      return NextResponse.json(
        { error: createError instanceof Error ? createError.message : 'Failed to create deployment project' },
        { status: 500 }
      )
    }

    // Check if project already exists for this repository and platform
    const { data: existingProject } = await supabase
      .from('deployment_projects')
      .select('id')
      .eq('repository_id', repositoryId)
      .eq('platform', platform)
      .single()

    if (existingProject) {
      // Update existing project
      const { error: updateError } = await supabase
        .from('deployment_projects')
        .update({
          project_id: project.id,
          project_name: project.name,
          production_url: project.productionUrl,
          custom_domains: project.customDomains,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProject.id)

      if (updateError) {
        console.error('Error updating deployment project:', updateError)
        return NextResponse.json(
          { error: 'Failed to update deployment project record' },
          { status: 500 }
        )
      }
    } else {
      // Save project to database
      const { error: insertError } = await supabase
        .from('deployment_projects')
        .insert({
          repository_id: repositoryId,
          platform: platform,
          project_id: project.id,
          project_name: project.name,
          production_url: project.productionUrl,
          custom_domains: project.customDomains,
          is_active: true,
        })

      if (insertError) {
        console.error('Error saving deployment project:', insertError)
        return NextResponse.json(
          { error: 'Failed to save deployment project' },
          { status: 500 }
        )
      }
    }

    // Log event
    await logEvent('deployment_project_created', user.id, {
      platform,
      projectId: project.id,
      repositoryId,
    })

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        platform,
        productionUrl: project.productionUrl,
        customDomains: project.customDomains,
      },
      message: `Successfully configured ${platform} deployment for ${repository.owner}/${repository.repo}`,
    })
  } catch (error) {
    console.error('Setup deployment error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
