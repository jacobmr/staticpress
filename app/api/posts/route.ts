import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'
import { getRepoConfig } from '@/lib/cookies'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repoConfig = await getRepoConfig()

    if (!repoConfig) {
      return NextResponse.json({ error: 'No repository configured' }, { status: 400 })
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get user tier to enforce limits
    const { getUserByGithubId } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)

    // Free tier limited to 5 posts
    const maxLimit = user?.subscription_tier === 'free' ? 5 : 50
    const effectiveLimit = Math.min(limit, maxLimit)

    const github = new GitHubClient(session.accessToken)
    const allPosts = await github.getHugoPosts(
      repoConfig.owner,
      repoConfig.repo,
      repoConfig.contentPath || 'content/posts',
      maxLimit
    )

    // Apply offset and limit for pagination
    const paginatedPosts = allPosts.slice(offset, offset + effectiveLimit)

    return NextResponse.json({
      posts: paginatedPosts,
      total: allPosts.length,
      hasMore: offset + effectiveLimit < allPosts.length
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
