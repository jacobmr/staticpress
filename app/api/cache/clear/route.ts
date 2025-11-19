import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { clearCachePattern } from '@/lib/cache'
import { getRepoConfig } from '@/lib/cookies'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repoConfig = await getRepoConfig()
    if (!repoConfig) {
      return NextResponse.json({ error: 'No repository configured' }, { status: 400 })
    }

    // Clear all cache entries for this repository
    const cachePattern = `posts:${repoConfig.owner}:${repoConfig.repo}`
    clearCachePattern(cachePattern)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
