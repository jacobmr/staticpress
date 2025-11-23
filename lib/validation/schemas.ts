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
  metadata: z.record(z.unknown()).optional(),
})

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>

// Favicon upload schema
export const faviconUploadSchema = z.object({
  content: z.string().min(1, 'Image content is required'),
  contentType: z.string().regex(/^image\/(png|x-icon|vnd.microsoft.icon|svg\+xml)$/, 'Invalid favicon type'),
})

export type FaviconUploadInput = z.infer<typeof faviconUploadSchema>
