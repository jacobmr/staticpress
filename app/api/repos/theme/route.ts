import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'
import { getRepoConfig } from '@/lib/cookies'
import { getThemeById } from '@/lib/themes'

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

    const { theme } = await request.json()

    if (!theme) {
      return NextResponse.json({ error: 'Theme is required' }, { status: 400 })
    }

    const themeInfo = getThemeById(theme)
    if (!themeInfo) {
      return NextResponse.json({ error: 'Invalid theme selected' }, { status: 400 })
    }

    const { owner, repo } = repoConfig
    const github = new GitHubClient(session.accessToken)

    // Update hugo.toml with the new theme
    try {
      const contents = await github.getRepoContents(owner, repo, 'hugo.toml')
      if (contents.length > 0 && !Array.isArray(contents[0]) && 'sha' in contents[0]) {
        const currentContent = await github.getFileContent(owner, repo, 'hugo.toml')
        if (currentContent) {
          // Replace theme line in the config
          const updatedContent = currentContent.replace(
            /^theme\s*=\s*["']?[^"'\n]+["']?$/m,
            `theme = "${theme}"`
          )

          await github.createOrUpdateFile(
            owner,
            repo,
            'hugo.toml',
            updatedContent,
            `Change theme to ${theme}`,
            contents[0].sha as string
          )
        }
      }
    } catch (error) {
      console.error('Error updating hugo.toml:', error)
      // Continue - we'll still try to add the submodule
    }

    // Update workflow to use latest Hugo version (for theme compatibility)
    try {
      const workflowContents = await github.getRepoContents(owner, repo, '.github/workflows/hugo.yml')
      if (workflowContents.length > 0 && !Array.isArray(workflowContents[0]) && 'sha' in workflowContents[0]) {
        const currentWorkflow = await github.getFileContent(owner, repo, '.github/workflows/hugo.yml')
        if (currentWorkflow) {
          // Update Hugo version to 0.146.0
          const updatedWorkflow = currentWorkflow.replace(
            /HUGO_VERSION:\s*[\d.]+/,
            'HUGO_VERSION: 0.146.0'
          )

          if (updatedWorkflow !== currentWorkflow) {
            await github.createOrUpdateFile(
              owner,
              repo,
              '.github/workflows/hugo.yml',
              updatedWorkflow,
              'Update Hugo to 0.146.0 for theme compatibility',
              workflowContents[0].sha as string
            )
          }
        }
      }
    } catch (error) {
      console.error('Error updating workflow:', error)
      // Non-fatal
    }

    // Set up the new theme as a git submodule
    try {
      await github.setHugoTheme(owner, repo, theme, themeInfo.repo)
    } catch (error) {
      console.error('Error setting theme submodule:', error)
      return NextResponse.json(
        { error: 'Failed to set up theme. The theme may require manual configuration.' },
        { status: 500 }
      )
    }

    // Trigger workflow to rebuild the site with new theme
    try {
      await github.triggerWorkflowDispatch(owner, repo)
    } catch (error) {
      console.log('Could not trigger workflow:', error)
      // Non-fatal - the push should trigger it anyway
    }

    // Log the theme change
    const { getUserByGithubId, logEvent } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id as string)
    if (user) {
      await logEvent('theme_changed', user.id, {
        repository: `${owner}/${repo}`,
        theme,
      })
    }

    return NextResponse.json({
      success: true,
      theme,
      message: `Theme changed to ${themeInfo.name}. Your site will rebuild automatically.`,
    })
  } catch (error) {
    console.error('Error changing theme:', error)
    return NextResponse.json(
      { error: 'Failed to change theme' },
      { status: 500 }
    )
  }
}
