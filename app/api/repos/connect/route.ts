import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { connectRepoSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body with Zod
    const body = await request.json()
    const parseResult = connectRepoSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const {
      owner,
      repo,
      contentPath,
      engine,
      theme,
      siteUrl,
      userId,
      userEmail,
      userName,
      userImage,
    } = parseResult.data

    // Dynamically import database functions
    const { getUserByGithubId, upsertUserRepository, logEvent, getOrCreateUser } = await import('@/lib/db')

    // Use session userId, falling back to provided userId
    const githubUserId = session.user.id as string

    // Get or create user
    let user = await getUserByGithubId(githubUserId)
    if (!user) {
      logger.info('[Connect] Creating user for GitHub ID:', { userId: githubUserId })
      user = await getOrCreateUser({
        id: githubUserId,
        email: userEmail || session.user.email || '',
        name: userName || session.user.name,
        image: userImage || session.user.image,
      })
    }

    // Save repository configuration with detected values
    await upsertUserRepository(user.id, {
      owner,
      repo,
      contentPath: contentPath || 'content/posts',
      engine: engine || 'hugo',
      theme: theme || undefined,
      siteUrl: siteUrl && siteUrl.length > 0 ? siteUrl : undefined,
    })

    // Log event with full context
    await logEvent('repo_bound', user.id, {
      repository: `${owner}/${repo}`,
      content_path: contentPath || 'content/posts',
      engine: engine || 'hugo',
      theme: theme || 'unknown',
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
