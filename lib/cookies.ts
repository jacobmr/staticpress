import { auth } from './auth'
import type { BlogEngine } from './db'

export interface RepoConfig {
  owner: string
  repo: string
  contentPath?: string // e.g., "content/posts"
  engine?: BlogEngine // 'hugo' or 'krems'
  siteUrl?: string | null // Published site URL
  theme?: string // Hugo theme name
}

/**
 * Get repository configuration for the currently authenticated user
 */
export async function getRepoConfig(): Promise<RepoConfig | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  // Dynamically import database functions to prevent build-time initialization
  const { getUserRepository, getUserByGithubId } = await import('./db')

  // Get user from database
  const user = await getUserByGithubId(session.user.id)
  if (!user) {
    return null
  }

  // Get repository configuration
  const repository = await getUserRepository(user.id)
  if (!repository) {
    return null
  }

  return {
    owner: repository.owner,
    repo: repository.repo,
    contentPath: repository.content_path,
    engine: repository.engine || 'hugo', // Default to hugo for existing repos
    siteUrl: repository.site_url,
    theme: repository.theme ?? undefined,
  }
}

/**
 * Set repository configuration for the currently authenticated user
 * Note: This function is kept for backward compatibility but doesn't actually do anything.
 * Use upsertUserRepository from lib/db.ts directly instead.
 */
export async function setRepoConfig(config: RepoConfig) {
  // This function is now deprecated - repository configuration should be set
  // via upsertUserRepository in lib/db.ts using the server action in setup page
  console.warn('setRepoConfig is deprecated - use upsertUserRepository from lib/db.ts instead')
}

/**
 * Clear repository configuration
 * Note: This function is kept for backward compatibility but doesn't actually do anything.
 * Repository data persists in the database.
 */
export async function clearRepoConfig() {
  // This function is now deprecated - repository configuration persists in database
  console.warn('clearRepoConfig is deprecated - repository data persists in database')
}
