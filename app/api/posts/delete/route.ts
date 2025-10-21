import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'
import { getRepoConfig } from '@/lib/cookies'
import { clearCachePattern } from '@/lib/cache'

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'
    const { rateLimitCheck } = await import('@/lib/cache')
    if (!rateLimitCheck(`delete:${ip}`, 10, 60)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { path } = body

    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 })
    }

    const repoConfig = await getRepoConfig()

    if (!repoConfig) {
      return NextResponse.json({ error: 'Repository not configured' }, { status: 400 })
    }

    const github = new GitHubClient(session.accessToken)

    // Get file SHA (required for delete)
    const fileData = await github.getRepoContents(repoConfig.owner, repoConfig.repo, path)

    if (!fileData || fileData.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const file = fileData[0]
    if (file.type !== 'file' || !file.sha) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 })
    }

    // Delete the file
    const fileName = path.split('/').pop() || 'post'
    await github.deleteFile(
      repoConfig.owner,
      repoConfig.repo,
      path,
      `Delete post: ${fileName}`,
      file.sha
    )

    // Clear cache for all tiers of this repo
    clearCachePattern(`posts:${repoConfig.owner}:${repoConfig.repo}:`)

    // Dynamically import database functions to prevent build-time initialization
    const { getUserByGithubId, logEvent } = await import('@/lib/db')

    // Log post deleted event
    const user = await getUserByGithubId(session.user.id)
    if (user) {
      await logEvent('post_deleted', user.id, {
        path,
        file_name: fileName,
      })
    }

    return NextResponse.json({
      success: true,
      path,
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
