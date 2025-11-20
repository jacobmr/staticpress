import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo, contentPath, userId, userEmail, userName, userImage } = await request.json()

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Repository owner and name are required' }, { status: 400 })
    }

    // Dynamically import database functions
    const { getUserByGithubId, upsertUserRepository, logEvent, getOrCreateUser } = await import('@/lib/db')

    // Get or create user
    let user = await getUserByGithubId(userId)
    if (!user) {
      console.log('[Connect] Creating user for GitHub ID:', userId)
      user = await getOrCreateUser({
        id: userId,
        email: userEmail,
        name: userName,
        image: userImage,
      })
    }

    // Save repository configuration
    await upsertUserRepository(user.id, {
      owner,
      repo,
      contentPath: contentPath || 'content/posts',
    })

    // Log event
    await logEvent('repo_bound', user.id, {
      repository: `${owner}/${repo}`,
      content_path: contentPath || 'content/posts',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error connecting repository:', error)
    return NextResponse.json(
      { error: 'Failed to connect repository' },
      { status: 500 }
    )
  }
}
