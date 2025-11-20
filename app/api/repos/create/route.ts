import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'

// Template repository for new blogs
const TEMPLATE_OWNER = 'jacobmr'
const TEMPLATE_REPO = 'staticpress-hugo-template'

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

    // Create repository from template
    let repo
    try {
      repo = await github.createRepositoryFromTemplate(
        TEMPLATE_OWNER,
        TEMPLATE_REPO,
        repoName,
        description || `${blogName} - A blog managed with StaticPress`,
        isPrivate ?? false
      )
      console.log(`[Create] Repository created from template: ${owner}/${repoName}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // Check for specific template errors
      if (errorMessage.includes('Not Found')) {
        throw new Error('Template repository not found. Please contact support.')
      }
      throw new Error(`Failed to create repo: ${errorMessage}`)
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
