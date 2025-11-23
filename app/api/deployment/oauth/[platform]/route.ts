import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deploymentPlatformSchema } from '@/lib/validation/schemas'
import type { DeploymentPlatform } from '@/lib/deployment'
import crypto from 'crypto'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await params

    // Validate platform parameter
    const result = deploymentPlatformSchema.safeParse(platform)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    const validPlatform = result.data as DeploymentPlatform

    // GitHub Pages doesn't need OAuth (uses existing GitHub token)
    if (validPlatform === 'github-pages') {
      return NextResponse.json({
        error: 'GitHub Pages uses your existing GitHub authentication',
        useExistingAuth: true,
      }, { status: 400 })
    }

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get deployment provider
    const { getDeploymentProvider } = await import('@/lib/deployment')
    const provider = await getDeploymentProvider(validPlatform)

    // Check if provider supports OAuth
    if (!provider.getAuthorizationUrl) {
      return NextResponse.json(
        { error: 'Platform does not support OAuth flow' },
        { status: 400 }
      )
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex')

    // Store state in database for verification
    const supabase = await getSupabaseClient()
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        user_id: user.id,
        platform: validPlatform,
        state,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      })

    if (stateError) {
      console.error('Error storing OAuth state:', stateError)
      return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
    }

    // Get redirect URI
    const { searchParams } = new URL(request.url)
    const customRedirectUri = searchParams.get('redirect_uri')

    // Build callback URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = customRedirectUri || `${baseUrl}/api/deployment/oauth/${validPlatform}/callback`

    // Get authorization URL from provider
    const authorizationUrl = provider.getAuthorizationUrl(redirectUri, state)

    return NextResponse.json({
      authorizationUrl,
      state,
    })
  } catch (error) {
    console.error('Error getting authorization URL:', error)
    return NextResponse.json(
      { error: 'Failed to get authorization URL' },
      { status: 500 }
    )
  }
}
