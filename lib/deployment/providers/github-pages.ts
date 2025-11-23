import { Octokit } from 'octokit'
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

/**
 * GitHub Pages Deployment Provider
 *
 * Implements deployment functionality for GitHub Pages using the GitHub API.
 * GitHub Pages automatically deploys when changes are pushed to the repository,
 * so most deployment operations focus on configuration and status monitoring.
 */
export class GitHubPagesProvider implements DeploymentProvider {
  readonly platform = 'github-pages' as const
  readonly name = 'GitHub Pages'

  readonly capabilities: ProviderCapabilities = {
    supportsPreviewDeployments: false,
    supportsCustomDomains: true,
    supportsEnvironmentVariables: false,
    supportsRollback: false,
    supportsBuildLogs: true,
    supportsWebhooks: true,
    maxCustomDomains: 1,
    buildTimeout: 600,
  }

  /**
   * Create an Octokit instance with the provided access token
   */
  private createOctokit(credentials: DeploymentCredentials): Octokit {
    if (!credentials.accessToken) {
      throw new Error('GitHub access token is required')
    }
    return new Octokit({
      auth: credentials.accessToken,
    })
  }

  /**
   * Parse project ID into owner and repo
   * Project ID format: "owner/repo"
   */
  private parseProjectId(projectId: string): { owner: string; repo: string } {
    const parts = projectId.split('/')
    if (parts.length !== 2) {
      throw new Error(`Invalid project ID format: ${projectId}. Expected "owner/repo"`)
    }
    return { owner: parts[0], repo: parts[1] }
  }

  /**
   * Validate GitHub API credentials
   */
  async validateCredentials(credentials: DeploymentCredentials): Promise<boolean> {
    try {
      const octokit = this.createOctokit(credentials)
      const { data } = await octokit.rest.users.getAuthenticated()
      return !!data.login
    } catch (error) {
      console.error('Failed to validate GitHub credentials:', error)
      return false
    }
  }

