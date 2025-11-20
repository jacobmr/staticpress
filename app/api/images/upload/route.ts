import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'
import { getRepoConfig } from '@/lib/cookies'

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

    const { filename, content, contentType } = await request.json()

    if (!filename || !content) {
      return NextResponse.json({ error: 'Filename and content are required' }, { status: 400 })
    }

    // Validate image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed.' }, { status: 400 })
    }

    const github = new GitHubClient(session.accessToken)

    // Generate path: static/images/YYYY/MM/filename
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    // Sanitize filename and add timestamp to prevent conflicts
    const timestamp = Date.now()
    const ext = filename.split('.').pop()
    const sanitizedName = filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars
      .toLowerCase()

    const finalFilename = `${sanitizedName}-${timestamp}.${ext}`
    const imagePath = `static/images/${year}/${month}/${finalFilename}`

    // Upload to GitHub
    const result = await github.createOrUpdateFile(
      repoConfig.owner,
      repoConfig.repo,
      imagePath,
      content,
      `Add image: ${finalFilename}`,
      undefined,
      true // This is a binary file (base64)
    )

    // Generate URLs for the image
    // Hugo URL - for saving to content
    // Include repo name for GitHub Pages project sites (user.github.io/repo/)
    // Skip for custom domains or when site is at root
    const isGitHubPagesProject = !repoConfig.siteUrl ||
      repoConfig.siteUrl?.includes('.github.io/')

    const hugoUrl = isGitHubPagesProject
      ? `/${repoConfig.repo}/images/${year}/${month}/${finalFilename}`
      : `/images/${year}/${month}/${finalFilename}`

    // GitHub raw URL - for immediate display in editor (available instantly)
    const rawUrl = `https://raw.githubusercontent.com/${repoConfig.owner}/${repoConfig.repo}/main/${imagePath}`

    return NextResponse.json({
      success: true,
      url: rawUrl, // Use raw URL for immediate display
      hugoUrl: hugoUrl, // Relative URL for Hugo
      path: imagePath,
      sha: result.content?.sha,
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
