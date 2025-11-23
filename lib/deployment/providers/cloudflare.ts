import type {
  DeploymentProvider,
  DeploymentCredentials,
  DeploymentProject,
  DeploymentResult,
  DeploymentStatusResult,
  DeploymentLogsResult,
  CustomDomainResult,
  DnsRecord,
  ProjectConfig,
  ProviderCapabilities,
  DeploymentStatus,
  AutoSetupConfig,
  AutoSetupResult,
} from '../types'

interface CloudflareApiResponse<T> {
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: Array<{ code: number; message: string }>
  result: T
}

interface CloudflareProject {
  id: string
  name: string
  subdomain: string
  domains: string[]
  source: {
    type: string
    config: {
      owner: string
      repo_name: string
      production_branch: string
      pr_comments_enabled: boolean
      deployments_enabled: boolean
    }
  }
  build_config: {
    build_command: string
    destination_dir: string
    root_dir: string
  }
  deployment_configs: {
    preview: {
      env_vars: Record<string, { value: string }>
    }
    production: {
      env_vars: Record<string, { value: string }>
    }
  }
  created_on: string
  latest_deployment?: CloudflareDeployment
  canonical_deployment?: CloudflareDeployment
  production_branch: string
}

interface CloudflareDeployment {
  id: string
  short_id: string
  project_id: string
  project_name: string
  environment: string
  url: string
  created_on: string
  modified_on: string
  latest_stage: {
    name: string
    status: string
    started_on: string
    ended_on: string | null
  }
  deployment_trigger: {
    type: string
    metadata: {
      branch: string
      commit_hash: string
      commit_message: string
    }
  }
  stages: Array<{
    name: string
    status: string
    started_on: string
    ended_on: string | null
  }>
  build_config: {
    build_command: string
    destination_dir: string
    root_dir: string
  }
  env_vars: Record<string, { value: string }>
  aliases: string[]
  production_branch: string
  is_skipped: boolean
  source: {
    type: string
    config: {
      owner: string
      repo_name: string
    }
  }
}

interface CloudflareDomain {
  id: string
  name: string
  status: string
  verification_data?: {
    status: string
  }
  validation_data?: {
    method: string
    status: string
  }
  zone_tag?: string
  created_on: string
}

interface CloudflareAccount {
  id: string
  name: string
}

export class CloudflareProvider implements DeploymentProvider {
  readonly platform = 'cloudflare' as const
  readonly name = 'Cloudflare Pages'

  readonly capabilities: ProviderCapabilities = {
    supportsPreviewDeployments: true,
    supportsCustomDomains: true,
    supportsEnvironmentVariables: true,
    supportsRollback: true,
    supportsBuildLogs: true,
    supportsWebhooks: true,
    maxCustomDomains: 100,
    buildTimeout: 1200,
  }

  private readonly baseUrl = 'https://api.cloudflare.com/client/v4'

