/**
 * Client-side cache using localStorage
 * Stores posts temporarily to avoid reloading from GitHub on every refresh
 */

import { HugoPost } from './github'

interface CacheEntry<T> {
  data: T
  timestamp: number
  repoKey: string
}

const CACHE_KEY_PREFIX = 'staticpress_posts_'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Get cached posts from localStorage
 */
export function getCachedPosts(repoKey: string): HugoPost[] | null {
  if (typeof window === 'undefined') return null

  try {
    const cacheKey = CACHE_KEY_PREFIX + repoKey
    const cached = localStorage.getItem(cacheKey)

    if (!cached) return null

    const entry: CacheEntry<HugoPost[]> = JSON.parse(cached)

    // Check if cache is still fresh (within 24 hours)
    const now = Date.now()
    const age = now - entry.timestamp

    if (age > CACHE_DURATION || entry.repoKey !== repoKey) {
      // Cache expired or repo changed
      localStorage.removeItem(cacheKey)
      return null
    }

    console.log(`[Cache] Loaded ${entry.data.length} posts from localStorage (${Math.round(age / 1000 / 60)} minutes old)`)
    return entry.data
  } catch (error) {
    console.error('[Cache] Error reading from localStorage:', error)
    return null
  }
}

/**
 * Save posts to localStorage cache
 */
export function setCachedPosts(repoKey: string, posts: HugoPost[]): void {
  if (typeof window === 'undefined') return

  try {
    const cacheKey = CACHE_KEY_PREFIX + repoKey
    const entry: CacheEntry<HugoPost[]> = {
      data: posts,
      timestamp: Date.now(),
      repoKey,
    }

    localStorage.setItem(cacheKey, JSON.stringify(entry))
    console.log(`[Cache] Saved ${posts.length} posts to localStorage`)
  } catch (error) {
    console.error('[Cache] Error writing to localStorage:', error)
    // If localStorage is full, try to clear old caches
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearAllCaches()
      // Try again
      try {
        const cacheKey = CACHE_KEY_PREFIX + repoKey
        const entry: CacheEntry<HugoPost[]> = {
          data: posts,
          timestamp: Date.now(),
          repoKey,
        }
        localStorage.setItem(cacheKey, JSON.stringify(entry))
      } catch (retryError) {
        console.error('[Cache] Failed to save after clearing:', retryError)
      }
    }
  }
}

/**
 * Clear cache for a specific repository
 */
export function clearCachedPosts(repoKey: string): void {
  if (typeof window === 'undefined') return

  try {
    const cacheKey = CACHE_KEY_PREFIX + repoKey
    localStorage.removeItem(cacheKey)
    console.log('[Cache] Cleared cache for', repoKey)
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error)
  }
}

/**
 * Clear all StaticPress caches
 */
export function clearAllCaches(): void {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(localStorage)
    const staticpressKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX))

    staticpressKeys.forEach(key => {
      localStorage.removeItem(key)
    })

    console.log(`[Cache] Cleared ${staticpressKeys.length} cache(s)`)
  } catch (error) {
    console.error('[Cache] Error clearing all caches:', error)
  }
}

/**
 * Get cache age in minutes (for debugging)
 */
export function getCacheAge(repoKey: string): number | null {
  if (typeof window === 'undefined') return null

  try {
    const cacheKey = CACHE_KEY_PREFIX + repoKey
    const cached = localStorage.getItem(cacheKey)

    if (!cached) return null

    const entry: CacheEntry<HugoPost[]> = JSON.parse(cached)
    const age = Date.now() - entry.timestamp

    return Math.round(age / 1000 / 60) // minutes
  } catch (error) {
    return null
  }
}
