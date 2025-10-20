import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GitHubClient } from "@/lib/github"
import { setRepoConfig, getRepoConfig, clearRepoConfig } from "@/lib/cookies"
import { revalidatePath } from "next/cache"
import Link from "next/link"

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user || !session.accessToken) {
    redirect('/')
  }

  const currentConfig = await getRepoConfig()
  const github = new GitHubClient(session.accessToken)
  const repos = await github.getUserRepos()

  async function updateRepo(formData: FormData) {
    "use server"

    const repoFullName = formData.get('repo') as string
    const contentPath = (formData.get('contentPath') as string) || 'content/posts'

    if (!repoFullName) {
      return
    }

    const [owner, repo] = repoFullName.split('/')

    await setRepoConfig({
      owner,
      repo,
      contentPath,
    })

    revalidatePath('/dashboard')
    revalidatePath('/settings')
    redirect('/dashboard')
  }

  async function disconnect() {
    "use server"

    await clearRepoConfig()
    revalidatePath('/dashboard')
    redirect('/setup')
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl p-8">
        <div className="space-y-8">
          {/* Current Repository */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold">Connected Repository</h2>
            {currentConfig ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Repository</label>
                  <p className="text-lg">
                    {currentConfig.owner}/{currentConfig.repo}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Content Path</label>
                  <p className="text-lg">{currentConfig.contentPath || 'content/posts'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No repository connected</p>
            )}
          </div>

          {/* Change Repository */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold">Change Repository</h2>
            <form action={updateRepo} className="space-y-4">
              <div>
                <label htmlFor="repo" className="mb-2 block text-sm font-medium">
                  Select Repository
                </label>
                <select
                  id="repo"
                  name="repo"
                  required
                  defaultValue={currentConfig ? `${currentConfig.owner}/${currentConfig.repo}` : ''}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">Choose a repository...</option>
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.full_name}>
                      {repo.full_name}
                      {repo.private && ' (Private)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contentPath" className="mb-2 block text-sm font-medium">
                  Content Path
                </label>
                <input
                  type="text"
                  id="contentPath"
                  name="contentPath"
                  defaultValue={currentConfig?.contentPath || 'content/posts'}
                  placeholder="content/posts"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
              >
                Update Repository
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <h2 className="mb-4 text-xl font-semibold text-red-900 dark:text-red-100">Danger Zone</h2>
            <p className="mb-4 text-sm text-red-700 dark:text-red-300">
              Disconnecting will remove your repository configuration. You'll need to reconnect to continue using StaticPress.
            </p>
            <form action={disconnect}>
              <button
                type="submit"
                className="rounded-md border border-red-600 bg-white px-6 py-2 font-medium text-red-600 hover:bg-red-50 dark:bg-red-950 dark:hover:bg-red-900"
              >
                Disconnect Repository
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
