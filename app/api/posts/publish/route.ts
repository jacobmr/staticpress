import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'
import { getRepoConfig } from '@/lib/cookies'
import { generateHugoPath, generateFrontmatter } from '@/lib/hugo'
import { clearCache } from '@/lib/cache'
import { getUserByGithubId, logEvent, supabase } from '@/lib/db'
import TurndownService from 'turndown'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

export async function POST(request: Request) {
  try {
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

    // Convert HTML to markdown
    const markdownContent = turndownService.turndown(content)

    // Generate path for new posts or use existing path
    const filePath = path || generateHugoPath(title)

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

    // Create frontmatter and combine with content
    const frontmatter = generateFrontmatter({
      title,
      date: new Date().toISOString(),
      draft,
    })

    const fileContent = `${frontmatter}\n\n${markdownContent}`

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

    // Clear cache so next load gets fresh data
    clearCache(`posts:${repoConfig.owner}:${repoConfig.repo}`)

    // Log post published event
    const user = await getUserByGithubId(session.user.id)
    if (user) {
      await logEvent('post_published', user.id, {
        title,
        path: filePath,
        draft,
        is_update: !!path,
      })

      // Check if this is the user's first publish
      const { data: previousPublishes } = await supabase
        .from('analytics_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_name', 'post_published')
        .limit(2)

      if (previousPublishes && previousPublishes.length === 1) {
        // This is their first publish!
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
