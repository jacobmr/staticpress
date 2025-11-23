/**
 * Deployment Module
 *
 * Provides unified deployment functionality across multiple platforms:
 * - GitHub Pages
 * - Vercel
 * - Netlify
 * - Cloudflare Pages
 */

// Types
export type {
  DeploymentPlatform,
  DeploymentStatus,
  DeploymentCredentials,
  DeploymentProject,
  DeploymentResult,
  DeploymentStatusResult,
  DeploymentLogsResult,
  CustomDomainResult,
  DnsRecord,
  ProjectConfig,
  ProviderCapabilities,
  DeploymentProvider,
  DeploymentPlatformRecord,
  DeploymentProjectRecord,
  DeploymentHistoryRecord,
} from './types'

// Registry functions
export {
  getDeploymentProvider,
  getAllProviders,
  getProviderCapabilities,
  validatePlatformCredentials,
  getPlatformInfo,
  getAllPlatformInfo,
} from './registry'
