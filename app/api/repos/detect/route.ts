import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'
import { detectHugoSite } from '@/lib/hugo-detector'
import { logger } from '@/lib/logger'
import { detectRepoSchema } from '@/lib/validation/schemas'
import { userRateLimitCheck, RATE_LIMITS } from '@/lib/cache'

/**
 * GET /api/repos/detect?owner=xxx&repo=yyy
 *
 * Detects if a repository is a Hugo site and returns configuration details.
 * Used during setup to validate and configure existing Hugo sites.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting - allow 20 detections per minute per user
    if (!userRateLimitCheck(session.user.id as string, 'detect', 20, 60)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate query parameters with Zod
    const searchParams = request.nextUrl.searchParams
    const parseResult = detectRepoSchema.safeParse({
      owner: searchParams.get('owner'),
      repo: searchParams.get('repo'),
    })

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { owner, repo } = parseResult.data
    const github = new GitHubClient(session.accessToken)

    // Detect Hugo site configuration
    const config = await detectHugoSite(github, owner, repo)

    logger.info('Hugo site detection completed', {
      owner,
      repo,
      isHugoSite: config.isHugoSite,
      theme: config.theme,
      themeSupported: config.themeSupported,
    })

    return NextResponse.json(config)

  } catch (error) {
    logger.error('Error in detect endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Detection failed' },
      { status: 500 }
    )
  }
}
