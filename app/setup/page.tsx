import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GitHubClient } from "@/lib/github"
import { getRepoConfig } from "@/lib/cookies"
import { getUserByGithubId, upsertUserRepository } from "@/lib/db"
import { revalidatePath } from "next/cache"

export default async function SetupPage() {
  const session = await auth()

  if (!session?.user || !session.accessToken) {
    redirect('/')
  }

  // Check if already configured
  const existingConfig = await getRepoConfig()
  if (existingConfig) {
    redirect('/dashboard')
  }

  // Fetch user's repositories
  const github = new GitHubClient(session.accessToken)
  const repos = await github.getUserRepos()

  async function selectRepo(formData: FormData) {
    "use server"

    const repoFullName = formData.get('repo') as string
    const contentPath = (formData.get('contentPath') as string) || 'content/posts'

    if (!repoFullName) {
      return
    }

    const [owner, repo] = repoFullName.split('/')

    // Get current session and user
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      redirect('/')
    }

    // Get or create user (in case sign-in callback failed to create)
    let user = await getUserByGithubId(session.user.id)
    if (!user) {
      // User doesn't exist yet, create it now
      const { getOrCreateUser } = await import('@/lib/db')
      user = await getOrCreateUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      })
    }

    // Save repository configuration to database
    await upsertUserRepository(user.id, {
      owner,
      repo,
      contentPath,
    })

    revalidatePath('/dashboard')
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header with logout */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h2 className="text-xl font-semibold">Setup</h2>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <h1 className="mb-2 text-4xl font-bold">Welcome to StaticPress</h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Let&apos;s connect your Hugo blog repository
          </p>

        <form action={selectRepo} className="space-y-6">
          <div>
            <label htmlFor="repo" className="mb-2 block text-sm font-medium">
              Select Repository
            </label>
            <select
              id="repo"
              name="repo"
              required
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
            <p className="mt-1 text-sm text-gray-500">
              Select the GitHub repository containing your Hugo blog
            </p>
          </div>

          <div>
            <label htmlFor="contentPath" className="mb-2 block text-sm font-medium">
              Content Path (optional)
            </label>
            <input
              type="text"
              id="contentPath"
              name="contentPath"
              defaultValue="content/posts"
              placeholder="content/posts"
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <p className="mt-1 text-sm text-gray-500">
              The path to your Hugo posts directory (default: content/posts)
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Connect Repository
          </button>
        </form>

        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-2 font-semibold">What happens next?</h3>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>• StaticPress will read your existing Hugo posts</li>
            <li>• You can create new posts or edit existing ones</li>
            <li>• Changes are committed directly to your repository</li>
            <li>• Your Hugo site will rebuild automatically</li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  )
}
