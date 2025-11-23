import NodeCache from 'node-cache'

// Cache for 24 hours (86400 seconds)
// This is just for performance - GitHub repo is the source of truth
const cache = new NodeCache({ stdTTL: 86400 })

export function getCached<T>(key: string): T | undefined {
  return cache.get<T>(key)
}

export function setCached<T>(key: string, value: T): void {
  cache.set(key, value)
}

export function clearCache(key?: string): void {
  if (key) {
    cache.del(key)
  } else {
    cache.flushAll()
  }
}

export function clearCachePattern(pattern: string): void {
  const keys = cache.keys()
  const matchingKeys = keys.filter(key => key.startsWith(pattern))
  matchingKeys.forEach(key => cache.del(key))
}

export function addUniqueKey(key: string, ttlSeconds: number): boolean {
  if (cache.get(key)) return false
  cache.set(key, true, ttlSeconds)
  return true
}

export function rateLimitCheck(key: string, limit: number, windowSeconds: number): boolean {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds)
  const compositeKey = `ratelimit:${key}:${bucket}`
  const current = (cache.get<number>(compositeKey) || 0) as number
  if (current >= limit) return false
  cache.set(compositeKey, current + 1, windowSeconds)
  return true
}

/**
 * Per-user rate limiting (in addition to IP-based)
 */
export function userRateLimitCheck(
  userId: number | string,
  action: string,
  limit: number,
  windowSeconds: number
): boolean {
  const key = `user:${userId}:${action}`
  return rateLimitCheck(key, limit, windowSeconds)
}

/**
 * Rate limit configuration for different actions
 */
export const RATE_LIMITS = {
  publish: { limit: 30, window: 3600 },      // 30 posts/hour
  imageUpload: { limit: 50, window: 3600 },  // 50 images/hour
  themeChange: { limit: 10, window: 3600 },  // 10 changes/hour
  configFix: { limit: 20, window: 3600 },    // 20 fixes/hour
  delete: { limit: 30, window: 3600 },       // 30 deletes/hour
}

/**
 * Create a safe cache key that handles special characters
 */
export function createCacheKey(type: string, ...parts: string[]): string {
  const safeParts = parts.map(part =>
    encodeURIComponent(part).replace(/[.]/g, '%2E')
  )
  return `${type}:${safeParts.join(':')}`
}
