import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { blogName, description, isPrivate } = await request.json()

    if (!blogName) {
      return NextResponse.json({ error: 'Blog name is required' }, { status: 400 })
    }

    // Sanitize blog name for use as repo name
    const repoName = blogName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!repoName) {
      return NextResponse.json({ error: 'Invalid blog name' }, { status: 400 })
    }

    const github = new GitHubClient(session.accessToken)

    // Get authenticated user to get owner name
    let owner: string
    try {
      const user = await github.getAuthenticatedUser()
      owner = user.login
      console.log(`[Create] Got user: ${owner}`)
    } catch (error) {
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Create the repository
    let repo
    try {
      repo = await github.createRepository(
        repoName,
        description || `${blogName} - A blog managed with StaticPress`,
        isPrivate ?? false
      )
      console.log(`[Create] Repository created: ${owner}/${repoName}`)
    } catch (error) {
      throw new Error(`Failed to create repo: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Initialize Hugo project structure with retries
    let initialized = false
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        // Wait before retry attempts (exponential backoff)
        if (attempt > 1) {
          const delay = Math.pow(2, attempt) * 1000 // 4s, 8s, 16s, 32s
          console.log(`[Create] Retry ${attempt}/5, waiting ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        await github.initializeHugoProject(owner, repoName, blogName)
        console.log(`[Create] Hugo project initialized on attempt ${attempt}`)
        initialized = true
        break
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.log(`[Create] Attempt ${attempt} failed: ${lastError.message}`)
      }
    }

    if (!initialized) {
      throw new Error(`Failed to initialize Hugo after 5 attempts: ${lastError?.message || 'Unknown error'}`)
    }

    // Get or create user in database and save repo config
    const { getUserByGithubId, upsertUserRepository, logEvent } = await import('@/lib/db')

    const dbUser = await getUserByGithubId(session.user.id)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 400 })
    }

    // Save repository configuration
    await upsertUserRepository(dbUser.id, {
      owner,
      repo: repoName,
      contentPath: 'content/posts',
    })

    // Log event
    await logEvent('repo_created', dbUser.id, {
      repository: `${owner}/${repoName}`,
      blog_name: blogName,
    })

    return NextResponse.json({
      success: true,
      repository: {
        owner,
        repo: repoName,
        fullName: `${owner}/${repoName}`,
        url: repo.html_url,
      },
    })
  } catch (error) {
    console.error('Error creating repository:', error)

    // Extract error message
    let errorMessage = 'Failed to create repository'

    if (error instanceof Error) {
      // Check for specific GitHub errors
      if (error.message.includes('name already exists')) {
        errorMessage = 'A repository with this name already exists'
      } else if (error.message.includes('could not be cloned')) {
        errorMessage = 'Repository created but initialization failed'
      } else {
        // Pass through the actual error for debugging
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
