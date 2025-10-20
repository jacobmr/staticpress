import { auth, signIn } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="flex max-w-4xl flex-col items-center gap-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight">
          StaticPress
        </h1>
        <p className="text-2xl text-gray-600 dark:text-gray-400">
          The simple, elegant editor for Hugo blogs
        </p>
        <div className="mt-4 max-w-2xl space-y-4 text-lg text-gray-700 dark:text-gray-300">
          <p>
            Write and publish blog posts to your Hugo site without touching the command line.
          </p>
          <p>
            Connect your GitHub repository, write in a beautiful WYSIWYG editor,
            and let StaticPress handle the Hugo file structure and Git commits.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <form
            action={async () => {
              "use server"
              await signIn("github")
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
            >
              Sign in with GitHub
            </button>
          </form>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
            <h3 className="mb-2 text-lg font-semibold">Simple Editor</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Two fields: Title and Post. No complexity, just writing.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
            <h3 className="mb-2 text-lg font-semibold">Hugo-Aware</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically follows Hugo file structure and naming conventions.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
            <h3 className="mb-2 text-lg font-semibold">Git Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Commits and pushes to your GitHub repository automatically.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
