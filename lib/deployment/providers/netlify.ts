/**
 * Netlify Deployment Provider
 *
 * Implements the DeploymentProvider interface for Netlify platform.
 * Handles site creation, deployments, custom domains, and rollbacks.
 */

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

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1'
const NETLIFY_OAUTH_BASE = 'https://app.netlify.com'

interface NetlifyApiError {
  code: number
  message: string
}

interface NetlifySite {
  id: string
  name: string
  url: string
  ssl_url: string
  custom_domain: string | null
  domain_aliases: string[]
  created_at: string
  updated_at: string
  build_settings?: {
    repo_url?: string
    repo_branch?: string
    cmd?: string
    dir?: string
    env?: Record<string, string>
  }
}

interface NetlifyDeploy {
  id: string
  site_id: string
  state: string
  name: string
  url: string
  ssl_url: string
  deploy_url: string
  deploy_ssl_url: string
  created_at: string
  updated_at: string
  published_at: string | null
  title: string | null
  context: string
  branch: string
  commit_ref: string | null
  error_message: string | null
  log_access_attributes?: {
    type: string
    url: string
  }
}

interface NetlifyUser {
  id: string
  uid: string
  full_name: string
  email: string
}

export class NetlifyProvider implements DeploymentProvider {
  readonly platform = 'netlify' as const
  readonly name = 'Netlify'

  readonly capabilities: ProviderCapabilities = {
    supportsPreviewDeployments: true,
    supportsCustomDomains: true,
    supportsEnvironmentVariables: true,
    supportsRollback: true,
    supportsBuildLogs: true,
    supportsWebhooks: true,
    maxCustomDomains: 100,
    buildTimeout: 1800,
  }

  private async makeRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${NETLIFY_API_BASE}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      let errorMessage = `Netlify API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json() as NetlifyApiError
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage)
    }

    // Handle empty responses (204 No Content, etc.)
    const contentType = response.headers.get('content-type')
    if (response.status === 204 || !contentType?.includes('application/json')) {
      return {} as T
    }

    return response.json() as Promise<T>
  }

  async validateCredentials(credentials: DeploymentCredentials): Promise<boolean> {
    if (!credentials.accessToken) {
      return false
    }

    try {
      await this.makeRequest<NetlifyUser>('/user', credentials.accessToken)
      return true
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
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    const repoUrl = `https://github.com/${repoOwner}/${repoName}`

    const siteData = {
      name: config.name,
      repo: {
        provider: 'github',
        repo: `${repoOwner}/${repoName}`,
        repo_url: repoUrl,
        branch: 'main',
        cmd: config.buildCommand,
        dir: config.outputDirectory,
        ...(config.rootDirectory && { base: config.rootDirectory }),
      },
      build_settings: {
        cmd: config.buildCommand,
        dir: config.outputDirectory,
        ...(config.environmentVariables && { env: config.environmentVariables }),
      },
    }

    const site = await this.makeRequest<NetlifySite>(
      '/sites',
      credentials.accessToken,
      {
        method: 'POST',
        body: JSON.stringify(siteData),
      }
    )

