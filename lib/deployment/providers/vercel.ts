/**
 * Vercel Deployment Provider
 *
 * Implements the DeploymentProvider interface for Vercel platform.
 * Uses Vercel REST API v2+ for all operations.
 *
 * @see https://vercel.com/docs/rest-api
 */

import type {
  DeploymentProvider,
  DeploymentPlatform,
  ProviderCapabilities,
  DeploymentCredentials,
  DeploymentProject,
  DeploymentResult,
  DeploymentStatusResult,
  DeploymentLogsResult,
  CustomDomainResult,
  DnsRecord,
  ProjectConfig,
  DeploymentStatus,
  AutoSetupConfig,
  AutoSetupResult,
} from '../types'

const VERCEL_API_BASE = 'https://api.vercel.com'

// Environment variables for OAuth
const VERCEL_CLIENT_ID = process.env.VERCEL_CLIENT_ID || ''
const VERCEL_CLIENT_SECRET = process.env.VERCEL_CLIENT_SECRET || ''

/**
 * Vercel API response types
 */
interface VercelUser {
  id: string
  email: string
  name: string
  username: string
}

interface VercelProject {
  id: string
  name: string
  accountId: string
  createdAt: number
  updatedAt: number
  link?: {
    type: string
    repo: string
    repoId: number
    org: string
    gitCredentialId: string
    productionBranch: string
    createdAt: number
    updatedAt: number
    deployHooks: Array<{ id: string; name: string; ref: string; url: string }>
  }
  latestDeployments?: VercelDeployment[]
  targets?: {
    production?: {
      alias?: string[]
      aliasAssigned?: number
      aliasError?: { code: string; message: string }
      createdAt?: number
      createdIn?: string
      creator?: { uid: string; email: string; username: string }
      deploymentHostname?: string
      forced?: boolean
      id?: string
      meta?: Record<string, string>
      plan?: string
      private?: boolean
      readyState?: string
      requestedAt?: number
      target?: string
      teamId?: string
      type?: string
      url?: string
    }
  }
}

interface VercelDeployment {
  uid: string
  id: string
  name: string
  url: string
  created: number
  createdAt: number
  buildingAt?: number
  ready?: number
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'INITIALIZING'
  state: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'INITIALIZING'
  type: string
  creator: {
    uid: string
    email: string
    username: string
  }
  meta?: Record<string, string>
  target?: 'production' | 'staging' | null
  aliasAssigned?: boolean
  aliasError?: { code: string; message: string }
  inspectorUrl?: string
  errorCode?: string
  errorMessage?: string
  errorStep?: string
}

interface VercelDomain {
  name: string
  apexName: string
  projectId: string
  redirect?: string
  redirectStatusCode?: number
  gitBranch?: string
  updatedAt: number
  createdAt: number
  verified: boolean
  verification?: Array<{
    type: string
    domain: string
    value: string
    reason: string
  }>
}

interface VercelLogEvent {
  type: string
  created: number
  payload: {
    text?: string
    deploymentId?: string
    info?: {
      type: string
      name: string
      entrypoint?: string
    }
    statusCode?: number
  }
}

interface VercelApiError {
  error?: {
    code: string
    message: string
  }
}

export class VercelProvider implements DeploymentProvider {
  readonly platform: DeploymentPlatform = 'vercel'
  readonly name: string = 'Vercel'

  readonly capabilities: ProviderCapabilities = {
    supportsPreviewDeployments: true,
    supportsCustomDomains: true,
    supportsEnvironmentVariables: true,
    supportsRollback: true,
    supportsBuildLogs: true,
    supportsWebhooks: true,
    maxCustomDomains: 50,
    buildTimeout: 3600,
  }

  /**
   * Build API URL with optional team ID
   */
  private buildUrl(path: string, teamId?: string): string {
    const url = new URL(path, VERCEL_API_BASE)
    if (teamId) {
      url.searchParams.set('teamId', teamId)
    }
    return url.toString()
  }

