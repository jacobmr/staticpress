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

    // Redirect to success page
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
