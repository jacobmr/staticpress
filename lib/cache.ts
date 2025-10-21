import NodeCache from 'node-cache'

// Cache for 30 minutes (1800 seconds)
const cache = new NodeCache({ stdTTL: 1800 })

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
