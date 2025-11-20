import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'
import { getRepoConfig } from '@/lib/cookies'
import { getUserByGithubId, updateRepositorySiteUrl } from '@/lib/db'

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

    const { customDomain } = await request.json()
    const { owner, repo } = repoConfig

    const github = new GitHubClient(session.accessToken)

    // Enable GitHub Pages with workflow source
    console.log(`[Deploy] Enabling GitHub Pages for ${owner}/${repo}`)
    await github.enableGitHubPages(owner, repo)

    // Set custom domain if provided
    if (customDomain && customDomain.trim()) {
      console.log(`[Deploy] Setting custom domain: ${customDomain}`)
      await github.setCustomDomain(owner, repo, customDomain.trim())
    }

    // Get the Pages status to return the URL
    // Wait a moment for GitHub to process
    await new Promise(resolve => setTimeout(resolve, 2000))

    const status = await github.getGitHubPagesStatus(owner, repo)

    // Determine the URL
    let siteUrl: string
    if (customDomain && customDomain.trim()) {
      siteUrl = `https://${customDomain.trim()}`
    } else {
      siteUrl = `https://${owner}.github.io/${repo}`
    }

    // Save site URL to database
    const user = await getUserByGithubId(session.user.id as string)
    if (user) {
      await updateRepositorySiteUrl(user.id, owner, repo, siteUrl)
    }

    return NextResponse.json({
      success: true,
      url: siteUrl,
      status: status?.status || 'building',
      customDomain: customDomain?.trim() || null,
    })
  } catch (error) {
    console.error('Error enabling GitHub Pages:', error)

    let errorMessage = 'Failed to enable GitHub Pages'
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        errorMessage = 'Repository not found'
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Make sure your GitHub token has the required scopes.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
