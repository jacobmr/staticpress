import NodeCache from 'node-cache'

// Cache for 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300 })

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