  // OAuth methods
  getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.CLOUDFLARE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      scope: 'account:read pages:write',
    })
    return `https://dash.cloudflare.com/oauth2/authorize?${params.toString()}`
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    const response = await fetch('https://dash.cloudflare.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CLOUDFLARE_CLIENT_ID!,
        client_secret: process.env.CLOUDFLARE_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error_description || 'Token exchange failed')
    return data.access_token
  }

  async getAccountId(accessToken: string): Promise<string> {
    const response = await fetch('https://api.cloudflare.com/client/v4/accounts', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    const data = await response.json()
    if (!data.success || !data.result?.length) {
      throw new Error('No Cloudflare accounts found')
    }
    // Return first account (or could return all for user selection)
    return data.result[0].id
  }

  private async getAccountIdFromCredentials(credentials: DeploymentCredentials): Promise<string> {
    if (credentials.accountId) return credentials.accountId
    return this.getAccountId(credentials.accessToken!)
  }

  private async request<T>(
    credentials: DeploymentCredentials,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CloudflareApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage: string
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.errors?.[0]?.message || errorText
      } catch {
        errorMessage = errorText
      }
      throw new Error(`Cloudflare API error (${response.status}): ${errorMessage}`)
    }

    return response.json()
  }

  async validateCredentials(credentials: DeploymentCredentials): Promise<boolean> {
    if (!credentials.accessToken) {
      return false
    }

    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: { 'Authorization': `Bearer ${credentials.accessToken}` },
      })
      const data = await response.json()
      return data.success === true
    } catch {
      return false
    }
  }

  async createProject(
    credentials: DeploymentCredentials,
    config: ProjectConfig,
    repoOwner: string,
    repoName: string
  ): Promise<DeploymentProject> {
    const accountId = await this.getAccountIdFromCredentials(credentials)

    const envVars: Record<string, { value: string }> = {}
    if (config.environmentVariables) {
      for (const [key, value] of Object.entries(config.environmentVariables)) {
        envVars[key] = { value }
      }
    }

    const projectPayload = {
      name: config.name,
      production_branch: 'main',
      build_config: {
        build_command: config.buildCommand,
        destination_dir: config.outputDirectory,
        root_dir: config.rootDirectory || '',
      },
      source: {
        type: 'github',
        config: {
          owner: repoOwner,
          repo_name: repoName,
          production_branch: 'main',
          pr_comments_enabled: true,
          deployments_enabled: true,
        },
      },
      deployment_configs: {
        preview: {
          env_vars: envVars,
        },
        production: {
          env_vars: envVars,
        },
      },
    }

    const response = await this.request<CloudflareProject>(
      credentials,
      `/accounts/${accountId}/pages/projects`,
      {
        method: 'POST',
        body: JSON.stringify(projectPayload),
      }
    )

    if (!response.success || !response.result) {
      throw new Error(
        `Failed to create project: ${response.errors?.[0]?.message || 'Unknown error'}`
      )
    }

    const project = response.result
    return {
      id: project.name,
      name: project.name,
      platform: 'cloudflare',
      productionUrl: `https://${project.subdomain}.pages.dev`,
      customDomains: project.domains || [],
      createdAt: new Date(project.created_on),
      updatedAt: new Date(project.created_on),
    }
  }

  async getProject(
    credentials: DeploymentCredentials,
    projectId: string
  ): Promise<DeploymentProject | null> {
    const accountId = await this.getAccountIdFromCredentials(credentials)

    try {
      const response = await this.request<CloudflareProject>(
        credentials,
        `/accounts/${accountId}/pages/projects/${projectId}`
      )

      if (!response.success || !response.result) {
        return null
      }

      const project = response.result
      return {
        id: project.name,
        name: project.name,
        platform: 'cloudflare',
        productionUrl: `https://${project.subdomain}.pages.dev`,
        customDomains: project.domains || [],
        createdAt: new Date(project.created_on),
        updatedAt: project.latest_deployment
          ? new Date(project.latest_deployment.modified_on)
          : new Date(project.created_on),
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async deploy(
    credentials: DeploymentCredentials,
    projectId: string,
    options?: {
      branch?: string
      commitSha?: string
      isProduction?: boolean
    }
  ): Promise<DeploymentResult> {
    const accountId = await this.getAccountIdFromCredentials(credentials)

    try {
      // Cloudflare Pages deployments are triggered via webhook from GitHub
      // For manual deployments, we use the deployments endpoint with branch info
      const deployPayload: Record<string, string> = {}

      if (options?.branch) {
        deployPayload.branch = options.branch
      }

      if (options?.commitSha) {
        deployPayload.commit_hash = options.commitSha
      }

      // Create a new deployment
      const response = await this.request<CloudflareDeployment>(
        credentials,
        `/accounts/${accountId}/pages/projects/${projectId}/deployments`,
        {
          method: 'POST',
          body: JSON.stringify(deployPayload),
        }
      )

      if (!response.success || !response.result) {
        return {
          success: false,
          error: response.errors?.[0]?.message || 'Failed to trigger deployment',
        }
      }

      const deployment = response.result
      const isProduction = deployment.environment === 'production'

      return {
        success: true,
        deploymentId: deployment.id,
        deploymentUrl: isProduction ? deployment.url : undefined,
        previewUrl: !isProduction ? deployment.url : undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
      }
    }
  }

  async getDeploymentStatus(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string
  ): Promise<DeploymentStatusResult> {
    const accountId = await this.getAccountIdFromCredentials(credentials)

    try {
      const response = await this.request<CloudflareDeployment>(
        credentials,
        `/accounts/${accountId}/pages/projects/${projectId}/deployments/${deploymentId}`
      )

      if (!response.success || !response.result) {
        return {
          status: 'failed',
          error: response.errors?.[0]?.message || 'Failed to get deployment status',
        }
      }

      const deployment = response.result
      const status = this.mapCloudflareStatus(deployment.latest_stage.status)
      const isProduction = deployment.environment === 'production'

      return {
        status,
        deploymentUrl: isProduction ? deployment.url : undefined,
        previewUrl: !isProduction ? deployment.url : undefined,
        createdAt: new Date(deployment.created_on),
        completedAt: deployment.latest_stage.ended_on
          ? new Date(deployment.latest_stage.ended_on)
          : undefined,
        error: status === 'failed' ? `Build failed at stage: ${deployment.latest_stage.name}` : undefined,
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to get deployment status',
      }
    }
  }

  private mapCloudflareStatus(cloudflareStatus: string): DeploymentStatus {
    const statusMap: Record<string, DeploymentStatus> = {
      'idle': 'pending',
      'active': 'building',
      'queued': 'pending',
      'building': 'building',
      'deploying': 'deploying',
      'success': 'success',
      'failure': 'failed',
      'canceled': 'cancelled',
      'cancelled': 'cancelled',
    }
    return statusMap[cloudflareStatus.toLowerCase()] || 'pending'
  }

  async getDeploymentLogs(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string,
    cursor?: string
  ): Promise<DeploymentLogsResult> {
    const accountId = await this.getAccountIdFromCredentials(credentials)

    try {
      // Get deployment details which includes build logs
      const response = await this.request<CloudflareDeployment>(
        credentials,
        `/accounts/${accountId}/pages/projects/${projectId}/deployments/${deploymentId}`
      )

      if (!response.success || !response.result) {
        return {
          logs: [],
          hasMore: false,
        }
      }

      const deployment = response.result
      const logs: string[] = []

      // Format stage information as logs
      for (const stage of deployment.stages) {
        const stageStatus = stage.status === 'success' ? 'completed' : stage.status
        const startTime = new Date(stage.started_on).toISOString()
        logs.push(`[${startTime}] Stage: ${stage.name} - ${stageStatus}`)

        if (stage.ended_on) {
          const endTime = new Date(stage.ended_on).toISOString()
          const duration = (new Date(stage.ended_on).getTime() - new Date(stage.started_on).getTime()) / 1000
          logs.push(`[${endTime}] Stage ${stage.name} completed in ${duration}s`)
        }
      }

      // Add deployment metadata
      if (deployment.deployment_trigger?.metadata) {
        const meta = deployment.deployment_trigger.metadata
        logs.unshift(`Commit: ${meta.commit_hash?.substring(0, 7) || 'N/A'} - ${meta.commit_message || 'No message'}`)
        logs.unshift(`Branch: ${meta.branch || 'main'}`)
      }

      // Apply cursor-based pagination simulation
      let startIndex = 0
      if (cursor) {
        startIndex = parseInt(cursor, 10) || 0
      }

      const pageSize = 100
      const paginatedLogs = logs.slice(startIndex, startIndex + pageSize)
      const hasMore = startIndex + pageSize < logs.length

      return {
        logs: paginatedLogs,
        hasMore,
        nextCursor: hasMore ? String(startIndex + pageSize) : undefined,
      }
    } catch (error) {
      return {
        logs: [`Error fetching logs: ${error instanceof Error ? error.message : 'Unknown error'}`],
        hasMore: false,
      }
    }
  }

  async setCustomDomain(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<CustomDomainResult> {
    const accountId = await this.getAccountIdFromCredentials(credentials)

    try {
      const response = await this.request<CloudflareDomain>(
        credentials,
        `/accounts/${accountId}/pages/projects/${projectId}/domains`,
        {
          method: 'POST',
          body: JSON.stringify({ name: domain }),
        }
      )

      if (!response.success || !response.result) {
        return {
          success: false,
          configured: false,
          verified: false,
          error: response.errors?.[0]?.message || 'Failed to add custom domain',
        }
      }

      const domainResult = response.result
      const isVerified = domainResult.status === 'active' ||
                         domainResult.verification_data?.status === 'active'

      // Get DNS instructions for the domain
      const dnsRecords = await this.getDnsInstructions(credentials, projectId, domain)

      return {
        success: true,
        domain: domainResult.name,
        configured: true,
        verified: isVerified,
        dnsRecords,
      }
    } catch (error) {
      return {
        success: false,
        configured: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Failed to add custom domain',
      }
    }
  }

  async removeCustomDomain(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<boolean> {
    const accountId = await this.getAccountIdFromCredentials(credentials)

    try {
      const response = await this.request<null>(
        credentials,
        `/accounts/${accountId}/pages/projects/${projectId}/domains/${domain}`,
        {
          method: 'DELETE',
        }
      )

      return response.success
    } catch {
      return false
    }
  }

  async getDnsInstructions(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<DnsRecord[]> {
    // For Cloudflare Pages, the DNS setup is straightforward:
    // - CNAME record pointing to {project}.pages.dev

    const records: DnsRecord[] = []

    // Check if this is an apex domain (no subdomain)
    const isApexDomain = domain.split('.').length === 2

    if (isApexDomain) {
      // For apex domains, Cloudflare recommends using their nameservers
      // or a CNAME flattening approach
      records.push({
        type: 'CNAME',
        name: '@',
        value: `${projectId}.pages.dev`,
        ttl: 3600,
      })
    } else {
      // For subdomains, use a standard CNAME
      const subdomain = domain.split('.')[0]
      records.push({
        type: 'CNAME',
        name: subdomain,
        value: `${projectId}.pages.dev`,
        ttl: 3600,
      })
    }

    // Add verification TXT record (common pattern for domain verification)
    records.push({
      type: 'TXT',
      name: isApexDomain ? '@' : domain.split('.')[0],
      value: `cloudflare-pages-verification=${projectId}`,
      ttl: 3600,
    })

    return records
  }

  async rollback(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string
  ): Promise<DeploymentResult> {
    const accountId = await this.getAccountIdFromCredentials(credentials)

    try {
      // Get the deployment to rollback to
      const deploymentResponse = await this.request<CloudflareDeployment>(
        credentials,
        `/accounts/${accountId}/pages/projects/${projectId}/deployments/${deploymentId}`
      )

      if (!deploymentResponse.success || !deploymentResponse.result) {
        return {
          success: false,
          error: 'Target deployment not found',
        }
      }

      // Cloudflare Pages supports rollback by re-deploying a specific deployment
      const response = await this.request<CloudflareDeployment>(
        credentials,
        `/accounts/${accountId}/pages/projects/${projectId}/deployments/${deploymentId}/rollback`,
        {
          method: 'POST',
        }
      )

      if (!response.success || !response.result) {
        return {
          success: false,
          error: response.errors?.[0]?.message || 'Failed to rollback deployment',
        }
      }

      const deployment = response.result
      return {
        success: true,
        deploymentId: deployment.id,
        deploymentUrl: deployment.url,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rollback deployment',
      }
    }
  }

  async deleteProject(
    credentials: DeploymentCredentials,
    projectId: string
  ): Promise<boolean> {
    const accountId = await this.getAccountIdFromCredentials(credentials)

    try {
      const response = await this.request<null>(
        credentials,
        `/accounts/${accountId}/pages/projects/${projectId}`,
        {
          method: 'DELETE',
        }
      )

      return response.success
    } catch {
      return false
    }
  }

  /**
   * One-click auto-setup for Cloudflare Pages
   * - Auto-detects account ID if not provided
   * - Creates Pages project linked to GitHub
   * - Configures Hugo build settings
   * - Returns pages.dev URL
   */
  async autoSetupProject(
    credentials: DeploymentCredentials,
    githubRepo: { owner: string; name: string; defaultBranch: string },
    config: AutoSetupConfig
  ): Promise<AutoSetupResult> {
    const { owner, name: repoName } = githubRepo

    // Get account ID (auto-detect if not provided)
    const accountId = await this.getAccountIdFromCredentials(credentials)

    // Generate project name from repo name (sanitize for Cloudflare)
    let projectName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // Check if project already exists
    let existingProject = await this.getProject(
      { ...credentials, accountId },
      projectName
    )
    let suffix = 1
    const baseProjectName = projectName

    while (existingProject) {
      // Check if it's linked to the same GitHub repo
      try {
        const response = await this.request<CloudflareProject>(
          { ...credentials, accountId },
          `/accounts/${accountId}/pages/projects/${projectName}`
        )

        if (
          response.success &&
          response.result?.source?.config?.owner === owner &&
          response.result?.source?.config?.repo_name === repoName
        ) {
          // Same repo, use existing project
          return {
            project: existingProject,
            deploymentUrl: existingProject.productionUrl,
            webhookConfigured: true,
          }
        }
      } catch {
        // Error checking project, continue with suffix
      }

      // Different repo, try with suffix
      projectName = `${baseProjectName}-${suffix}`
      suffix++
      existingProject = await this.getProject(
        { ...credentials, accountId },
        projectName
      )
    }

    // Create project config
    const projectConfig: ProjectConfig = {
      name: projectName,
      framework: config.framework,
      buildCommand: 'hugo --minify',
      outputDirectory: 'public',
    }

    // Create the project with accountId in credentials
    const project = await this.createProject(
      { ...credentials, accountId },
      projectConfig,
      owner,
      repoName
    )

    return {
      project,
      deploymentUrl: project.productionUrl,
      webhookConfigured: true, // Cloudflare auto-deploys from GitHub
    }
  }
}
