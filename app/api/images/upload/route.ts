
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasFeatureAccess, getUserByGithubId } from '@/lib/db'
import { GitHubClient } from '@/lib/github'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from DB to check tier
    const user = await getUserByGithubId(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check tier access
    if (!hasFeatureAccess(user.subscription_tier, 'images')) {
      return NextResponse.json({
        error: 'Upgrade required',
        code: 'TIER_LIMIT',
        message: 'Image uploads are available on Personal tier and above.'
      }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const repoOwner = formData.get('owner') as string
    const repoName = formData.get('repo') as string

    if (!file || !repoOwner || !repoName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    // Process image with Sharp
    const buffer = Buffer.from(await file.arrayBuffer())
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toBuffer()

    // Generate path: static/images/YYYY/MM/filename.webp
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const originalName = file.name.split('.')[0].replace(/[^a-z0-9-_]/gi, '-').toLowerCase()
    const timestamp = Date.now()
    const filename = `${originalName}-${timestamp}.webp`
    const path = `static/images/${year}/${month}/${filename}`

    // Upload to GitHub
    const github = new GitHubClient(session.accessToken)

    // Ensure the directory exists (GitHub API handles this implicitly if we specify the full path, 
    // but good to be aware. createOrUpdateFile handles it.)

    await github.createOrUpdateFile(
      repoOwner,
      repoName,
      path,
      optimizedBuffer.toString('base64'),
      `Upload image: ${filename}`,
      undefined,
      true // isAlreadyBase64
    )

    // Construct URL
    // For public repos, we can use raw.githubusercontent.com
    // For private repos, this might be tricky without a proxy, but for now let's assume public or authenticated access context.
    // Ideally, we'd use the GitHub Pages URL if available, but that requires a deploy.
    // Raw URL is immediate.
    const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${path}`

    return NextResponse.json({
      url: rawUrl,
      path: path,
      filename: filename
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
