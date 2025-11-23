import { auth } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutButton } from "@/components/auth-buttons"
import { signOutUser } from "@/lib/auth-actions"

export default async function GitHubPagesDocsPage() {
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
            <span className="text-sm text-gray-500">GitHub Pages Guide</span>
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
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center gap-2">
              <li><Link href="/docs" className="text-blue-600 hover:underline">Docs</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-600 dark:text-gray-400">GitHub Pages</li>
            </ol>
          </nav>

          <h1 className="mb-4 text-4xl font-bold">GitHub Pages Setup Guide</h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Deploy your Hugo blog for free using GitHub Pages with one-click setup.
          </p>

          {/* Table of Contents */}
          <nav className="mb-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold">Contents</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#one-click-setup" className="text-blue-600 hover:underline">One-Click Setup</a></li>
              <li><a href="#how-it-works" className="text-blue-600 hover:underline">How Auto-Deploy Works</a></li>
              <li><a href="#custom-domain" className="text-blue-600 hover:underline">Custom Domain Configuration</a></li>
              <li><a href="#dns-configuration" className="text-blue-600 hover:underline">DNS Configuration</a></li>
              <li><a href="#troubleshooting" className="text-blue-600 hover:underline">Troubleshooting</a></li>
            </ul>
          </nav>

          {/* One-Click Setup */}
          <section id="one-click-setup" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">One-Click Setup</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                StaticPress makes deploying to GitHub Pages incredibly simple. Here&apos;s how to get started:
              </p>

              <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Navigate to Deploy</strong>
                  <p className="mt-1">Go to Settings &gt; Deploy in your StaticPress dashboard.</p>
                </li>
                <li>
                  <strong>Click &quot;Enable GitHub Pages&quot;</strong>
                  <p className="mt-1">Click the one-click deploy button for GitHub Pages.</p>
                </li>
                <li>
                  <strong>Wait for Deployment</strong>
                  <p className="mt-1">StaticPress automatically configures your repository with a GitHub Actions workflow and enables GitHub Pages.</p>
                </li>
                <li>
                  <strong>Access Your Site</strong>
                  <p className="mt-1">Your blog will be available at <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">https://username.github.io/repo-name</code></p>
                </li>
              </ol>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: StaticPress Deploy page showing GitHub Pages one-click button</p>
                </div>
              </div>
            </div>
          </section>

          {/* How Auto-Deploy Works */}
          <section id="how-it-works" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">How Auto-Deploy Works</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                When you enable GitHub Pages through StaticPress, we set up automatic deployments using GitHub Actions:
              </p>

              <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                <li>A GitHub Actions workflow file is created at <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">.github/workflows/hugo.yml</code></li>
                <li>GitHub Pages is enabled with &quot;GitHub Actions&quot; as the source</li>
                <li>Every time you publish a post, the workflow automatically:
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>Checks out your repository</li>
                    <li>Installs Hugo</li>
                    <li>Builds your site</li>
                    <li>Deploys to GitHub Pages</li>
                  </ul>
                </li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Deployment Status</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You can monitor your deployment status directly in StaticPress. The dashboard shows:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li><strong>Pending</strong> - Deployment is in progress</li>
                <li><strong>Success</strong> - Site is live and accessible</li>
                <li><strong>Failed</strong> - Something went wrong (check logs)</li>
              </ul>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: Deployment status indicator showing build progress</p>
                </div>
              </div>
            </div>
          </section>

          {/* Custom Domain Configuration */}
          <section id="custom-domain" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Custom Domain Configuration</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Want to use your own domain? Here&apos;s how to set it up:
              </p>

              <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Go to Repository Settings</strong>
                  <p className="mt-1">On GitHub, navigate to your repository &gt; Settings &gt; Pages</p>
                </li>
                <li>
                  <strong>Enter Your Custom Domain</strong>
                  <p className="mt-1">In the &quot;Custom domain&quot; field, enter your domain (e.g., <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">blog.example.com</code>)</p>
                </li>
                <li>
                  <strong>Enable HTTPS</strong>
                  <p className="mt-1">Check &quot;Enforce HTTPS&quot; (may take a few minutes to provision certificate)</p>
                </li>
                <li>
                  <strong>Configure DNS</strong>
                  <p className="mt-1">Update your DNS records (see section below)</p>
                </li>
              </ol>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: GitHub Pages settings showing custom domain field</p>
                </div>
              </div>
            </div>
          </section>

          {/* DNS Configuration */}
          <section id="dns-configuration" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">DNS Configuration</h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="mt-6 mb-3 text-xl font-semibold">For Subdomains (e.g., blog.example.com)</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Create a CNAME record pointing to your GitHub Pages URL:
              </p>
              <div className="mb-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Type</th>
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 dark:text-gray-400">
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">CNAME</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">blog</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">username.github.io</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="mt-6 mb-3 text-xl font-semibold">For Apex Domains (e.g., example.com)</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Create A records pointing to GitHub&apos;s IP addresses:
              </p>
              <div className="mb-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Type</th>
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 dark:text-gray-400">
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">A</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">@</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">185.199.108.153</td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">A</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">@</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">185.199.109.153</td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">A</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">@</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">185.199.110.153</td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">A</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">@</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">185.199.111.153</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> DNS changes can take up to 24-48 hours to propagate, though they usually take effect within a few minutes to a few hours.
                </p>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section id="troubleshooting" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Troubleshooting</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">Build Failed</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If your deployment shows as failed, check the following:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>View the deployment logs in StaticPress for error details</li>
                  <li>Ensure your Hugo theme is properly installed as a git submodule</li>
                  <li>Check that your <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo.toml</code> configuration is valid</li>
                  <li>Make sure all referenced images and files exist</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">404 Error on Site</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If you see a 404 error when visiting your site:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Wait a few minutes for the deployment to complete</li>
                  <li>Check that GitHub Pages is enabled in repository settings</li>
                  <li>Verify the <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">baseURL</code> in <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo.toml</code> matches your GitHub Pages URL</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Custom Domain Not Working</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If your custom domain isn&apos;t working:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Verify DNS records are correctly configured</li>
                  <li>Wait for DNS propagation (up to 48 hours)</li>
                  <li>Check for a CNAME file in your repository root</li>
                  <li>Ensure HTTPS is enabled after DNS propagation</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">CSS/Styles Not Loading</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If your site looks unstyled:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Update <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">baseURL</code> to match your deployment URL exactly</li>
                  <li>Ensure you&apos;re using HTTPS if that&apos;s your deployment URL</li>
                  <li>Clear your browser cache and hard refresh</li>
                </ul>
              </div>
            </div>
          </section>

          {/* External Resources */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Additional Resources</h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href="https://docs.github.com/en/pages"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  GitHub Pages Documentation &rarr;
                </a>
              </li>
              <li>
                <a
                  href="https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Custom Domain Setup Guide &rarr;
                </a>
              </li>
              <li>
                <a
                  href="https://gohugo.io/hosting-and-deployment/hosting-on-github/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Hugo on GitHub Pages Guide &rarr;
                </a>
              </li>
            </ul>
          </section>

          {/* Back to Deploy */}
          <div className="flex justify-between">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              All Documentation
            </Link>
            <Link
              href="/deploy"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              Go to Deploy
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
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
