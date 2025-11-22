import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'
import { getRepoConfig } from '@/lib/cookies'
import {
  generateHugoPath,
  generateFrontmatter,
  extractFirstImageUrl,
  generateKremsPath,
  generateKremsFrontmatter
} from '@/lib/hugo'
import { clearCachePattern } from '@/lib/cache'
import TurndownService from 'turndown'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})
turndownService.keep(['img'])

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'
    const { rateLimitCheck } = await import('@/lib/cache')
    if (!rateLimitCheck(`publish:${ip}`, 10, 60)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repoConfig = await getRepoConfig()

    if (!repoConfig) {
      return NextResponse.json({ error: 'No repository configured' }, { status: 400 })
    }

    const { title, content, path, draft = false } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const github = new GitHubClient(session.accessToken)

    // Extract first image URL from HTML content for featured image
    const featureImageUrl = extractFirstImageUrl(content)

    // Convert HTML to markdown
    const markdownContent = turndownService.turndown(content)
    console.log('Generated Markdown:', markdownContent)

    // Determine engine (default to hugo for existing repos)
    const engine = repoConfig.engine || 'hugo'

    // Generate path for new posts or use existing path
    let filePath: string
    if (path) {
      filePath = path
    } else if (engine === 'krems') {
      filePath = generateKremsPath(title)
    } else {
      filePath = generateHugoPath(title)
    }

    // Get existing file SHA if updating
    let existingSha: string | undefined
    if (path) {
      const existingContent = await github.getFileContent(repoConfig.owner, repoConfig.repo, path)
      if (existingContent) {
        // Extract SHA from the file
        const fileData = await github.getRepoContents(repoConfig.owner, repoConfig.repo, path)
        if (fileData.length > 0 && !Array.isArray(fileData[0])) {
          existingSha = fileData[0].sha
        }
      }
    }

    // Create frontmatter based on engine
    let frontmatter: string
    if (engine === 'krems') {
      // Krems doesn't support draft mode
      const frontmatterData = {
        title,
        date: new Date().toISOString(),
      }
      frontmatter = generateKremsFrontmatter(frontmatterData)
    } else {
      // Hugo with draft support
      const frontmatterData = {
        title,
        date: new Date().toISOString(),
        draft,
        ...(featureImageUrl && { featureimage: featureImageUrl }),
      }
      frontmatter = generateFrontmatter(frontmatterData)
    }

    const fileContent = `${frontmatter}\n\n${markdownContent}`
    console.log('Final file content to save:', fileContent)

    // Commit to GitHub
    const commitMessage = path
      ? `Update post: ${title}`
      : `Create post: ${title}`

    const result = await github.createOrUpdateFile(
      repoConfig.owner,
      repoConfig.repo,
      filePath,
      fileContent,
      commitMessage,
      existingSha
    )

    // Clear cache for all tiers of this repo
    clearCachePattern(`posts:${repoConfig.owner}:${repoConfig.repo}:`)

    // Dynamically import database functions to prevent build-time initialization
    const { getUserByGithubId, logEvent, getSupabaseClient } = await import('@/lib/db')

    // Check if this is the user's first publish BEFORE logging the event
    const user = await getUserByGithubId(session.user.id)
    if (user) {
      const supabase = await getSupabaseClient()
      const { data: previousPublishes } = await supabase
        .from('analytics_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_name', 'post_published')
        .limit(1)

      const isFirstPublish = !previousPublishes || previousPublishes.length === 0

      // Log post published event
      await logEvent('post_published', user.id, {
        title,
        path: filePath,
        draft,
        is_update: !!path,
      })

      if (isFirstPublish) {
        await logEvent('first_publish', user.id, {
          title,
          path: filePath,
        })
      }
    }

    return NextResponse.json({
      success: true,
      path: filePath,
      sha: result.content?.sha,
    })
  } catch (error) {
    console.error('Error publishing post:', error)
    return NextResponse.json(
      { error: 'Failed to publish post' },
      { status: 500 }
    )
  }
}
