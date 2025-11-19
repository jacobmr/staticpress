import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRepoConfig } from "@/lib/cookies"
import { GitHubClient, HugoPost } from "@/lib/github"
import { DashboardClient } from "@/components/dashboard-client"
import { getCached, setCached } from "@/lib/cache"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await auth()

  if (!session?.user || !session.accessToken) {
    redirect('/')
  }

  // Dynamically import database functions to prevent build-time initialization
  const { getUserByGithubId } = await import('@/lib/db')

  // Get user from database to check tier
  const user = await getUserByGithubId(session.user.id)
  if (!user) {
    redirect('/')
  }

  // Check if repository is configured
  const repoConfig = await getRepoConfig()
  if (!repoConfig) {
    redirect('/setup')
  }

  // Determine post limit based on tier
  // Free tier: 5 posts only, Paid tiers: all posts (limit 50 for performance)
  const postLimit = user.subscription_tier === 'free' ? 5 : 50

  // Try to get cached posts first (24-hour server cache)
  const cacheKey = `posts:${repoConfig.owner}:${repoConfig.repo}:${user.subscription_tier}`
  let posts = getCached<HugoPost[]>(cacheKey)

  if (!posts) {
    // Fetch posts from GitHub (cached on server for 24 hours)
    const github = new GitHubClient(session.accessToken)
    posts = await github.getHugoPosts(
      repoConfig.owner,
      repoConfig.repo,
      repoConfig.contentPath || 'content/posts',
      postLimit
    )
    setCached(cacheKey, posts)
    console.log(`[Server] Fetched ${posts.length} posts from GitHub, cached for 24 hours`)
  } else {
    console.log(`[Server] Loaded ${posts.length} posts from server cache`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">StaticPress</h1>
            <span className="text-sm text-gray-500">
              {repoConfig.owner}/{repoConfig.repo}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Tier Badge */}
            <Link
              href="/pricing"
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                user.subscription_tier === 'free'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  : user.subscription_tier === 'personal'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
                  : user.subscription_tier === 'smb'
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
              }`}
            >
              {user.subscription_tier === 'free' ? 'Free' :
               user.subscription_tier === 'personal' ? 'Personal' :
               user.subscription_tier === 'smb' ? 'SMB' : 'Pro'}
            </Link>
            <ThemeToggle />
            <Link
              href="/settings"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Settings
            </Link>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {session.user.name || session.user.email}
            </span>
            <form
              action={async () => {
                "use server"
                await signOut()
              }}
            >
              <button
                type="submit"
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <DashboardClient
        initialPosts={posts}
        repoOwner={repoConfig.owner}
        repoName={repoConfig.repo}
        userTier={user.subscription_tier}
      />
    </div>
  )
}
