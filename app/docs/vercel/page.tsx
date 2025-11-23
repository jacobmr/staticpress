import { auth } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutButton } from "@/components/auth-buttons"
import { signOutUser } from "@/lib/auth-actions"

export default async function VercelDocsPage() {
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
            <span className="text-sm text-gray-500">Vercel Guide</span>
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
              <li className="text-gray-600 dark:text-gray-400">Vercel</li>
            </ol>
          </nav>

          <h1 className="mb-4 text-4xl font-bold">Vercel Setup Guide</h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Deploy your Hugo blog to Vercel&apos;s edge network with preview deployments and team collaboration.
          </p>

          {/* Table of Contents */}
          <nav className="mb-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold">Contents</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#oauth-connection" className="text-blue-600 hover:underline">OAuth Connection Process</a></li>
              <li><a href="#auto-creation" className="text-blue-600 hover:underline">Auto-Created Projects</a></li>
              <li><a href="#custom-domain" className="text-blue-600 hover:underline">Custom Domain Configuration</a></li>
              <li><a href="#environment-variables" className="text-blue-600 hover:underline">Environment Variables</a></li>
              <li><a href="#preview-deployments" className="text-blue-600 hover:underline">Preview Deployments</a></li>
              <li><a href="#troubleshooting" className="text-blue-600 hover:underline">Troubleshooting</a></li>
            </ul>
          </nav>

          {/* OAuth Connection Process */}
          <section id="oauth-connection" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">OAuth Connection Process</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                StaticPress uses OAuth to securely connect to your Vercel account without storing credentials:
              </p>

              <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Navigate to Deploy</strong>
                  <p className="mt-1">Go to Settings &gt; Deploy in your StaticPress dashboard.</p>
                </li>
                <li>
                  <strong>Click &quot;Connect Vercel&quot;</strong>
                  <p className="mt-1">You&apos;ll be redirected to Vercel&apos;s authorization page.</p>
                </li>
                <li>
                  <strong>Authorize StaticPress</strong>
                  <p className="mt-1">Review the permissions and click &quot;Authorize&quot; to grant access.</p>
                </li>
                <li>
                  <strong>Return to StaticPress</strong>
                  <p className="mt-1">You&apos;ll be redirected back with Vercel connected to your account.</p>
                </li>
              </ol>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: Vercel OAuth authorization screen</p>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Permissions Requested:</strong> StaticPress requests permission to create projects, manage deployments, and configure domains on your behalf.
                </p>
              </div>
            </div>
          </section>

          {/* Auto-Created Projects */}
          <section id="auto-creation" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">How Projects Are Auto-Created</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Once connected, StaticPress automatically creates and configures your Vercel project:
              </p>

              <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                <li>A new Vercel project is created with your repository name</li>
                <li>Your GitHub repository is connected to the project</li>
                <li>Hugo framework is auto-detected and configured</li>
                <li>Build settings are automatically applied:
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>Build command: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo --gc --minify</code></li>
                    <li>Output directory: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">public</code></li>
                    <li>Install command: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">yum install -y golang</code> (for Hugo)</li>
                  </ul>
                </li>
                <li>First deployment is triggered automatically</li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">What Gets Created</h3>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li><strong>Production Domain:</strong> <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">project-name.vercel.app</code></li>
                <li><strong>Git Integration:</strong> Automatic deployments on push to main branch</li>
                <li><strong>Preview URLs:</strong> Unique URL for each pull request</li>
              </ul>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: Vercel dashboard showing newly created Hugo project</p>
                </div>
              </div>
            </div>
          </section>

          {/* Custom Domain Configuration */}
          <section id="custom-domain" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Custom Domain Configuration</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Add a custom domain to your Vercel project:
              </p>

              <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Go to Project Settings</strong>
                  <p className="mt-1">In Vercel dashboard, navigate to your project &gt; Settings &gt; Domains</p>
                </li>
                <li>
                  <strong>Add Your Domain</strong>
                  <p className="mt-1">Enter your domain name and click &quot;Add&quot;</p>
                </li>
                <li>
                  <strong>Configure DNS</strong>
                  <p className="mt-1">Vercel provides DNS records to add to your domain registrar:</p>
                  <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
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
                          <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">76.76.21.21</td>
                        </tr>
                        <tr>
                          <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">CNAME</td>
                          <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">www</td>
                          <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">cname.vercel-dns.com</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </li>
                <li>
                  <strong>Verify Domain</strong>
                  <p className="mt-1">Vercel automatically verifies and provisions SSL certificates</p>
                </li>
              </ol>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: Vercel domains settings with DNS configuration</p>
                </div>
              </div>
            </div>
          </section>

          {/* Environment Variables */}
          <section id="environment-variables" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Environment Variables</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                For most Hugo sites, environment variables are not required. However, if your theme needs them:
              </p>

              <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                <li>Go to your project in Vercel dashboard</li>
                <li>Navigate to Settings &gt; Environment Variables</li>
                <li>Add variables for different environments (Production, Preview, Development)</li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Common Hugo Environment Variables</h3>
              <div className="mb-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Variable</th>
                      <th className="px-4 py-2 text-left font-medium">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 dark:text-gray-400">
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700"><code className="rounded bg-gray-200 px-1 dark:bg-gray-700">HUGO_VERSION</code></td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Specify Hugo version (e.g., 0.120.0)</td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700"><code className="rounded bg-gray-200 px-1 dark:bg-gray-700">HUGO_ENV</code></td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Set environment (production/development)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Preview Deployments */}
          <section id="preview-deployments" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Preview Deployments</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                One of Vercel&apos;s most powerful features is automatic preview deployments:
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">How It Works</h3>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Every push to a non-production branch creates a unique preview URL</li>
                <li>Pull requests automatically get preview comments with deployment links</li>
                <li>Preview URLs are shareable for review and testing</li>
                <li>Each preview has its own deployment logs and analytics</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Preview URL Format</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Preview URLs follow this pattern:
              </p>
              <code className="block rounded bg-gray-200 p-3 dark:bg-gray-700">
                project-name-git-branch-name-username.vercel.app
              </code>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: GitHub PR comment showing Vercel preview deployment link</p>
                </div>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section id="troubleshooting" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Troubleshooting</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">Build Failed: Hugo Not Found</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If the build fails because Hugo isn&apos;t installed:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Ensure your project framework is set to &quot;Hugo&quot; in project settings</li>
                  <li>Try setting <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">HUGO_VERSION</code> environment variable</li>
                  <li>Check Vercel&apos;s build logs for specific error messages</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Theme Not Loading</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If your Hugo theme isn&apos;t being loaded:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Ensure theme is added as a git submodule</li>
                  <li>Check that <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">.gitmodules</code> file exists</li>
                  <li>Verify theme name in <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo.toml</code> matches directory name</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">OAuth Connection Failed</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If OAuth connection to Vercel fails:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Ensure you&apos;re logged into Vercel</li>
                  <li>Try disconnecting and reconnecting</li>
                  <li>Check that you have a Vercel account (free or paid)</li>
                  <li>Clear browser cookies and try again</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Custom Domain SSL Error</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If SSL certificate isn&apos;t provisioning:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Verify DNS records are correctly configured</li>
                  <li>Wait up to 24 hours for propagation</li>
                  <li>Check for CAA records that might block issuance</li>
                  <li>Try removing and re-adding the domain</li>
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
                  href="https://vercel.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Vercel Documentation &rarr;
                </a>
              </li>
              <li>
                <a
                  href="https://vercel.com/docs/concepts/projects/custom-domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Vercel Custom Domains Guide &rarr;
                </a>
              </li>
              <li>
                <a
                  href="https://vercel.com/guides/deploying-hugo-with-vercel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Deploying Hugo with Vercel &rarr;
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
