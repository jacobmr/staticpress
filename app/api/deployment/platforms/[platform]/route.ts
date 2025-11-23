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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await params

    // Validate platform parameter
    const result = deploymentPlatformSchema.safeParse(platform)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    const validPlatform = result.data as DeploymentPlatform

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get platform connection status
    const supabase = await getSupabaseClient()

    const { data: platformData, error } = await supabase
      .from('deployment_platforms')
      .select('id, platform, team_id, account_id, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('platform', validPlatform)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching platform:', error)
      return NextResponse.json({ error: 'Failed to fetch platform' }, { status: 500 })
    }

    // Get platform info for display
    const { getPlatformInfo, getProviderCapabilities } = await import('@/lib/deployment')
    const info = getPlatformInfo(validPlatform)
    const capabilities = await getProviderCapabilities(validPlatform)

    return NextResponse.json({
      connected: !!platformData,
      platform: {
        id: platformData?.id,
        platform: validPlatform,
        name: info.name,
        description: info.description,
        icon: info.icon,
        docsUrl: info.docsUrl,
        teamId: platformData?.team_id,
        accountId: platformData?.account_id,
        connectedAt: platformData?.created_at,
        updatedAt: platformData?.updated_at,
      },
      capabilities,
    })
  } catch (error) {
    console.error('Error fetching platform status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform status' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient, logEvent } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = await getSupabaseClient()

    // Check if there are active projects using this platform
    const { data: activeProjects } = await supabase
      .from('deployment_projects')
      .select('id')
      .eq('platform', validPlatform)
      .eq('is_active', true)
      .limit(1)

    if (activeProjects && activeProjects.length > 0) {
      return NextResponse.json(
        { error: 'Cannot disconnect platform with active projects' },
        { status: 400 }
      )
    }

    // Delete platform connection
    const { error } = await supabase
      .from('deployment_platforms')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', validPlatform)

    if (error) {
      console.error('Error disconnecting platform:', error)
      return NextResponse.json({ error: 'Failed to disconnect platform' }, { status: 500 })
    }

    // Log event
    await logEvent('platform_disconnected', user.id, { platform: validPlatform })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting platform:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    )
  }
}
