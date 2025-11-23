import { auth } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutButton } from "@/components/auth-buttons"
import { signOutUser } from "@/lib/auth-actions"

export default async function CloudflareDocsPage() {
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
            <span className="text-sm text-gray-500">Cloudflare Pages Guide</span>
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
              <li className="text-gray-600 dark:text-gray-400">Cloudflare Pages</li>
            </ol>
          </nav>

          <h1 className="mb-4 text-4xl font-bold">Cloudflare Pages Setup Guide</h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Deploy your Hugo blog to Cloudflare&apos;s global edge network with integrated DNS and DDoS protection.
          </p>

          {/* Table of Contents */}
          <nav className="mb-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold">Contents</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#oauth-connection" className="text-blue-600 hover:underline">OAuth Connection Process</a></li>
              <li><a href="#auto-creation" className="text-blue-600 hover:underline">Auto-Created Projects</a></li>
              <li><a href="#custom-domain" className="text-blue-600 hover:underline">Custom Domain Configuration</a></li>
              <li><a href="#cloudflare-dns" className="text-blue-600 hover:underline">DNS with Cloudflare</a></li>
              <li><a href="#troubleshooting" className="text-blue-600 hover:underline">Troubleshooting</a></li>
            </ul>
          </nav>

          {/* OAuth Connection Process */}
          <section id="oauth-connection" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">OAuth Connection Process</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Connect StaticPress to your Cloudflare account via OAuth:
              </p>

              <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Navigate to Deploy</strong>
                  <p className="mt-1">Go to Settings &gt; Deploy in your StaticPress dashboard.</p>
                </li>
                <li>
                  <strong>Click &quot;Connect Cloudflare&quot;</strong>
                  <p className="mt-1">You&apos;ll be redirected to Cloudflare&apos;s authorization page.</p>
                </li>
                <li>
                  <strong>Authorize StaticPress</strong>
                  <p className="mt-1">Review the permissions and click &quot;Authorize&quot;.</p>
                </li>
                <li>
                  <strong>Return to StaticPress</strong>
                  <p className="mt-1">You&apos;ll be redirected back with Cloudflare connected.</p>
                </li>
              </ol>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: Cloudflare OAuth authorization screen</p>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Permissions Requested:</strong> StaticPress requests permission to create Pages projects, manage deployments, and configure custom domains.
                </p>
              </div>
            </div>
          </section>

          {/* Auto-Created Projects */}
          <section id="auto-creation" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">How Projects Are Auto-Created</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Once connected, StaticPress automatically creates and configures your Cloudflare Pages project:
              </p>

              <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                <li>A new Pages project is created with your repository name</li>
                <li>GitHub repository is connected via Cloudflare&apos;s GitHub integration</li>
                <li>Build configuration is automatically set for Hugo</li>
                <li>First deployment is triggered immediately</li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Default Build Settings</h3>
              <div className="mb-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Setting</th>
                      <th className="px-4 py-2 text-left font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 dark:text-gray-400">
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Framework preset</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Hugo</td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Build command</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700"><code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo</code></td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Build output directory</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700"><code className="rounded bg-gray-200 px-1 dark:bg-gray-700">public</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="mt-6 mb-3 text-xl font-semibold">What Gets Created</h3>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li><strong>Production URL:</strong> <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">project-name.pages.dev</code></li>
                <li><strong>Preview URLs:</strong> Unique URL for each commit</li>
                <li><strong>Branch Deployments:</strong> Deploy previews for all branches</li>
                <li><strong>Global CDN:</strong> Automatic edge caching worldwide</li>
              </ul>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: Cloudflare Pages dashboard showing new Hugo project</p>
                </div>
              </div>
            </div>
          </section>

          {/* Custom Domain Configuration */}
          <section id="custom-domain" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Custom Domain Configuration</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Add a custom domain to your Cloudflare Pages project:
              </p>

              <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Go to Custom Domains</strong>
                  <p className="mt-1">In Cloudflare dashboard, navigate to Pages &gt; Your Project &gt; Custom domains</p>
                </li>
                <li>
                  <strong>Add Domain</strong>
                  <p className="mt-1">Click &quot;Set up a custom domain&quot; and enter your domain</p>
                </li>
                <li>
                  <strong>Configure DNS</strong>
                  <p className="mt-1">Cloudflare provides options based on where your DNS is hosted:</p>
                </li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Option A: Domain on Cloudflare DNS</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                If your domain is already on Cloudflare DNS, setup is automatic:
              </p>
              <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-600 dark:text-gray-400">
                <li>CNAME record is created automatically</li>
                <li>SSL certificate is provisioned instantly</li>
                <li>No manual DNS configuration needed</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Option B: Domain on External DNS</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Add these DNS records at your registrar:
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
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">@</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">project-name.pages.dev</td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">CNAME</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">www</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">project-name.pages.dev</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: Cloudflare Pages custom domain configuration</p>
                </div>
              </div>
            </div>
          </section>

          {/* DNS with Cloudflare */}
          <section id="cloudflare-dns" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">DNS with Cloudflare</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Using Cloudflare DNS provides additional benefits for your Pages project:
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Benefits of Cloudflare DNS</h3>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li><strong>Automatic SSL:</strong> Instant certificate provisioning</li>
                <li><strong>DDoS Protection:</strong> Enterprise-grade protection included</li>
                <li><strong>Analytics:</strong> Detailed traffic and performance insights</li>
                <li><strong>Edge Caching:</strong> Optimized caching rules</li>
                <li><strong>Page Rules:</strong> Custom redirect and caching rules</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Migrating to Cloudflare DNS</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                If your domain is with another registrar:
              </p>
              <ol className="mb-4 list-decimal space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Add your site to Cloudflare (free plan works)</li>
                <li>Cloudflare scans existing DNS records</li>
                <li>Update nameservers at your registrar to Cloudflare&apos;s</li>
                <li>Wait for propagation (usually minutes to hours)</li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Recommended DNS Settings</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                For optimal performance, use these settings:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li><strong>Proxy status:</strong> Proxied (orange cloud) for CDN benefits</li>
                <li><strong>SSL/TLS:</strong> Full (strict) mode</li>
                <li><strong>Always Use HTTPS:</strong> Enabled</li>
                <li><strong>Auto Minify:</strong> Enable for HTML, CSS, JS</li>
              </ul>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> If using Cloudflare DNS, make sure the CNAME record for your Pages domain is set to &quot;Proxied&quot; (orange cloud) to get full CDN and security benefits.
                </p>
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
                  If the build fails because Hugo isn&apos;t installing:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Set <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">HUGO_VERSION</code> environment variable in project settings</li>
                  <li>Ensure framework preset is set to &quot;Hugo&quot;</li>
                  <li>Check build logs for specific error messages</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Theme Not Loading</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If your Hugo theme isn&apos;t being loaded:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Verify theme is added as a git submodule</li>
                  <li>Check that <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">.gitmodules</code> is committed to repository</li>
                  <li>Ensure theme name in <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo.toml</code> matches directory name</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Custom Domain Not Working</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If your custom domain shows an error:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Verify DNS records are correctly configured</li>
                  <li>Wait for DNS propagation (up to 48 hours)</li>
                  <li>Check SSL/TLS mode is set correctly in Cloudflare</li>
                  <li>Ensure domain is activated in custom domains list</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">522 Connection Timed Out</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If you see a 522 error on your custom domain:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>The CNAME record may be pointing to the wrong target</li>
                  <li>Verify it points to <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">your-project.pages.dev</code></li>
                  <li>Try removing and re-adding the custom domain</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Redirect Loop</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If your site shows &quot;too many redirects&quot;:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Set SSL/TLS mode to &quot;Full&quot; or &quot;Full (strict)&quot;</li>
                  <li>Disable &quot;Flexible&quot; SSL mode</li>
                  <li>Check for conflicting page rules</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">OAuth Connection Failed</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If OAuth connection to Cloudflare fails:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Ensure you&apos;re logged into Cloudflare</li>
                  <li>Check that you have a Cloudflare account with Pages access</li>
                  <li>Try clearing browser cookies and reconnecting</li>
                  <li>Verify your Cloudflare account is verified</li>
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
                  href="https://developers.cloudflare.com/pages/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Cloudflare Pages Documentation &rarr;
                </a>
              </li>
              <li>
                <a
                  href="https://developers.cloudflare.com/pages/configuration/custom-domains/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Custom Domains Guide &rarr;
                </a>
              </li>
              <li>
                <a
                  href="https://developers.cloudflare.com/pages/framework-guides/deploy-a-hugo-site/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Deploy a Hugo Site to Pages &rarr;
                </a>
              </li>
              <li>
                <a
                  href="https://developers.cloudflare.com/dns/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Cloudflare DNS Documentation &rarr;
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
