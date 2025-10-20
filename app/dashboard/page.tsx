import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRepoConfig } from "@/lib/cookies"
import Link from "next/link"

export default async function Dashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect('/')
  }

  // Check if repository is configured
  const repoConfig = await getRepoConfig()
  if (!repoConfig) {
    redirect('/setup')
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
      <div className="flex flex-1">
        {/* Sidebar - File Browser (placeholder) */}
        <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold">Posts</h2>
          <div className="text-sm text-gray-500">
            Connect your GitHub repository to browse posts
          </div>
        </aside>

        {/* Editor Area (placeholder) */}
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-3xl font-bold">New Post</h2>

            <div className="space-y-6">
              {/* Title Field */}
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Enter post title..."
                />
              </div>

              {/* Content Editor (placeholder) */}
              <div>
                <label htmlFor="content" className="mb-2 block text-sm font-medium">
                  Content
                </label>
                <div className="min-h-[400px] rounded-md border border-gray-300 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-gray-500">
                    TipTap editor will be integrated here
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700">
                  Publish
                </button>
                <button className="rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
