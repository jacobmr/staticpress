/**
 * Deployment Provider System Types
 *
 * Provides a unified abstraction for multiple deployment platforms
 * (GitHub Pages, Vercel, Netlify, Cloudflare Pages)
 */

export type DeploymentPlatform = 'github-pages' | 'vercel' | 'netlify' | 'cloudflare'

export type DeploymentStatus =
  | 'pending'
  | 'building'
  | 'deploying'
  | 'success'
  | 'failed'
  | 'cancelled'

export interface DeploymentCredentials {
  platform: DeploymentPlatform
  accessToken?: string
  teamId?: string
  accountId?: string
}

export interface DeploymentProject {
  id: string
  name: string
  platform: DeploymentPlatform
  productionUrl: string
  customDomains: string[]
  createdAt: Date
  updatedAt: Date
}

export interface DeploymentResult {
  success: boolean
  deploymentId?: string
  deploymentUrl?: string
  previewUrl?: string
  error?: string
  logs?: string[]
}

export interface DeploymentStatusResult {
  status: DeploymentStatus
  deploymentUrl?: string
  previewUrl?: string
  createdAt?: Date
  completedAt?: Date
  error?: string
  buildLogs?: string[]
}

export interface DeploymentLogsResult {
  logs: string[]
  hasMore: boolean
  nextCursor?: string
}

export interface CustomDomainResult {
  success: boolean
  domain?: string
  configured: boolean
  verified: boolean
  dnsRecords?: DnsRecord[]
  error?: string
}

export interface DnsRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT'
  name: string
  value: string
  ttl?: number
}

export interface ProjectConfig {
  name: string
  framework: 'hugo' | 'other'
  buildCommand: string
  outputDirectory: string
  environmentVariables?: Record<string, string>
  rootDirectory?: string
}

export interface AutoSetupConfig {
  framework: 'hugo' | 'other'
  hugoVersion?: string
}

export interface AutoSetupResult {
  project: DeploymentProject
  deploymentUrl: string
  webhookConfigured: boolean
}

export interface ProviderCapabilities {
  supportsPreviewDeployments: boolean
  supportsCustomDomains: boolean
  supportsEnvironmentVariables: boolean
  supportsRollback: boolean
  supportsBuildLogs: boolean
  supportsWebhooks: boolean
  maxCustomDomains: number
  buildTimeout: number // in seconds
}

/**
 * Deployment Provider Interface
 *
 * All deployment providers must implement this interface to ensure
 * consistent behavior across platforms.
 */
export interface DeploymentProvider {
  /** Platform identifier */
  readonly platform: DeploymentPlatform

  /** Human-readable platform name */
  readonly name: string

  /** Platform capabilities */
  readonly capabilities: ProviderCapabilities

  /**
   * Validate provider credentials
   */
  validateCredentials(credentials: DeploymentCredentials): Promise<boolean>

  /**
   * Create or link a project for deployment
   */
  createProject(
    credentials: DeploymentCredentials,
    config: ProjectConfig,
    repoOwner: string,
    repoName: string
  ): Promise<DeploymentProject>

  /**
   * Get existing project details
   */
  getProject(
    credentials: DeploymentCredentials,
    projectId: string
  ): Promise<DeploymentProject | null>

  /**
   * Trigger a deployment
   */
  deploy(
    credentials: DeploymentCredentials,
    projectId: string,
    options?: {
      branch?: string
      commitSha?: string
      isProduction?: boolean
    }
  ): Promise<DeploymentResult>

  /**
   * Get deployment status
   */
  getDeploymentStatus(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string
  ): Promise<DeploymentStatusResult>

  /**
   * Get deployment build logs
   */
  getDeploymentLogs(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string,
    cursor?: string
  ): Promise<DeploymentLogsResult>

  /**
   * Configure a custom domain
   */
  setCustomDomain(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<CustomDomainResult>

  /**
   * Remove a custom domain
   */
  removeCustomDomain(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<boolean>

  /**
   * Get DNS configuration instructions for custom domain
   */
  getDnsInstructions(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<DnsRecord[]>

  /**
   * Rollback to a previous deployment
   */
  rollback(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string
  ): Promise<DeploymentResult>

  /**
   * Delete a project
   */
  deleteProject(
    credentials: DeploymentCredentials,
    projectId: string
  ): Promise<boolean>

  /**
   * Get the authorization URL for OAuth flow (if applicable)
   */
  getAuthorizationUrl?(
    redirectUri: string,
    state: string
  ): string

  /**
   * Exchange OAuth code for access token (if applicable)
   */
  exchangeCodeForToken?(
    code: string,
    redirectUri: string
  ): Promise<string>

  /**
   * One-click auto-setup after OAuth
   * - Detect account/team
   * - Create project linked to GitHub repo
   * - Configure build settings
   * - Return deployment URL
   */
  autoSetupProject(
    credentials: DeploymentCredentials,
    githubRepo: { owner: string; name: string; defaultBranch: string },
    config: AutoSetupConfig
  ): Promise<AutoSetupResult>
}

/**
 * Database types for deployment platform storage
 */
export interface DeploymentPlatformRecord {
  id: string
  user_id: number
  platform: DeploymentPlatform
  access_token: string // encrypted
  team_id?: string
  account_id?: string
  created_at: Date
  updated_at: Date
}

export interface DeploymentProjectRecord {
  id: string
  repository_id: number
  platform: DeploymentPlatform
  project_id: string
  project_name: string
  production_url: string
  custom_domains: string[]
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface DeploymentHistoryRecord {
  id: string
  project_id: string
  deployment_id: string
  status: DeploymentStatus
  deployment_url?: string
  preview_url?: string
  commit_sha?: string
  commit_message?: string
  triggered_by: 'manual' | 'webhook' | 'api'
  started_at: Date
  completed_at?: Date
  error_message?: string
}
