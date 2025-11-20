import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
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

    const { siteUrl } = await request.json()

    if (!siteUrl || !siteUrl.trim()) {
      return NextResponse.json({ error: 'Site URL is required' }, { status: 400 })
    }

    // Normalize URL - add https if missing
    let normalizedUrl = siteUrl.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    const { owner, repo } = repoConfig

    // Save site URL to database
    const user = await getUserByGithubId(session.user.id as string)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await updateRepositorySiteUrl(user.id, owner, repo, normalizedUrl)

    return NextResponse.json({
      success: true,
      url: normalizedUrl,
    })
  } catch (error) {
    console.error('Error saving site URL:', error)
    return NextResponse.json(
      { error: 'Failed to save site URL' },
      { status: 500 }
    )
  }
}
