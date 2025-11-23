import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deploymentPlatformSchema } from '@/lib/validation/schemas'
import type { DeploymentPlatform } from '@/lib/deployment'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      // Redirect to login if not authenticated
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/api/auth/signin?callbackUrl=${encodeURIComponent(request.url)}`)
    }

    const { platform } = await params

    // Validate platform parameter
    const result = deploymentPlatformSchema.safeParse(platform)
    if (!result.success) {
      return NextResponse.redirect(getErrorRedirectUrl('Invalid platform'))
    }

    const validPlatform = result.data as DeploymentPlatform

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error, errorDescription)
      return NextResponse.redirect(getErrorRedirectUrl(errorDescription || error))
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(getErrorRedirectUrl('Missing authorization code or state'))
    }

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient, logEvent } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.redirect(getErrorRedirectUrl('User not found'))
    }

    const supabase = await getSupabaseClient()

    // Verify state
    const { data: storedState, error: stateError } = await supabase
      .from('oauth_states')
      .select('id, user_id, platform, expires_at')
      .eq('state', state)
      .eq('user_id', user.id)
      .eq('platform', validPlatform)
      .single()

    if (stateError || !storedState) {
      return NextResponse.redirect(getErrorRedirectUrl('Invalid state parameter'))
    }

    // Check if state has expired
    if (new Date(storedState.expires_at) < new Date()) {
      // Delete expired state
      await supabase.from('oauth_states').delete().eq('id', storedState.id)
      return NextResponse.redirect(getErrorRedirectUrl('Authorization expired, please try again'))
    }

    // Delete used state
    await supabase.from('oauth_states').delete().eq('id', storedState.id)

    // Get deployment provider
    const { getDeploymentProvider } = await import('@/lib/deployment')
    const provider = await getDeploymentProvider(validPlatform)

    // Check if provider supports token exchange
    if (!provider.exchangeCodeForToken) {
      return NextResponse.redirect(getErrorRedirectUrl('Platform does not support OAuth flow'))
    }

    // Build callback URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/deployment/oauth/${validPlatform}/callback`

    // Exchange code for token
    let accessToken: string
    try {
      accessToken = await provider.exchangeCodeForToken(code, redirectUri)
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError)
      return NextResponse.redirect(getErrorRedirectUrl('Failed to exchange authorization code'))
    }

    // Check if platform already exists for user
    const { data: existingPlatform } = await supabase
      .from('deployment_platforms')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', validPlatform)
      .single()

    if (existingPlatform) {
      // Update existing platform
      const { error: updateError } = await supabase
        .from('deployment_platforms')
        .update({
          access_token: accessToken, // Should be encrypted in production
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPlatform.id)

      if (updateError) {
        console.error('Error updating platform:', updateError)
        return NextResponse.redirect(getErrorRedirectUrl('Failed to update platform credentials'))
      }
    } else {
      // Insert new platform
      const { error: insertError } = await supabase
        .from('deployment_platforms')
        .insert({
          user_id: user.id,
          platform: validPlatform,
          access_token: accessToken, // Should be encrypted in production
        })

      if (insertError) {
        console.error('Error storing platform:', insertError)
        return NextResponse.redirect(getErrorRedirectUrl('Failed to store platform credentials'))
      }
    }

    // Log event
    await logEvent('platform_oauth_completed', user.id, {
      platform: validPlatform,
    })

    // Get user's repository for auto-setup
    const { data: repository } = await supabase
      .from('repositories')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (repository) {
      // Auto-setup deployment project
      try {
        const { getDeploymentProvider } = await import('@/lib/deployment')
        const provider = await getDeploymentProvider(validPlatform)

        // Get repository details for project config
        const { data: repoDetails } = await supabase
          .from('repositories')
          .select('*')
          .eq('id', repository.id)
          .single()

        if (repoDetails) {
          // Build credentials
          const credentials = {
            platform: validPlatform,
            accessToken,
            teamId: undefined,
            accountId: undefined,
          }

          // Build project configuration
          const projectConfig = {
            name: `${repoDetails.owner}-${repoDetails.repo}`,
            framework: repoDetails.engine === 'hugo' ? 'hugo' as const : 'other' as const,
            buildCommand: repoDetails.engine === 'hugo' ? 'hugo --gc --minify' : 'npm run build',
            outputDirectory: repoDetails.engine === 'hugo' ? 'public' : 'dist',
            environmentVariables: {
              HUGO_VERSION: '0.123.0',
            },
          }

          // Create deployment project
          const project = await provider.createProject(
            credentials,
            projectConfig,
            repoDetails.owner,
            repoDetails.repo
          )

          // Save project to database
          const { data: existingProject } = await supabase
            .from('deployment_projects')
            .select('id')
            .eq('repository_id', repository.id)
            .eq('platform', validPlatform)
            .single()

          if (existingProject) {
            await supabase
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
          } else {
            await supabase
              .from('deployment_projects')
              .insert({
                repository_id: repository.id,
                platform: validPlatform,
                project_id: project.id,
                project_name: project.name,
                production_url: project.productionUrl,
                custom_domains: project.customDomains,
                is_active: true,
              })
          }

          // Log deployment project creation
          await logEvent('deployment_project_created', user.id, {
            platform: validPlatform,
            projectId: project.id,
            repositoryId: repository.id,
          })

          // Redirect to deploy page with success
          return NextResponse.redirect(getSetupSuccessRedirectUrl(validPlatform, project.productionUrl))
        }
      } catch (setupError) {
        console.error('Auto-setup error:', setupError)
        // If auto-setup fails, still redirect to success (platform is connected)
        return NextResponse.redirect(getSuccessRedirectUrl(validPlatform))
      }
    }

    // Redirect to success page (fallback if no repository)
    return NextResponse.redirect(getSuccessRedirectUrl(validPlatform))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(getErrorRedirectUrl('An unexpected error occurred'))
  }
}

function getErrorRedirectUrl(error: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/settings?tab=deployment&error=${encodeURIComponent(error)}`
}

function getSuccessRedirectUrl(platform: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/settings?tab=deployment&success=${encodeURIComponent(`${platform} connected successfully`)}`
}

function getSetupSuccessRedirectUrl(platform: string, productionUrl: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/deploy?success=true&platform=${encodeURIComponent(platform)}&url=${encodeURIComponent(productionUrl)}`
}