  /**
   * Make authenticated API request to Vercel
   */
  private async apiRequest<T>(
    method: string,
    path: string,
    credentials: DeploymentCredentials,
    body?: unknown
  ): Promise<T> {
    const url = this.buildUrl(path, credentials.teamId)

    const headers: Record<string, string> = {
      Authorization: `Bearer ${credentials.accessToken}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as VercelApiError
      const errorMessage =
        errorData.error?.message || `Vercel API error: ${response.status} ${response.statusText}`
      throw new Error(errorMessage)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return response.json() as Promise<T>
  }

  /**
   * Validate Vercel credentials by fetching user info
   */
  async validateCredentials(credentials: DeploymentCredentials): Promise<boolean> {
    try {
      await this.apiRequest<VercelUser>('GET', '/v2/user', credentials)
      return true
    } catch {
      return false
    }
  }

  /**
   * Create a new Vercel project linked to a GitHub repository
   */
  async createProject(
    credentials: DeploymentCredentials,
    config: ProjectConfig,
    repoOwner: string,
    repoName: string
  ): Promise<DeploymentProject> {
    const projectBody = {
      name: config.name,
      framework: config.framework === 'hugo' ? 'hugo' : null,
      gitRepository: {
        type: 'github',
        repo: `${repoOwner}/${repoName}`,
      },
      buildCommand: config.buildCommand,
      outputDirectory: config.outputDirectory,
      rootDirectory: config.rootDirectory || null,
      environmentVariables: config.environmentVariables
        ? Object.entries(config.environmentVariables).map(([key, value]) => ({
            key,
            value,
            target: ['production', 'preview', 'development'],
            type: 'plain',
          }))
        : undefined,
    }

    const project = await this.apiRequest<VercelProject>(
      'POST',
      '/v10/projects',
      credentials,
      projectBody
    )

    return this.mapProjectToDeploymentProject(project)
  }

  /**
   * Get an existing Vercel project by ID
   */
  async getProject(
    credentials: DeploymentCredentials,
    projectId: string
  ): Promise<DeploymentProject | null> {
    try {
      const project = await this.apiRequest<VercelProject>(
        'GET',
        `/v9/projects/${encodeURIComponent(projectId)}`,
        credentials
      )
      return this.mapProjectToDeploymentProject(project)
    } catch {
      return null
    }
  }

  /**
   * Trigger a new deployment
   */
  async deploy(
    credentials: DeploymentCredentials,
    projectId: string,
    options?: {
      branch?: string
      commitSha?: string
      isProduction?: boolean
    }
  ): Promise<DeploymentResult> {
    try {
      // Get project to find the repo details
      const project = await this.apiRequest<VercelProject>(
        'GET',
        `/v9/projects/${encodeURIComponent(projectId)}`,
        credentials
      )

      if (!project.link) {
        return {
          success: false,
          error: 'Project is not linked to a Git repository',
        }
      }

      const deploymentBody: Record<string, unknown> = {
        name: project.name,
        project: projectId,
        target: options?.isProduction ? 'production' : undefined,
        gitSource: {
          type: 'github',
          org: project.link.org,
          repo: project.link.repo,
          ref: options?.branch || project.link.productionBranch || 'main',
          sha: options?.commitSha,
        },
      }

      const deployment = await this.apiRequest<VercelDeployment>(
        'POST',
        '/v13/deployments',
        credentials,
        deploymentBody
      )

      return {
        success: true,
        deploymentId: deployment.id,
        deploymentUrl: `https://${deployment.url}`,
        previewUrl: deployment.target !== 'production' ? `https://${deployment.url}` : undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger deployment',
      }
    }
  }

  /**
   * Get the current status of a deployment
   */
  async getDeploymentStatus(
    credentials: DeploymentCredentials,
    _projectId: string,
    deploymentId: string
  ): Promise<DeploymentStatusResult> {
    try {
      const deployment = await this.apiRequest<VercelDeployment>(
        'GET',
        `/v13/deployments/${encodeURIComponent(deploymentId)}`,
        credentials
      )

      const status = this.mapVercelStateToStatus(deployment.readyState || deployment.state)

      return {
        status,
        deploymentUrl: `https://${deployment.url}`,
        previewUrl: deployment.target !== 'production' ? `https://${deployment.url}` : undefined,
        createdAt: new Date(deployment.created || deployment.createdAt),
        completedAt: deployment.ready ? new Date(deployment.ready) : undefined,
        error: deployment.errorMessage,
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to get deployment status',
      }
    }
  }

  /**
   * Get deployment build logs
   */
  async getDeploymentLogs(
    credentials: DeploymentCredentials,
    _projectId: string,
    deploymentId: string,
    cursor?: string
  ): Promise<DeploymentLogsResult> {
    try {
      let path = `/v2/deployments/${encodeURIComponent(deploymentId)}/events`
      if (cursor) {
        path += `?since=${cursor}`
      }

      const events = await this.apiRequest<VercelLogEvent[]>('GET', path, credentials)

      const logs = events
        .filter((event) => event.payload?.text)
        .map((event) => {
          const timestamp = new Date(event.created).toISOString()
          return `[${timestamp}] ${event.payload.text}`
        })

      const lastEvent = events[events.length - 1]
      const nextCursor = lastEvent ? String(lastEvent.created) : undefined

      return {
        logs,
        hasMore: events.length > 0,
        nextCursor,
      }
    } catch (error) {
      return {
        logs: [error instanceof Error ? error.message : 'Failed to get deployment logs'],
        hasMore: false,
      }
    }
  }

  /**
   * Add a custom domain to a project
   */
  async setCustomDomain(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<CustomDomainResult> {
    try {
      const domainResult = await this.apiRequest<VercelDomain>(
        'POST',
        `/v10/projects/${encodeURIComponent(projectId)}/domains`,
        credentials,
        { name: domain }
      )

      const dnsRecords: DnsRecord[] = []

      // Add verification records if domain is not verified
      if (!domainResult.verified && domainResult.verification) {
        for (const record of domainResult.verification) {
          dnsRecords.push({
            type: record.type as DnsRecord['type'],
            name: record.domain,
            value: record.value,
          })
        }
      }

      // Add the main CNAME record
      dnsRecords.push({
        type: 'CNAME',
        name: domain,
        value: 'cname.vercel-dns.com',
      })

      return {
        success: true,
        domain: domainResult.name,
        configured: true,
        verified: domainResult.verified,
        dnsRecords,
      }
    } catch (error) {
      return {
        success: false,
        configured: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Failed to set custom domain',
      }
    }
  }

  /**
   * Remove a custom domain from a project
   */
  async removeCustomDomain(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<boolean> {
    try {
      await this.apiRequest(
        'DELETE',
        `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}`,
        credentials
      )
      return true
    } catch {
      return false
    }
  }

  /**
   * Get DNS configuration instructions for a custom domain
   */
  async getDnsInstructions(
    _credentials: DeploymentCredentials,
    _projectId: string,
    domain: string
  ): Promise<DnsRecord[]> {
    const isApexDomain = domain.split('.').length === 2

    if (isApexDomain) {
      // Apex domains use A records pointing to Vercel's IP
      return [
        {
          type: 'A',
          name: '@',
          value: '76.76.21.21',
          ttl: 3600,
        },
      ]
    }

    // Subdomains use CNAME
    return [
      {
        type: 'CNAME',
        name: domain.split('.')[0],
        value: 'cname.vercel-dns.com',
        ttl: 3600,
      },
    ]
  }

  /**
   * Rollback to a previous deployment
   */
  async rollback(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string
  ): Promise<DeploymentResult> {
    try {
      // Get the original deployment to get its configuration
      const originalDeployment = await this.apiRequest<VercelDeployment>(
        'GET',
        `/v13/deployments/${encodeURIComponent(deploymentId)}`,
        credentials
      )

      // Create a new deployment promoting the target deployment
      const rollbackBody = {
        name: originalDeployment.name,
        project: projectId,
        target: 'production',
        deploymentId: deploymentId,
      }

      const deployment = await this.apiRequest<VercelDeployment>(
        'POST',
        '/v13/deployments',
        credentials,
        rollbackBody
      )

      return {
        success: true,
        deploymentId: deployment.id,
        deploymentUrl: `https://${deployment.url}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rollback deployment',
      }
    }
  }

  /**
   * Delete a Vercel project
   */
  async deleteProject(credentials: DeploymentCredentials, projectId: string): Promise<boolean> {
    try {
      await this.apiRequest(
        'DELETE',
        `/v9/projects/${encodeURIComponent(projectId)}`,
        credentials
      )
      return true
    } catch {
      return false
    }
  }

  /**
   * Get the Vercel OAuth authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: VERCEL_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'user team project deployment domain',
      state,
    })

    return `https://vercel.com/integrations/new?${params.toString()}`
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    const response = await fetch(`${VERCEL_API_BASE}/v2/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: VERCEL_CLIENT_ID,
        client_secret: VERCEL_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as VercelApiError
      throw new Error(
        error.error?.message || `Failed to exchange code for token: ${response.statusText}`
      )
    }

    const data = (await response.json()) as { access_token: string }
    return data.access_token
  }

  /**
   * One-click auto-setup for Vercel
   * - Auto-detects personal account or team
   * - Creates project linked to GitHub repo
   * - Configures Hugo build settings
   * - Returns vercel.app URL
   */
  async autoSetupProject(
    credentials: DeploymentCredentials,
    githubRepo: { owner: string; name: string; defaultBranch: string },
    config: AutoSetupConfig
  ): Promise<AutoSetupResult> {
    const { owner, name: repoName } = githubRepo

    // Generate project name from repo name (sanitize for Vercel)
    let projectName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // Check if project already exists, append suffix if needed
    let existingProject = await this.getProject(credentials, projectName)
    let suffix = 1
    const baseProjectName = projectName
    while (existingProject) {
      // Check if it's linked to the same GitHub repo
      const existingProjectFull = await this.apiRequest<VercelProject>(
        'GET',
        `/v9/projects/${encodeURIComponent(projectName)}`,
        credentials
      )

      if (
        existingProjectFull.link?.org === owner &&
        existingProjectFull.link?.repo === repoName
      ) {
        // Same repo, use existing project
        return {
          project: existingProject,
          deploymentUrl: existingProject.productionUrl,
          webhookConfigured: true,
        }
      }

      // Different repo, try with suffix
      projectName = `${baseProjectName}-${suffix}`
      suffix++
      existingProject = await this.getProject(credentials, projectName)
    }

    // Create project config
    const projectConfig: ProjectConfig = {
      name: projectName,
      framework: config.framework,
      buildCommand: 'hugo --minify',
      outputDirectory: 'public',
    }

    // Create the project
    const project = await this.createProject(credentials, projectConfig, owner, repoName)

    return {
      project,
      deploymentUrl: project.productionUrl,
      webhookConfigured: true, // Vercel auto-deploys from GitHub
    }
  }

  /**
   * Map Vercel project to DeploymentProject
   */
  private mapProjectToDeploymentProject(project: VercelProject): DeploymentProject {
    // Extract custom domains from the project
    const customDomains: string[] = []
    const productionUrl = project.targets?.production?.url
      ? `https://${project.targets.production.url}`
      : `https://${project.name}.vercel.app`

    return {
      id: project.id,
      name: project.name,
      platform: 'vercel',
      productionUrl,
      customDomains,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    }
  }

  /**
   * Map Vercel deployment state to DeploymentStatus
   */
  private mapVercelStateToStatus(
    state: VercelDeployment['readyState'] | VercelDeployment['state']
  ): DeploymentStatus {
    switch (state) {
      case 'QUEUED':
      case 'INITIALIZING':
        return 'pending'
      case 'BUILDING':
        return 'building'
      case 'READY':
        return 'success'
      case 'ERROR':
        return 'failed'
      case 'CANCELED':
        return 'cancelled'
      default:
        return 'pending'
    }
  }
}

/**
 * Export a singleton instance
 */
export const vercelProvider = new VercelProvider()
