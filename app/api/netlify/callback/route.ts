import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'

/**
 * Netlify OAuth Callback Handler
 *
 * Handles the OAuth callback from Netlify after user authorization.
 * Exchanges the authorization code for an access token and sets up deployment.
 */

function getErrorRedirectUrl(message: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/deploy?error=${encodeURIComponent(message)}`
}

function getSuccessRedirectUrl(params: {
  platform: string
  url?: string
  projectName?: string
}): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const searchParams = new URLSearchParams({
    success: 'true',
    platform: params.platform,
  })
  if (params.url) searchParams.set('url', params.url)
  if (params.projectName) searchParams.set('project', params.projectName)
  return `${baseUrl}/deploy?${searchParams.toString()}`
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        `${baseUrl}/api/auth/signin?callbackUrl=${encodeURIComponent(request.url)}`
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth error
    if (error) {
      console.error('Netlify OAuth error:', error, errorDescription)
      return NextResponse.redirect(getErrorRedirectUrl(errorDescription || error))
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.redirect(getErrorRedirectUrl('Missing authorization code'))
    }

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient, logEvent } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.redirect(getErrorRedirectUrl('User not found'))
    }

    const supabase = await getSupabaseClient()

    // Verify state if provided (CSRF protection)
    if (state) {
      const { data: storedState, error: stateError } = await supabase
        .from('oauth_states')
        .select('id, user_id, platform, expires_at')
        .eq('state', state)
        .eq('user_id', user.id)
        .eq('platform', 'netlify')
        .single()

      if (stateError || !storedState) {
        return NextResponse.redirect(getErrorRedirectUrl('Invalid state parameter'))
      }

      if (new Date(storedState.expires_at) < new Date()) {
        await supabase.from('oauth_states').delete().eq('id', storedState.id)
        return NextResponse.redirect(getErrorRedirectUrl('Authorization expired, please try again'))
      }

      await supabase.from('oauth_states').delete().eq('id', storedState.id)
    }

    // Exchange code for token
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/netlify/callback`

    const tokenResponse = await fetch('https://api.netlify.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NETLIFY_CLIENT_ID!,
        client_secret: process.env.NETLIFY_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Netlify token exchange failed:', errorData)
      return NextResponse.redirect(getErrorRedirectUrl('Failed to exchange authorization code'))
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return NextResponse.redirect(getErrorRedirectUrl('No access token received'))
    }

    // Store or update credentials
    const { data: existingPlatform } = await supabase
      .from('deployment_platforms')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'netlify')
      .single()

    if (existingPlatform) {
      const { error: updateError } = await supabase
        .from('deployment_platforms')
        .update({
          access_token: accessToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPlatform.id)

      if (updateError) {
        console.error('Error updating Netlify credentials:', updateError)
        return NextResponse.redirect(getErrorRedirectUrl('Failed to update credentials'))
      }
    } else {
      const { error: insertError } = await supabase
        .from('deployment_platforms')
        .insert({
          user_id: user.id,
          platform: 'netlify',
          access_token: accessToken,
        })

      if (insertError) {
        console.error('Error storing Netlify credentials:', insertError)
        return NextResponse.redirect(getErrorRedirectUrl('Failed to store credentials'))
      }
    }

    // Log event
    await logEvent('platform_oauth_completed', user.id, {
      platform: 'netlify',
    })

    // Get user's repository for auto-setup
    const { data: repository } = await supabase
      .from('repositories')
      .select('id, owner, repo')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (repository) {
      try {
        // Get the Netlify provider and auto-setup
        const { getDeploymentProvider } = await import('@/lib/deployment')
        const provider = await getDeploymentProvider('netlify')

        const result = await provider.autoSetupProject(
          { platform: 'netlify', accessToken },
          {
            owner: repository.owner,
            name: repository.repo,
            defaultBranch: 'main',
          },
          { framework: 'hugo' }
        )

        // Store project in database
        await supabase.from('deployment_projects').upsert({
          repository_id: repository.id,
          platform: 'netlify',
          project_id: result.project.id,
          project_name: result.project.name,
          production_url: result.project.productionUrl,
          custom_domains: result.project.customDomains,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'repository_id,platform',
        })

        // Log project creation
        await logEvent('deployment_project_created', user.id, {
          platform: 'netlify',
          projectId: result.project.id,
          projectName: result.project.name,
        })

        return NextResponse.redirect(
          getSuccessRedirectUrl({
            platform: 'netlify',
            url: result.deploymentUrl,
            projectName: result.project.name,
          })
        )
      } catch (setupError) {
        console.error('Netlify auto-setup error:', setupError)
        // Still redirect to success - credentials are stored, user can setup manually
        return NextResponse.redirect(
          getSuccessRedirectUrl({
            platform: 'netlify',
          })
        )
      }
    }

    // No repository - just confirm credentials stored
    return NextResponse.redirect(
      getSuccessRedirectUrl({
        platform: 'netlify',
      })
    )
  } catch (error) {
    console.error('Netlify callback error:', error)
    return NextResponse.redirect(
      getErrorRedirectUrl('An unexpected error occurred')
    )
  }
}
