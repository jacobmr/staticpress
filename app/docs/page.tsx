import { auth } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutButton } from "@/components/auth-buttons"
import { signOutUser } from "@/lib/auth-actions"

export default async function DocsPage() {
  const session = await auth()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={session ? "/dashboard" : "/"} className="text-2xl font-bold hover:text-blue-600">
              StaticPress
            </Link>
            <span className="text-sm text-gray-500">Documentation</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Dashboard
                </Link>
                <SignOutButton action={signOutUser} />
              </>
            ) : (
              <Link
                href="/"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <h1 className="mb-4 text-4xl font-bold">Deployment Documentation</h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Choose your preferred hosting platform and follow our step-by-step guides to deploy your Hugo blog.
          </p>

          {/* Platform Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* GitHub Pages */}
            <Link
              href="/docs/github"
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 dark:bg-white">
                  <svg className="h-7 w-7 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold group-hover:text-blue-600">GitHub Pages</h2>
              </div>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Free hosting directly from your GitHub repository. One-click setup with automatic deployments.
              </p>
              <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-500">
                <li>One-click deployment</li>
                <li>Free SSL certificates</li>
                <li>Custom domain support</li>
              </ul>
              <div className="mt-4 text-sm font-medium text-blue-600">
                View Guide &rarr;
              </div>
            </Link>

            {/* Vercel */}
            <Link
              href="/docs/vercel"
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 22.525H0l12-21.05 12 21.05z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold group-hover:text-blue-600">Vercel</h2>
              </div>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Edge network deployment with preview builds for every push. Great for teams.
              </p>
              <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-500">
                <li>Preview deployments</li>
                <li>Edge CDN</li>
                <li>Team collaboration</li>
              </ul>
              <div className="mt-4 text-sm font-medium text-blue-600">
                View Guide &rarr;
              </div>
            </Link>

            {/* Netlify */}
            <Link
              href="/docs/netlify"
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#00AD9F]">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.934 8.519a1.044 1.044 0 0 1 .303.23l2.349-1.045-2.192-2.171-.491 2.954zM12.06 6.546a1.305 1.305 0 0 1 .209.574l3.497 1.482a1.044 1.044 0 0 1 .605-.325l.506-3.043-4.817 1.312zM11.976 8.09l-1.655 3.344 3.864 1.636.209-1.418-2.626-1.482c-.068-.03-.161-.04-.161-.04l.37-2.04zM9.67 4.2L5.62 9.586l4.89 2.097 1.66-3.35L9.67 4.2zM9.014 12.807l-.03 3.39 3.556 1.57.217-1.57a1.146 1.146 0 0 1-.058-.209L9.014 12.807zM8.948 16.752l-.006 3.21 3.556 1.54.217-1.54a1.147 1.147 0 0 1-.058-.209l-3.71-3.001zM8.875 20.537l-1.7 3.54 4.96-1.54-.217-1.42-3.043-.58zM6.18 10.283l-3.54 4.96 4.89 2.097.03-3.39-1.38-3.667zM6.09 17.895l-3.54 4.96 4.96-1.54.03-3.21-1.45-.21z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold group-hover:text-blue-600">Netlify</h2>
              </div>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Powerful build system with forms, functions, and split testing built-in.
              </p>
              <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-500">
                <li>Deploy previews</li>
                <li>Built-in forms</li>
                <li>Serverless functions</li>
              </ul>
              <div className="mt-4 text-sm font-medium text-blue-600">
                View Guide &rarr;
              </div>
            </Link>

            {/* Cloudflare Pages */}
            <Link
              href="/docs/cloudflare"
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F38020]">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.5765-.4961-.9873-.5068l-8.9209-.1123c-.0489 0-.0919-.0205-.1182-.0527-.0283-.0322-.0361-.0752-.0264-.1162.0205-.0674.0821-.1162.1533-.1229l9.0029-.1133c.9629-.0391 2.002-.8037 2.4033-1.7666l.5078-1.2178c.0215-.0498.0273-.1006.0156-.1494-.4453-2.0273-2.2383-3.5391-4.3926-3.5391-2.4033 0-4.4072 1.7666-4.7764 4.0869-.3203-.2373-.71-.3691-1.128-.3545-.8037.0283-1.4482.6709-1.5234 1.4746-.0176.1846-.0078.3652.0273.5361-1.6768.0537-3.0127 1.4316-3.0127 3.1308 0 .1631.0117.3233.0332.4814.0107.084.0596.1504.1318.1504h12.0098c.0704 0 .1416-.0566.1641-.1396z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold group-hover:text-blue-600">Cloudflare Pages</h2>
              </div>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Global edge network with integrated DNS and DDoS protection.
              </p>
              <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-500">
                <li>Global CDN</li>
                <li>Integrated DNS</li>
                <li>DDoS protection</li>
              </ul>
              <div className="mt-4 text-sm font-medium text-blue-600">
                View Guide &rarr;
              </div>
            </Link>
          </div>

          {/* Back to Deploy */}
          <div className="mt-12 text-center">
            <Link
              href="/deploy"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Deploy Options
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-2 text-xl font-semibold">Need Help Choosing?</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Not sure which platform is right for you? Here&apos;s a quick guide:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><strong>GitHub Pages</strong> - Best for simplicity and staying within GitHub ecosystem</li>
              <li><strong>Vercel</strong> - Best for teams needing preview deployments</li>
              <li><strong>Netlify</strong> - Best for additional features like forms and functions</li>
              <li><strong>Cloudflare Pages</strong> - Best for performance and if you use Cloudflare DNS</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 StaticPress. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
