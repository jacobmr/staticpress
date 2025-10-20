import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRepoConfig } from "@/lib/cookies"
import { GitHubClient, HugoPost } from "@/lib/github"
import { DashboardClient } from "@/components/dashboard-client"
import { getCached, setCached } from "@/lib/cache"
import Link from "next/link"

export default async function Dashboard() {
  const session = await auth()

  if (!session?.user || !session.accessToken) {
    redirect('/')
  }

  // Check if repository is configured
  const repoConfig = await getRepoConfig()
  if (!repoConfig) {
    redirect('/setup')
  }

  // Try to get cached posts first
  const cacheKey = `posts:${repoConfig.owner}:${repoConfig.repo}`
  let posts = getCached<HugoPost[]>(cacheKey)

  if (!posts) {
    // Fetch initial posts (limit to 10 for performance)
    const github = new GitHubClient(session.accessToken)
    posts = await github.getHugoPosts(
      repoConfig.owner,
      repoConfig.repo,
      repoConfig.contentPath || 'content/posts',
      10
    )
    setCached(cacheKey, posts)
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
      />
    </div>
  )
}
