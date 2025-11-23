import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectPlatformSchema } from '@/lib/validation/schemas'
import type { DeploymentPlatform, DeploymentCredentials } from '@/lib/deployment'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dynamically import database functions
    const { getUserByGithubId } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's connected platforms from database
    const { getSupabaseClient } = await import('@/lib/db')
    const supabase = await getSupabaseClient()

    const { data: platforms, error } = await supabase
      .from('deployment_platforms')
      .select('id, platform, team_id, account_id, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching platforms:', error)
      return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 })
    }

    // Get platform info for display
    const { getAllPlatformInfo } = await import('@/lib/deployment')
    const platformInfo = getAllPlatformInfo()

    // Merge platform data with display info
    const connectedPlatforms = (platforms || []).map((p: { id: number; platform: string; team_id: string | null; account_id: string | null; created_at: string }) => {
      const info = platformInfo.find(pi => pi.platform === p.platform)
      return {
        id: p.id,
        platform: p.platform,
        name: info?.name || p.platform,
        description: info?.description || '',
        icon: info?.icon || '',
        teamId: p.team_id,
        accountId: p.account_id,
        connectedAt: p.created_at,
      }
    })

    return NextResponse.json({
      platforms: connectedPlatforms,
      availablePlatforms: platformInfo,
    })
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
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
    const result = connectPlatformSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { platform, accessToken, teamId, accountId } = result.data

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate credentials with the provider
    const { validatePlatformCredentials } = await import('@/lib/deployment')
    const credentials: DeploymentCredentials = {
      platform: platform as DeploymentPlatform,
      accessToken,
      teamId,
      accountId,
    }

    const isValid = await validatePlatformCredentials(credentials)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials for platform' },
        { status: 400 }
      )
    }

    // Store platform credentials (access token should be encrypted in production)
    const supabase = await getSupabaseClient()

    const { data: existingPlatform } = await supabase
      .from('deployment_platforms')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()

    if (existingPlatform) {
      // Update existing platform
      const { error } = await supabase
        .from('deployment_platforms')
        .update({
          access_token: accessToken, // Should be encrypted
          team_id: teamId,
          account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPlatform.id)

      if (error) {
        console.error('Error updating platform:', error)
        return NextResponse.json({ error: 'Failed to update platform' }, { status: 500 })
      }
    } else {
      // Insert new platform
      const { error } = await supabase
        .from('deployment_platforms')
        .insert({
          user_id: user.id,
          platform,
          access_token: accessToken, // Should be encrypted
          team_id: teamId,
          account_id: accountId,
        })

      if (error) {
        console.error('Error connecting platform:', error)
        return NextResponse.json({ error: 'Failed to connect platform' }, { status: 500 })
      }
    }

    // Log event
    const { logEvent } = await import('@/lib/db')
    await logEvent('platform_connected', user.id, {
      platform,
      has_team_id: !!teamId,
      has_account_id: !!accountId,
    })

    return NextResponse.json({ success: true, platform })
  } catch (error) {
    console.error('Error connecting platform:', error)
    return NextResponse.json(
      { error: 'Failed to connect platform' },
      { status: 500 }
    )
  }
}