    return this.transformSiteToProject(site)
  }

  async getProject(
    credentials: DeploymentCredentials,
    projectId: string
  ): Promise<DeploymentProject | null> {
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    try {
      const site = await this.makeRequest<NetlifySite>(
        `/sites/${projectId}`,
        credentials.accessToken
      )
      return this.transformSiteToProject(site)
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
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    try {
      const buildData: Record<string, unknown> = {}

      if (options?.branch) {
        buildData.branch = options.branch
      }

      if (options?.commitSha) {
        buildData.commit_ref = options.commitSha
      }

      // Clear cache for fresh build
      buildData.clear_cache = true

      const deploy = await this.makeRequest<NetlifyDeploy>(
        `/sites/${projectId}/builds`,
        credentials.accessToken,
        {
          method: 'POST',
          body: JSON.stringify(buildData),
        }
      )

      return {
        success: true,
        deploymentId: deploy.id,
        deploymentUrl: deploy.ssl_url || deploy.url,
        previewUrl: deploy.deploy_ssl_url || deploy.deploy_url,
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
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    const deploy = await this.makeRequest<NetlifyDeploy>(
      `/deploys/${deploymentId}`,
      credentials.accessToken
    )

    const status = this.mapNetlifyStateToStatus(deploy.state)

    return {
      status,
      deploymentUrl: deploy.ssl_url || deploy.url,
      previewUrl: deploy.deploy_ssl_url || deploy.deploy_url,
      createdAt: new Date(deploy.created_at),
      completedAt: deploy.published_at ? new Date(deploy.published_at) : undefined,
      error: deploy.error_message || undefined,
    }
  }

  async getDeploymentLogs(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string,
    cursor?: string
  ): Promise<DeploymentLogsResult> {
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    try {
      // Netlify returns logs as plain text from the /log endpoint
      const response = await fetch(
        `${NETLIFY_API_BASE}/deploys/${deploymentId}/log`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`)
      }

      const logText = await response.text()
      const logs = logText.split('\n').filter(line => line.trim() !== '')

      // Apply cursor-based pagination (simple line-based offset)
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
    } catch (_error) {
      return {
        logs: [],
        hasMore: false,
      }
    }
  }

  async setCustomDomain(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<CustomDomainResult> {
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    try {
      await this.makeRequest(
        `/sites/${projectId}/domain-aliases`,
        credentials.accessToken,
        {
          method: 'POST',
          body: JSON.stringify({ domain }),
        }
      )

      // Get updated site info to check domain status
      const site = await this.makeRequest<NetlifySite>(
        `/sites/${projectId}`,
        credentials.accessToken
      )

      const isDomainConfigured = site.domain_aliases.includes(domain) ||
        site.custom_domain === domain

      // Get DNS records for the domain
      const dnsRecords = await this.getDnsInstructions(credentials, projectId, domain)

      return {
        success: true,
        domain,
        configured: isDomainConfigured,
        verified: false, // DNS verification happens asynchronously
        dnsRecords,
      }
    } catch (error) {
      return {
        success: false,
        domain,
        configured: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Failed to set custom domain',
      }
    }
  }

  async removeCustomDomain(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<boolean> {
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    try {
      await this.makeRequest(
        `/sites/${projectId}/domain-aliases/${encodeURIComponent(domain)}`,
        credentials.accessToken,
        {
          method: 'DELETE',
        }
      )
      return true
    } catch {
      return false
    }
  }

  async getDnsInstructions(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<DnsRecord[]> {
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    // Get site info to determine the correct DNS target
    const site = await this.makeRequest<NetlifySite>(
      `/sites/${projectId}`,
      credentials.accessToken
    )

    const siteName = site.name
    const isApexDomain = !domain.includes('.') || domain.split('.').length === 2

    const records: DnsRecord[] = []

    if (isApexDomain) {
      // Apex domain - use Netlify's load balancer IP
      records.push({
        type: 'A',
        name: '@',
        value: '75.2.60.5',
        ttl: 3600,
      })
    } else {
      // Subdomain - use CNAME
      records.push({
        type: 'CNAME',
        name: domain.split('.')[0],
        value: `${siteName}.netlify.app`,
        ttl: 3600,
      })
    }

    // Optional: Add verification TXT record
    records.push({
      type: 'TXT',
      name: isApexDomain ? '@' : domain.split('.')[0],
      value: `netlify-site=${site.id}`,
      ttl: 3600,
    })

    return records
  }

  async rollback(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string
  ): Promise<DeploymentResult> {
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    try {
      const deploy = await this.makeRequest<NetlifyDeploy>(
        `/sites/${projectId}/rollback`,
        credentials.accessToken,
        {
          method: 'POST',
          body: JSON.stringify({ deploy_id: deploymentId }),
        }
      )

      return {
        success: true,
        deploymentId: deploy.id,
        deploymentUrl: deploy.ssl_url || deploy.url,
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
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    try {
      await this.makeRequest(
        `/sites/${projectId}`,
        credentials.accessToken,
        {
          method: 'DELETE',
        }
      )
      return true
    } catch {
      return false
    }
  }

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const clientId = process.env.NETLIFY_CLIENT_ID
    if (!clientId) {
      throw new Error('NETLIFY_CLIENT_ID environment variable is not set')
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      response_type: 'code',
    })

    return `${NETLIFY_OAUTH_BASE}/authorize?${params.toString()}`
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    const clientId = process.env.NETLIFY_CLIENT_ID
    const clientSecret = process.env.NETLIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('NETLIFY_CLIENT_ID and NETLIFY_CLIENT_SECRET environment variables are required')
    }

    const response = await fetch(`${NETLIFY_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to exchange code for token: ${errorText}`)
    }

    const data = await response.json() as { access_token: string }
    return data.access_token
  }

  /**
   * One-click auto-setup for Netlify
   * - Creates site linked to GitHub repo
   * - Configures Hugo build settings
   * - Returns netlify.app URL
   */
  async autoSetupProject(
    credentials: DeploymentCredentials,
    githubRepo: { owner: string; name: string; defaultBranch: string },
    config: AutoSetupConfig
  ): Promise<AutoSetupResult> {
    if (!credentials.accessToken) {
      throw new Error('Access token is required')
    }

    const { owner, name: repoName } = githubRepo

    // Generate site name from repo name (sanitize for Netlify)
    let siteName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // Check if site with this name already exists by trying to get it
    // Netlify doesn't have a direct "get by name" endpoint, so we list sites and filter
    try {
      const sites = await this.makeRequest<NetlifySite[]>(
        '/sites',
        credentials.accessToken
      )

      let existingSite = sites.find(s => s.name === siteName)
      let suffix = 1
      const baseSiteName = siteName

      while (existingSite) {
        // Check if it's linked to the same GitHub repo
        if (
          existingSite.build_settings?.repo_url?.includes(`${owner}/${repoName}`)
        ) {
          // Same repo, use existing site
          return {
            project: this.transformSiteToProject(existingSite),
            deploymentUrl: existingSite.ssl_url || existingSite.url,
            webhookConfigured: true,
          }
        }

        // Different repo, try with suffix
        siteName = `${baseSiteName}-${suffix}`
        suffix++
        existingSite = sites.find(s => s.name === siteName)
      }
    } catch {
      // Error fetching sites, proceed with original name
    }

    // Create project config
    const projectConfig: ProjectConfig = {
      name: siteName,
      framework: config.framework,
      buildCommand: 'hugo --minify',
      outputDirectory: 'public',
    }

    // Create the site
    const project = await this.createProject(credentials, projectConfig, owner, repoName)

    return {
      project,
      deploymentUrl: project.productionUrl,
      webhookConfigured: true, // Netlify auto-deploys from GitHub
    }
  }

  private transformSiteToProject(site: NetlifySite): DeploymentProject {
    const customDomains = [
      ...(site.custom_domain ? [site.custom_domain] : []),
      ...site.domain_aliases,
    ].filter((domain, index, arr) => arr.indexOf(domain) === index)

    return {
      id: site.id,
      name: site.name,
      platform: 'netlify',
      productionUrl: site.ssl_url || site.url,
      customDomains,
      createdAt: new Date(site.created_at),
      updatedAt: new Date(site.updated_at),
    }
  }

  private mapNetlifyStateToStatus(state: string): DeploymentStatus {
    switch (state.toLowerCase()) {
      case 'new':
      case 'pending':
      case 'uploading':
      case 'uploaded':
      case 'preparing':
        return 'pending'
      case 'building':
      case 'enqueued':
        return 'building'
      case 'processing':
      case 'ready':
        return 'deploying'
      case 'error':
        return 'failed'
      case 'skipped':
      case 'cancelled':
        return 'cancelled'
      default:
        // 'ready' state with published_at means success
        if (state === 'ready') {
          return 'success'
        }
        return 'pending'
    }
  }
}

// Export a singleton instance for convenience
export const netlifyProvider = new NetlifyProvider()
