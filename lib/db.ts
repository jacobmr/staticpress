import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface User {
  id: number
  github_id: string
  email: string
  name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'personal' | 'smb' | 'pro'
  subscription_status: 'active' | 'canceled' | 'expired' | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface Repository {
  id: number
  user_id: number
  owner: string
  repo: string
  content_path: string
  theme: string | null
  created_at: string
  updated_at: string
}

export interface UsageTracking {
  id: number
  user_id: number
  posts_edited_count: number
  last_reset_date: string
}

export interface AnalyticsEvent {
  id: number
  event_name: string
  user_id: number | null
  metadata: Record<string, unknown>
  created_at: string
}

export type EventName =
  | 'oauth_completed'
  | 'repo_bound'
  | 'first_publish'
  | 'upgrade_modal_shown'
  | 'upgrade_started'
  | 'upgrade_completed'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'image_upload'
  | 'post_published'
  | 'post_deleted'

/**
 * Get or create user by GitHub ID
 */
export async function getOrCreateUser(githubUser: {
  id: string
  email: string
  name?: string | null
  image?: string | null
}): Promise<User> {
  // Try to find existing user
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('github_id', githubUser.id)
    .single()

  if (existingUser && !fetchError) {
    // Update user info in case it changed
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        email: githubUser.email,
        name: githubUser.name || null,
        avatar_url: githubUser.image || null,
        updated_at: new Date().toISOString(),
      })
      .eq('github_id', githubUser.id)
      .select()
      .single()

    if (updateError) throw updateError
    return updated as User
  }

  // Create new user
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      github_id: githubUser.id,
      email: githubUser.email,
      name: githubUser.name || null,
      avatar_url: githubUser.image || null,
      subscription_tier: 'free',
    })
    .select()
    .single()

  if (createError) throw createError
  return newUser as User
}

/**
 * Get user's repository configuration
 */
export async function getUserRepository(userId: number): Promise<Repository | null> {
  const { data, error } = await supabase
    .from('repositories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data as Repository | null
}

/**
 * Create or update user's repository configuration
 */
export async function upsertUserRepository(
  userId: number,
  repoConfig: {
    owner: string
    repo: string
    contentPath: string
    theme?: string
  }
): Promise<Repository> {
  // Check if repository already exists
  const { data: existing, error: fetchError } = await supabase
    .from('repositories')
    .select('*')
    .eq('user_id', userId)
    .eq('owner', repoConfig.owner)
    .eq('repo', repoConfig.repo)
    .single()

  if (existing && !fetchError) {
    // Update existing
    const { data: updated, error: updateError } = await supabase
      .from('repositories')
      .update({
        content_path: repoConfig.contentPath,
        theme: repoConfig.theme || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) throw updateError
    return updated as Repository
  }

  // Create new
  const { data: newRepo, error: createError } = await supabase
    .from('repositories')
    .insert({
      user_id: userId,
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      content_path: repoConfig.contentPath,
      theme: repoConfig.theme || null,
    })
    .select()
    .single()

  if (createError) throw createError
  return newRepo as Repository
}

/**
 * Get or create usage tracking for user
 */
export async function getOrCreateUsageTracking(userId: number): Promise<UsageTracking> {
  const { data: existing, error: fetchError } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing && !fetchError) {
    return existing as UsageTracking
  }

  const { data: newTracking, error: createError } = await supabase
    .from('usage_tracking')
    .insert({
      user_id: userId,
      posts_edited_count: 0,
      last_reset_date: new Date().toISOString(),
    })
    .select()
    .single()

  if (createError) throw createError
  return newTracking as UsageTracking
}

/**
 * Increment post edit count for user
 */
export async function incrementPostEditCount(userId: number): Promise<void> {
  const { error } = await supabase.rpc('increment_post_count', {
    user_id_param: userId,
  })

  if (error) {
    // Fallback if RPC function doesn't exist
    const tracking = await getOrCreateUsageTracking(userId)
    await supabase
      .from('usage_tracking')
      .update({
        posts_edited_count: tracking.posts_edited_count + 1,
      })
      .eq('user_id', userId)
  }
}

/**
 * Check if user can edit posts (free tier has 5 post limit)
 */
export async function canUserEditPosts(userId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (error || !data) return false

  // All paid tiers (personal, smb, pro) can edit unlimited posts
  if (data.subscription_tier !== 'free') {
    return true
  }

  // Free users are limited to 5 most recent posts
  // This will be enforced in the UI/API layer
  return true
}

/**
 * Check if user has access to a specific tier feature
 */
export function hasFeatureAccess(
  userTier: User['subscription_tier'],
  feature: 'images' | 'all_posts' | 'custom_domain' | 'themes' | 'multi_repo'
): boolean {
  const tierLevel = {
    free: 0,
    personal: 1,
    smb: 2,
    pro: 3,
  }

  const featureRequirements = {
    images: 1, // personal+
    all_posts: 1, // personal+
    custom_domain: 2, // smb+
    themes: 2, // smb+
    multi_repo: 3, // pro only
  }

  return tierLevel[userTier] >= featureRequirements[feature]
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data as User
}

/**
 * Get user by GitHub ID
 */
export async function getUserByGithubId(githubId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('github_id', githubId)
    .single()

  if (error) return null
  return data as User
}

/**
 * Log analytics event (server-side only, no PII)
 */
export async function logEvent(
  eventName: EventName,
  userId: number | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      user_id: userId,
      metadata,
    })
  } catch (error) {
    // Don't throw - event logging should never break the app
    console.error('Failed to log event:', eventName, error)
  }
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(userId: number): Promise<User['subscription_tier'] | null> {
  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data.subscription_tier
}
