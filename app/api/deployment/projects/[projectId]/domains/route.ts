import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addDomainSchema, removeDomainSchema } from '@/lib/validation/schemas'
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

    // Get project and verify ownership
    const { data: project, error: fetchError } = await supabase
      .from('deployment_projects')
      .select(`
        id,
        platform,
        project_id,
        custom_domains,
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

    // Get domain details from provider if credentials exist
    let domains = project.custom_domains || []
    const domainDetails: Array<{
      domain: string
      configured: boolean
      verified: boolean
      dnsRecords?: Array<{ type: string; name: string; value: string }>
    }> = []

    if (platformData && domains.length > 0) {
      const { getDeploymentProvider } = await import('@/lib/deployment')
      const provider = await getDeploymentProvider(project.platform as DeploymentPlatform)

      const credentials: DeploymentCredentials = {
        platform: project.platform as DeploymentPlatform,
        accessToken: platformData.access_token,
        teamId: platformData.team_id,
        accountId: platformData.account_id,
      }

      // Get DNS instructions for each domain
      for (const domain of domains) {
        try {
          const dnsRecords = await provider.getDnsInstructions(
            credentials,
            project.project_id,
            domain
          )

          domainDetails.push({
            domain,
            configured: true,
            verified: dnsRecords.length > 0,
            dnsRecords,
          })
        } catch {
          domainDetails.push({
            domain,
            configured: true,
            verified: false,
          })
        }
      }
    } else {
      domainDetails.push(
        ...domains.map((domain: string) => ({
          domain,
          configured: true,
          verified: false,
        }))
      )
    }

    // Get provider capabilities for domain limits
    const { getProviderCapabilities } = await import('@/lib/deployment')
    const capabilities = await getProviderCapabilities(project.platform as DeploymentPlatform)

    return NextResponse.json({
      domains: domainDetails,
      maxDomains: capabilities.maxCustomDomains,
      canAddMore: domains.length < capabilities.maxCustomDomains,
    })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const body = await request.json()

    // Validate request body
    const result = addDomainSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { domain } = result.data

    // Dynamically import database functions
    const { getUserByGithubId, getSupabaseClient, logEvent } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check user tier for custom domain access
    const { hasFeatureAccess } = await import('@/lib/db')
    if (!hasFeatureAccess(user.subscription_tier, 'custom_domain')) {
      return NextResponse.json(
        { error: 'Custom domains require SMB tier or higher' },
        { status: 403 }
      )
    }

    const supabase = await getSupabaseClient()

    // Get project and verify ownership
    const { data: project, error: fetchError } = await supabase
      .from('deployment_projects')
      .select(`
        id,
        platform,
        project_id,
        custom_domains,
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

    // Check domain limit
    const { getProviderCapabilities } = await import('@/lib/deployment')
    const capabilities = await getProviderCapabilities(project.platform as DeploymentPlatform)
    const currentDomains = project.custom_domains || []

    if (currentDomains.length >= capabilities.maxCustomDomains) {
      return NextResponse.json(
        { error: `Maximum ${capabilities.maxCustomDomains} custom domains allowed` },
        { status: 400 }
      )
    }

    // Check if domain already exists
    if (currentDomains.includes(domain)) {
      return NextResponse.json(
        { error: 'Domain already added to this project' },
        { status: 400 }
      )
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

    // Add domain with provider
    const { getDeploymentProvider } = await import('@/lib/deployment')
    const provider = await getDeploymentProvider(project.platform as DeploymentPlatform)

    const credentials: DeploymentCredentials = {
      platform: project.platform as DeploymentPlatform,
      accessToken: platformData.access_token,
      teamId: platformData.team_id,
      accountId: platformData.account_id,
    }

    const domainResult = await provider.setCustomDomain(
      credentials,
      project.project_id,
      domain
    )

    if (!domainResult.success) {
      return NextResponse.json(
        { error: domainResult.error || 'Failed to add domain' },
        { status: 500 }
      )
    }

    // Update project with new domain
    const updatedDomains = [...currentDomains, domain]
    const { error: updateError } = await supabase
      .from('deployment_projects')
      .update({
        custom_domains: updatedDomains,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Error updating project domains:', updateError)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    // Log event
    await logEvent('custom_domain_added', user.id, {
      platform: project.platform,
      domain,
    })

    return NextResponse.json({
      success: true,
      domain: {
        domain,
        configured: domainResult.configured,
        verified: domainResult.verified,
        dnsRecords: domainResult.dnsRecords,
      },
    })
  } catch (error) {
    console.error('Error adding domain:', error)
    return NextResponse.json(
      { error: 'Failed to add domain' },
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

    const body = await request.json()

    // Validate request body
    const result = removeDomainSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { domain } = result.data

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
        custom_domains,
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

    // Check if domain exists
    const currentDomains = project.custom_domains || []
    if (!currentDomains.includes(domain)) {
      return NextResponse.json(
        { error: 'Domain not found in project' },
        { status: 404 }
      )
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

    // Remove domain from provider
    const { getDeploymentProvider } = await import('@/lib/deployment')
    const provider = await getDeploymentProvider(project.platform as DeploymentPlatform)

    const credentials: DeploymentCredentials = {
      platform: project.platform as DeploymentPlatform,
      accessToken: platformData.access_token,
      teamId: platformData.team_id,
      accountId: platformData.account_id,
    }

    const removed = await provider.removeCustomDomain(
      credentials,
      project.project_id,
      domain
    )

    if (!removed) {
      return NextResponse.json(
        { error: 'Failed to remove domain from provider' },
        { status: 500 }
      )
    }

    // Update project to remove domain
    const updatedDomains = currentDomains.filter((d: string) => d !== domain)
    const { error: updateError } = await supabase
      .from('deployment_projects')
      .update({
        custom_domains: updatedDomains,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Error updating project domains:', updateError)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    // Log event
    await logEvent('custom_domain_removed', user.id, {
      platform: project.platform,
      domain,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing domain:', error)
    return NextResponse.json(
      { error: 'Failed to remove domain' },
      { status: 500 }
    )
  }
}
