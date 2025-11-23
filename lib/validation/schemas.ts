import { z } from 'zod'

// Post publish schema
export const publishPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(100000, 'Content too long'),
  path: z.string().optional(),
  draft: z.boolean().default(false),
})

export type PublishPostInput = z.infer<typeof publishPostSchema>

// Post delete schema
export const deletePostSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  sha: z.string().min(1, 'SHA is required'),
})

export type DeletePostInput = z.infer<typeof deletePostSchema>

// Repository connect schema
export const connectRepoSchema = z.object({
  owner: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-]+$/, 'Invalid owner name'),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_.]+$/, 'Invalid repo name'),
  contentPath: z.string().max(500).default('content/posts'),
  engine: z.enum(['hugo', 'krems']).default('hugo'),
  theme: z.string().optional(),
})

export type ConnectRepoInput = z.infer<typeof connectRepoSchema>

// Repository create schema
export const createRepoSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_.]+$/, 'Invalid repo name'),
  description: z.string().max(500).optional(),
  private: z.boolean().default(false),
  theme: z.string().optional(),
})

export type CreateRepoInput = z.infer<typeof createRepoSchema>

// Theme change schema
export const changeThemeSchema = z.object({
  themeId: z.string().min(1, 'Theme ID is required'),
})

export type ChangeThemeInput = z.infer<typeof changeThemeSchema>

// Image upload schema
export const uploadImageSchema = z.object({
  filename: z.string().min(1).max(255).regex(/^[a-zA-Z0-9-_.]+$/, 'Invalid filename'),
  content: z.string().min(1, 'Image content is required'),
  contentType: z.string().regex(/^image\/(jpeg|png|gif|webp|svg\+xml)$/, 'Invalid image type'),
})

export type UploadImageInput = z.infer<typeof uploadImageSchema>

// Feedback schema
export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general']),
  message: z.string().min(10, 'Message too short').max(5000, 'Message too long'),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>

// Analytics event schema
export const analyticsEventSchema = z.object({
  event: z.string().min(1).max(100),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>

// Favicon upload schema
export const faviconUploadSchema = z.object({
  content: z.string().min(1, 'Image content is required'),
  contentType: z.string().regex(/^image\/(png|x-icon|vnd.microsoft.icon|svg\+xml)$/, 'Invalid favicon type'),
})

export type FaviconUploadInput = z.infer<typeof faviconUploadSchema>

// Deployment platform schema
export const deploymentPlatformSchema = z.enum(['github-pages', 'vercel', 'netlify', 'cloudflare'])

export type DeploymentPlatformInput = z.infer<typeof deploymentPlatformSchema>

// Connect platform schema
export const connectPlatformSchema = z.object({
  platform: deploymentPlatformSchema,
  accessToken: z.string().min(1, 'Access token is required'),
  teamId: z.string().optional(),
  accountId: z.string().optional(),
})

export type ConnectPlatformInput = z.infer<typeof connectPlatformSchema>

// Create deployment project schema
export const createDeploymentProjectSchema = z.object({
  platform: deploymentPlatformSchema,
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_.]+$/, 'Invalid project name'),
  repositoryId: z.number().int().positive('Repository ID is required'),
  framework: z.enum(['hugo', 'other'] as const).default('hugo'),
  buildCommand: z.string().max(500).default('hugo --gc --minify'),
  outputDirectory: z.string().max(200).default('public'),
  environmentVariables: z.record(z.string(), z.string()).optional(),
  rootDirectory: z.string().max(200).optional(),
})

export type CreateDeploymentProjectInput = z.infer<typeof createDeploymentProjectSchema>

// Deploy schema
export const deploySchema = z.object({
  branch: z.string().max(100).optional(),
  commitSha: z.string().max(40).optional(),
  isProduction: z.boolean().default(true),
})

export type DeployInput = z.infer<typeof deploySchema>

// Add custom domain schema
export const addDomainSchema = z.object({
  domain: z.string().min(1).max(253).regex(
    /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    'Invalid domain format'
  ),
})

export type AddDomainInput = z.infer<typeof addDomainSchema>

// Remove custom domain schema
export const removeDomainSchema = z.object({
  domain: z.string().min(1).max(253),
})

export type RemoveDomainInput = z.infer<typeof removeDomainSchema>

// OAuth callback schema
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State is required'),
})