  /**
   * Enable GitHub Pages for a repository
   */
  async createProject(
    credentials: DeploymentCredentials,
    config: ProjectConfig,
    repoOwner: string,
    repoName: string
  ): Promise<DeploymentProject> {
    const octokit = this.createOctokit(credentials)
    const projectId = `${repoOwner}/${repoName}`

    try {
      // Enable GitHub Pages with GitHub Actions as the build source
      const { data } = await octokit.rest.repos.createPagesSite({
        owner: repoOwner,
        repo: repoName,
        build_type: 'workflow',
      })

      return {
        id: projectId,
        name: repoName,
        platform: 'github-pages',
        productionUrl: data.html_url || `https://${repoOwner}.github.io/${repoName}`,
        customDomains: data.cname ? [data.cname] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    } catch (error: unknown) {
      // If Pages is already enabled (409 Conflict), update it instead
      const isAlreadyEnabled =
        (error && typeof error === 'object' && 'status' in error && error.status === 409) ||
        (error instanceof Error && (error.message.includes('already exists') || error.message.includes('already enabled')))

      if (isAlreadyEnabled) {
        await octokit.rest.repos.updateInformationAboutPagesSite({
          owner: repoOwner,
          repo: repoName,
          build_type: 'workflow',
        })

        // Get the current Pages configuration
        const { data: pagesData } = await octokit.rest.repos.getPages({
          owner: repoOwner,
          repo: repoName,
        })

        return {
          id: projectId,
          name: repoName,
          platform: 'github-pages',
          productionUrl: pagesData.html_url || `https://${repoOwner}.github.io/${repoName}`,
          customDomains: pagesData.cname ? [pagesData.cname] : [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      console.error('Failed to enable GitHub Pages:', error)
      throw error
    }
  }

  /**
   * Get GitHub Pages project details
   */
  async getProject(
    credentials: DeploymentCredentials,
    projectId: string
  ): Promise<DeploymentProject | null> {
    const octokit = this.createOctokit(credentials)
    const { owner, repo } = this.parseProjectId(projectId)

    try {
      const { data } = await octokit.rest.repos.getPages({
        owner,
        repo,
      })

      return {
        id: projectId,
        name: repo,
        platform: 'github-pages',
        productionUrl: data.html_url || `https://${owner}.github.io/${repo}`,
        customDomains: data.cname ? [data.cname] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    } catch {
      // Pages not enabled
      return null
    }
  }

  /**
   * Trigger a deployment via workflow dispatch
   *
   * GitHub Pages automatically deploys on push, but we can also trigger
   * the workflow manually if needed.
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
    const octokit = this.createOctokit(credentials)
    const { owner, repo } = this.parseProjectId(projectId)
    const branch = options?.branch || 'main'

    try {
      // Try to trigger the Hugo workflow
      try {
        await octokit.rest.actions.createWorkflowDispatch({
          owner,
          repo,
          workflow_id: 'hugo.yml',
          ref: branch,
        })
      } catch {
        // Workflow might not exist or might already be running
        // This is okay - GitHub Pages auto-deploys on push anyway
      }

      // Get the latest workflow run
      const { data: runs } = await octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        branch,
        per_page: 1,
      })

      const latestRun = runs.workflow_runs[0]

      // Get Pages URL
      let deploymentUrl = `https://${owner}.github.io/${repo}`
      try {
        const { data: pagesData } = await octokit.rest.repos.getPages({
          owner,
          repo,
        })
        if (pagesData.html_url) {
          deploymentUrl = pagesData.html_url
        }
      } catch {
        // Pages might not be ready yet
      }

      return {
        success: true,
        deploymentId: latestRun?.id?.toString() || `${owner}/${repo}`,
        deploymentUrl,
      }
    } catch (error) {
      console.error('Failed to trigger deployment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger deployment',
      }
    }
  }

  /**
   * Get deployment status from GitHub Actions workflow runs
   */
  async getDeploymentStatus(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string
  ): Promise<DeploymentStatusResult> {
    const octokit = this.createOctokit(credentials)
    const { owner, repo } = this.parseProjectId(projectId)

    try {
      // If deploymentId is a workflow run ID
      const runId = parseInt(deploymentId, 10)

      if (!isNaN(runId)) {
        const { data: run } = await octokit.rest.actions.getWorkflowRun({
          owner,
          repo,
          run_id: runId,
        })

        // Map GitHub Actions status to our status
        let status: DeploymentStatus = 'pending'
        if (run.status === 'completed') {
          if (run.conclusion === 'success') {
            status = 'success'
          } else if (run.conclusion === 'failure' || run.conclusion === 'timed_out') {
            status = 'failed'
          } else if (run.conclusion === 'cancelled') {
            status = 'cancelled'
          } else {
            status = 'failed'
          }
        } else if (run.status === 'in_progress') {
          status = 'building'
        } else if (run.status === 'queued' || run.status === 'waiting' || run.status === 'pending') {
          status = 'pending'
        }

        // Get deployment URL
        let deploymentUrl = `https://${owner}.github.io/${repo}`
        try {
          const { data: pagesData } = await octokit.rest.repos.getPages({
            owner,
            repo,
          })
          if (pagesData.html_url) {
            deploymentUrl = pagesData.html_url
          }
        } catch {
          // Pages might not be enabled
        }

        return {
          status,
          deploymentUrl,
          createdAt: new Date(run.created_at),
          completedAt: run.updated_at ? new Date(run.updated_at) : undefined,
          error: run.conclusion === 'failure' ? 'Workflow failed' : undefined,
        }
      }

      // Fallback: get latest workflow run
      const { data: runs } = await octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 1,
      })

      if (runs.workflow_runs.length === 0) {
        return {
          status: 'pending',
        }
      }

      const latestRun = runs.workflow_runs[0]

      let status: DeploymentStatus = 'pending'
      if (latestRun.status === 'completed') {
        if (latestRun.conclusion === 'success') {
          status = 'success'
        } else if (latestRun.conclusion === 'failure') {
          status = 'failed'
        } else if (latestRun.conclusion === 'cancelled') {
          status = 'cancelled'
        }
      } else if (latestRun.status === 'in_progress') {
        status = 'building'
      }

      let deploymentUrl = `https://${owner}.github.io/${repo}`
      try {
        const { data: pagesData } = await octokit.rest.repos.getPages({
          owner,
          repo,
        })
        if (pagesData.html_url) {
          deploymentUrl = pagesData.html_url
        }
      } catch {
        // Pages might not be enabled
      }

      return {
        status,
        deploymentUrl,
        createdAt: new Date(latestRun.created_at),
        completedAt: latestRun.updated_at ? new Date(latestRun.updated_at) : undefined,
      }
    } catch (error) {
      console.error('Failed to get deployment status:', error)
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to get deployment status',
      }
    }
  }

  /**
   * Get deployment build logs from GitHub Actions
   */
  async getDeploymentLogs(
    credentials: DeploymentCredentials,
    projectId: string,
    deploymentId: string,
    cursor?: string
  ): Promise<DeploymentLogsResult> {
    const octokit = this.createOctokit(credentials)
    const { owner, repo } = this.parseProjectId(projectId)

    try {
      const runId = parseInt(deploymentId, 10)

      if (isNaN(runId)) {
        return {
          logs: ['Invalid deployment ID'],
          hasMore: false,
        }
      }

      // Get jobs for the workflow run
      const { data: jobsData } = await octokit.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: runId,
      })

      if (jobsData.jobs.length === 0) {
        return {
          logs: ['No jobs found for this workflow run'],
          hasMore: false,
        }
      }

      // Get logs for each job, prioritizing failed jobs
      const logs: string[] = []
      const failedJob = jobsData.jobs.find(job => job.conclusion === 'failure')
      const targetJob = failedJob || jobsData.jobs[0]

      try {
        const { data: jobLogs } = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
          owner,
          repo,
          job_id: targetJob.id,
        })

        // Parse the logs string
        const logString = String(jobLogs)
        const logLines = logString.split('\n')

        // Apply cursor offset if provided
        const offset = cursor ? parseInt(cursor, 10) : 0
        const pageSize = 100
        const paginatedLines = logLines.slice(offset, offset + pageSize)

        logs.push(...paginatedLines)

        return {
          logs,
          hasMore: offset + pageSize < logLines.length,
          nextCursor: offset + pageSize < logLines.length ? String(offset + pageSize) : undefined,
        }
      } catch {
        // Logs might not be available yet
        return {
          logs: [`Job "${targetJob.name}" - Status: ${targetJob.status}, Conclusion: ${targetJob.conclusion || 'in progress'}`],
          hasMore: false,
        }
      }
    } catch (error) {
      console.error('Failed to get deployment logs:', error)
      return {
        logs: [error instanceof Error ? error.message : 'Failed to get logs'],
        hasMore: false,
      }
    }
  }

  /**
   * Set custom domain for GitHub Pages
   */
  async setCustomDomain(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<CustomDomainResult> {
    const octokit = this.createOctokit(credentials)
    const { owner, repo } = this.parseProjectId(projectId)

    try {
      await octokit.rest.repos.updateInformationAboutPagesSite({
        owner,
        repo,
        cname: domain,
        https_enforced: true,
      })

      // Get DNS records for the domain
      const dnsRecords = await this.getDnsInstructions(credentials, projectId, domain)

      return {
        success: true,
        domain,
        configured: true,
        verified: false, // DNS verification happens asynchronously
        dnsRecords,
      }
    } catch (error) {
      console.error('Failed to set custom domain:', error)
      return {
        success: false,
        domain,
        configured: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Failed to set custom domain',
      }
    }
  }

  /**
   * Remove custom domain from GitHub Pages
   */
  async removeCustomDomain(
    credentials: DeploymentCredentials,
    projectId: string,
    _domain: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<boolean> {
    const octokit = this.createOctokit(credentials)
    const { owner, repo } = this.parseProjectId(projectId)

    try {
      await octokit.rest.repos.updateInformationAboutPagesSite({
        owner,
        repo,
        cname: null,
      })

      // Also try to delete the CNAME file if it exists
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: 'CNAME',
        })

        if (!Array.isArray(data) && data.sha) {
          await octokit.rest.repos.deleteFile({
            owner,
            repo,
            path: 'CNAME',
            message: 'Remove custom domain',
            sha: data.sha,
          })
        }
      } catch {
        // CNAME file might not exist
      }

      return true
    } catch (error) {
      console.error('Failed to remove custom domain:', error)
      return false
    }
  }

  /**
   * Get DNS configuration instructions for GitHub Pages custom domain
   */
  async getDnsInstructions(
    credentials: DeploymentCredentials,
    projectId: string,
    domain: string
  ): Promise<DnsRecord[]> {
    const records: DnsRecord[] = []

    // Check if this is an apex domain or subdomain
    const isApexDomain = domain.split('.').length === 2

    if (isApexDomain) {
      // Apex domain needs A records pointing to GitHub's IPs
      records.push(
        {
          type: 'A',
          name: '@',
          value: '185.199.108.153',
          ttl: 3600,
        },
        {
          type: 'A',
          name: '@',
          value: '185.199.109.153',
          ttl: 3600,
        },
        {
          type: 'A',
          name: '@',
          value: '185.199.110.153',
          ttl: 3600,
        },
        {
          type: 'A',
          name: '@',
          value: '185.199.111.153',
          ttl: 3600,
        }
      )

      // Also add AAAA records for IPv6
      records.push(
        {
          type: 'AAAA',
          name: '@',
          value: '2606:50c0:8000::153',
          ttl: 3600,
        },
        {
          type: 'AAAA',
          name: '@',
          value: '2606:50c0:8001::153',
          ttl: 3600,
        },
        {
          type: 'AAAA',
          name: '@',
          value: '2606:50c0:8002::153',
          ttl: 3600,
        },
        {
          type: 'AAAA',
          name: '@',
          value: '2606:50c0:8003::153',
          ttl: 3600,
        }
      )
    } else {
      // Subdomain uses CNAME record
      const { owner } = this.parseProjectId(projectId)
      records.push({
        type: 'CNAME',
        name: domain.split('.')[0],
        value: `${owner}.github.io`,
        ttl: 3600,
      })
    }

    // Add verification TXT record (GitHub recommends this)
    records.push({
      type: 'TXT',
      name: isApexDomain ? '@' : domain.split('.')[0],
      value: `_github-pages-challenge-${this.parseProjectId(projectId).owner}`,
      ttl: 3600,
    })

    return records
  }

  /**
   * Rollback to a previous deployment
   *
   * GitHub Pages doesn't support rollback directly.
   * Users would need to revert their git commits instead.
   */
  async rollback(
    _credentials: DeploymentCredentials, // eslint-disable-line @typescript-eslint/no-unused-vars
    _projectId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _deploymentId: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<DeploymentResult> {
    return {
      success: false,
      error: 'Rollback is not supported for GitHub Pages. Please revert your git commits to restore a previous version.',
    }
  }

  /**
   * Disable GitHub Pages for a repository
   */
  async deleteProject(
    credentials: DeploymentCredentials,
    projectId: string
  ): Promise<boolean> {
    const octokit = this.createOctokit(credentials)
    const { owner, repo } = this.parseProjectId(projectId)

    try {
      await octokit.rest.repos.deletePagesSite({
        owner,
        repo,
      })
      return true
    } catch (error) {
      console.error('Failed to disable GitHub Pages:', error)
      return false
    }
  }

  /**
   * One-click auto-setup for GitHub Pages
   * - Enables GitHub Pages with workflow source
   * - Returns the github.io URL
   * - Webhook is already configured via GitHub
   */
  async autoSetupProject(
    credentials: DeploymentCredentials,
    githubRepo: { owner: string; name: string; defaultBranch: string },
    config: AutoSetupConfig
  ): Promise<AutoSetupResult> {
    const { owner, name: repo } = githubRepo

    // Create project config for Hugo
    const projectConfig: ProjectConfig = {
      name: repo,
      framework: config.framework,
      buildCommand: 'hugo --minify',
      outputDirectory: 'public',
    }

    // Enable GitHub Pages with workflow source
    const project = await this.createProject(credentials, projectConfig, owner, repo)

    // GitHub Pages automatically deploys via GitHub Actions workflow
    // No additional webhook configuration needed
    return {
      project,
      deploymentUrl: project.productionUrl,
      webhookConfigured: true, // GitHub handles this automatically
    }
  }
}
