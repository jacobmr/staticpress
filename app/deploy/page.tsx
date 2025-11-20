import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRepoConfig } from "@/lib/cookies"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutButton } from "@/components/auth-buttons"
import { signOutUser } from "@/lib/auth-actions"

export default async function DeployPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/')
  }

  const repoConfig = await getRepoConfig()

  if (!repoConfig) {
    redirect('/setup')
  }

  const { owner, repo } = repoConfig

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-2xl font-bold hover:text-blue-600">
              StaticPress
            </Link>
            <span className="text-sm text-gray-500">Deploy</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Dashboard
            </Link>
            <SignOutButton action={signOutUser} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <h1 className="mb-4 text-4xl font-bold">Deploy Your Blog</h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Your repository <strong>{owner}/{repo}</strong> is ready to deploy. Choose a platform below.
          </p>

          {/* Platform Cards */}
          <div className="space-y-8">
            {/* GitHub Pages - Recommended */}
            <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-6 dark:bg-blue-900/20">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">GitHub Pages</h2>
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  Recommended
                </span>
              </div>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Free hosting directly from your GitHub repository. Your blog already includes the GitHub Actions workflow.
              </p>

              <h3 className="mb-3 font-semibold">Setup Steps:</h3>
              <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-700 dark:text-gray-300">
                <li>
                  <a
                    href={`https://github.com/${owner}/${repo}/settings/pages`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open your repository&apos;s Pages settings
                  </a>
                </li>
                <li>Under <strong>Build and deployment</strong>, set Source to <strong>GitHub Actions</strong></li>
                <li>Wait for the workflow to run (check the Actions tab)</li>
                <li>Your site will be live at: <code className="rounded bg-blue-100 px-2 py-1 text-sm dark:bg-blue-800">{owner}.github.io/{repo}</code></li>
              </ol>

              <a
                href={`https://github.com/${owner}/${repo}/settings/pages`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
              >
                Open Pages Settings
              </a>
            </div>

            {/* Cloudflare Pages */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-2xl font-bold">Cloudflare Pages</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Fast global CDN with generous free tier. Great for custom domains.
              </p>

              <h3 className="mb-3 font-semibold">Setup Steps:</h3>
              <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <a
                    href="https://dash.cloudflare.com/?to=/:account/pages/new/provider/github"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Go to Cloudflare Pages
                  </a> and connect GitHub
                </li>
                <li>Select repository: <strong>{owner}/{repo}</strong></li>
                <li>Configure build settings:
                  <ul className="mt-2 list-disc pl-6">
                    <li>Framework preset: <strong>Hugo</strong></li>
                    <li>Build command: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">hugo</code></li>
                    <li>Build output: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">public</code></li>
                  </ul>
                </li>
                <li>Click <strong>Save and Deploy</strong></li>
              </ol>

              <a
                href="https://dash.cloudflare.com/?to=/:account/pages/new/provider/github"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Deploy to Cloudflare
              </a>
            </div>

            {/* Vercel */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-2xl font-bold">Vercel</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Zero-config deployments with automatic HTTPS. Great developer experience.
              </p>

              <h3 className="mb-3 font-semibold">Setup Steps:</h3>
              <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Go to Vercel
                  </a> and sign in with GitHub
                </li>
                <li>Click <strong>Import Project</strong></li>
                <li>Select repository: <strong>{owner}/{repo}</strong></li>
                <li>Vercel auto-detects Hugo - just click <strong>Deploy</strong></li>
              </ol>

              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Deploy to Vercel
              </a>
            </div>

            {/* Netlify */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-2xl font-bold">Netlify</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Popular static site host with form handling and serverless functions.
              </p>

              <h3 className="mb-3 font-semibold">Setup Steps:</h3>
              <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <a
                    href="https://app.netlify.com/start"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Go to Netlify
                  </a> and connect GitHub
                </li>
                <li>Select repository: <strong>{owner}/{repo}</strong></li>
                <li>Configure build settings:
                  <ul className="mt-2 list-disc pl-6">
                    <li>Build command: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">hugo</code></li>
                    <li>Publish directory: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">public</code></li>
                  </ul>
                </li>
                <li>Click <strong>Deploy site</strong></li>
              </ol>

              <a
                href="https://app.netlify.com/start"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Deploy to Netlify
              </a>
            </div>
          </div>

          {/* Custom Domain Note */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold">Custom Domain</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All platforms above support custom domains. After deployment, look for &quot;Custom Domains&quot; or
              &quot;Domain Settings&quot; in your platform&apos;s dashboard. You&apos;ll need to update your domain&apos;s DNS records
              to point to your hosting provider.
            </p>
          </div>

          {/* Back to Dashboard */}
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:underline"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
