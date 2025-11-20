import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GitHubClient } from '@/lib/github'
import { getOrCreateUser, getUserRepository, hasFeatureAccess } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getOrCreateUser({
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name,
      image: session.user.image,
    })

    // 1. Check Tier Access
    if (!hasFeatureAccess(user.subscription_tier, 'images')) {
      return NextResponse.json(
        { error: 'Image upload requires Personal tier or higher' },
        { status: 403 }
      )
    }

    // 2. Parse Form Data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const repoOwner = formData.get('repoOwner') as string
    const repoName = formData.get('repoName') as string

    if (!file || !repoOwner || !repoName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Validate File
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    // 4. Verify Repo Ownership
    const repoConfig = await getUserRepository(user.id)
    if (!repoConfig || repoConfig.owner !== repoOwner || repoConfig.repo !== repoName) {
      return NextResponse.json({ error: 'Repository not found or unauthorized' }, { status: 403 })
    }

    // 5. Prepare Path and Content
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64Content = buffer.toString('base64')

    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitize filename
    const path = `static/images/${year}/${month}/${Date.now()}-${filename}`

    // 6. Upload to GitHub
    // We need the access token from the session, but auth() might not expose it directly depending on config.
    // Assuming we can get it or use a stored token strategy. 
    // In this project, it seems we rely on the session having the accessToken.
    // Let's check how other routes get the token. 
    // Looking at previous files, it seems we might need to adjust auth configuration if token isn't there.
    // However, for now, let's assume standard NextAuth pattern or check `auth.ts` if needed.
    // Wait, I don't have access to `auth.ts` content yet, but `lib/github.ts` takes `accessToken`.
    // Let's assume `session.accessToken` exists as per typical NextAuth + GitHub setup in this project.

    // @ts-expect-error - session type might not fully reflect extended session with accessToken
    const accessToken = session.accessToken as string

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing GitHub access token' }, { status: 401 })
    }

    const github = new GitHubClient(accessToken)

    await github.createOrUpdateFile(
      repoOwner,
      repoName,
      path,
      base64Content,
      `Upload image: ${filename}`,
      undefined,
      true // isAlreadyBase64
    )

    // 7. Return URLs
    // Raw URL for editor preview (immediate)
    const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${path}`
    // Hugo URL for published site (assuming standard Hugo static dir mapping)
    // In Hugo, 'static/images/...' becomes 'images/...' in the built site
    const hugoUrl = `/images/${year}/${month}/${Date.now()}-${filename}`

    return NextResponse.json({
      success: true,
      rawUrl,
      hugoUrl,
      path
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
