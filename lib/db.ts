import { sql } from '@vercel/postgres'

export interface User {
  id: number
  github_id: string
  email: string
  name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'pro'
  subscription_status: 'active' | 'canceled' | 'expired' | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: Date
  updated_at: Date
}

export interface Repository {
  id: number
  user_id: number
  owner: string
  repo: string
  content_path: string
  theme: string | null
  created_at: Date
  updated_at: Date
}

export interface UsageTracking {
  id: number
  user_id: number
  posts_edited_count: number
  last_reset_date: Date
}

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
  const existingUser = await sql<User>`
    SELECT * FROM users WHERE github_id = ${githubUser.id}
  `

  if (existingUser.rows.length > 0) {
    // Update user info in case it changed
    const updated = await sql<User>`
      UPDATE users
      SET
        email = ${githubUser.email},
        name = ${githubUser.name || null},
        avatar_url = ${githubUser.image || null},
        updated_at = NOW()
      WHERE github_id = ${githubUser.id}
      RETURNING *
    `
    return updated.rows[0]
  }

  // Create new user
  const newUser = await sql<User>`
    INSERT INTO users (github_id, email, name, avatar_url, subscription_tier)
    VALUES (${githubUser.id}, ${githubUser.email}, ${githubUser.name || null}, ${githubUser.image || null}, 'free')
    RETURNING *
  `

  return newUser.rows[0]
}

/**
 * Get user's repository configuration
 */
export async function getUserRepository(userId: number): Promise<Repository | null> {
  const result = await sql<Repository>`
    SELECT * FROM repositories
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `

  return result.rows[0] || null
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
  const existing = await sql<Repository>`
    SELECT * FROM repositories
    WHERE user_id = ${userId} AND owner = ${repoConfig.owner} AND repo = ${repoConfig.repo}
  `

  if (existing.rows.length > 0) {
    // Update existing
    const updated = await sql<Repository>`
      UPDATE repositories
      SET
        content_path = ${repoConfig.contentPath},
        theme = ${repoConfig.theme || null},
        updated_at = NOW()
      WHERE id = ${existing.rows[0].id}
      RETURNING *
    `
    return updated.rows[0]
  }

  // Create new
  const newRepo = await sql<Repository>`
    INSERT INTO repositories (user_id, owner, repo, content_path, theme)
    VALUES (${userId}, ${repoConfig.owner}, ${repoConfig.repo}, ${repoConfig.contentPath}, ${repoConfig.theme || null})
    RETURNING *
  `

  return newRepo.rows[0]
}

/**
 * Get or create usage tracking for user
 */
export async function getOrCreateUsageTracking(userId: number): Promise<UsageTracking> {
  const existing = await sql<UsageTracking>`
    SELECT * FROM usage_tracking WHERE user_id = ${userId}
  `

  if (existing.rows.length > 0) {
    return existing.rows[0]
  }

  const newTracking = await sql<UsageTracking>`
    INSERT INTO usage_tracking (user_id, posts_edited_count, last_reset_date)
    VALUES (${userId}, 0, NOW())
    RETURNING *
  `

  return newTracking.rows[0]
}

/**
 * Increment post edit count for user
 */
export async function incrementPostEditCount(userId: number): Promise<void> {
  await sql`
    UPDATE usage_tracking
    SET posts_edited_count = posts_edited_count + 1
    WHERE user_id = ${userId}
  `
}

/**
 * Check if user can edit posts (free tier has 5 post limit)
 */
export async function canUserEditPosts(userId: number): Promise<boolean> {
  const user = await sql<User>`
    SELECT subscription_tier FROM users WHERE id = ${userId}
  `

  if (user.rows.length === 0) return false

  // Pro users can edit unlimited posts
  if (user.rows[0].subscription_tier === 'pro') {
    return true
  }

  // Free users are limited to 5 most recent posts
  // This will be enforced in the UI/API layer
  return true
}
