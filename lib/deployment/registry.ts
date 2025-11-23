/**
 * Deployment Provider Registry
 *
 * Central registry for all deployment providers. Provides factory methods
 * for getting providers by platform type.
 */

import type {
  DeploymentPlatform,
  DeploymentProvider,
  DeploymentCredentials,
  ProviderCapabilities,
} from './types'

// Provider implementations will be lazy-loaded to prevent build-time issues
let providers: Map<DeploymentPlatform, DeploymentProvider> | null = null

async function loadProviders(): Promise<Map<DeploymentPlatform, DeploymentProvider>> {
  if (providers) return providers

  providers = new Map()

  // Lazy load each provider to prevent build-time initialization issues
  const [
    { GitHubPagesProvider },
    { VercelProvider },
    { NetlifyProvider },
    { CloudflareProvider },
  ] = await Promise.all([
    import('./providers/github-pages'),
    import('./providers/vercel'),
    import('./providers/netlify'),
    import('./providers/cloudflare'),
  ])

  providers.set('github-pages', new GitHubPagesProvider())
  providers.set('vercel', new VercelProvider())
  providers.set('netlify', new NetlifyProvider())
  providers.set('cloudflare', new CloudflareProvider())

  return providers
}

/**
 * Get a deployment provider by platform type
 */
export async function getDeploymentProvider(
  platform: DeploymentPlatform
): Promise<DeploymentProvider> {
  const providerMap = await loadProviders()
  const provider = providerMap.get(platform)

  if (!provider) {
    throw new Error(`Unknown deployment platform: ${platform}`)
  }

  return provider
}

/**
 * Get all available deployment providers
 */
export async function getAllProviders(): Promise<DeploymentProvider[]> {
  const providerMap = await loadProviders()
  return Array.from(providerMap.values())
}

/**
 * Get provider capabilities for a platform
 */
export async function getProviderCapabilities(
  platform: DeploymentPlatform
): Promise<ProviderCapabilities> {
  const provider = await getDeploymentProvider(platform)
  return provider.capabilities
}

/**
 * Validate credentials for a platform
 */
export async function validatePlatformCredentials(
  credentials: DeploymentCredentials
): Promise<boolean> {
  const provider = await getDeploymentProvider(credentials.platform)
  return provider.validateCredentials(credentials)
}

/**
 * Get platform display information
 */
export function getPlatformInfo(platform: DeploymentPlatform): {
  name: string
  description: string
  icon: string
  docsUrl: string
} {
  const platformInfo: Record<DeploymentPlatform, {
    name: string
    description: string
    icon: string
    docsUrl: string
  }> = {
    'github-pages': {
      name: 'GitHub Pages',
      description: 'Free hosting directly from your GitHub repository',
      icon: 'github',
      docsUrl: 'https://docs.github.com/pages',
    },
    vercel: {
      name: 'Vercel',
      description: 'Fast global edge network with automatic SSL',
      icon: 'vercel',
      docsUrl: 'https://vercel.com/docs',
    },
    netlify: {
      name: 'Netlify',
      description: 'All-in-one platform for web projects',
      icon: 'netlify',
      docsUrl: 'https://docs.netlify.com',
    },
    cloudflare: {
      name: 'Cloudflare Pages',
      description: 'JAMstack platform with global CDN',
      icon: 'cloudflare',
      docsUrl: 'https://developers.cloudflare.com/pages',
    },
  }

  return platformInfo[platform]
}

/**
 * Get all supported platforms with display info
 */
export function getAllPlatformInfo(): Array<{
  platform: DeploymentPlatform
  name: string
  description: string
  icon: string
  docsUrl: string
}> {
  const platforms: DeploymentPlatform[] = ['github-pages', 'vercel', 'netlify', 'cloudflare']

  return platforms.map(platform => ({
    platform,
    ...getPlatformInfo(platform),
  }))
}
