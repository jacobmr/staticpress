import { auth } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutButton } from "@/components/auth-buttons"
import { signOutUser } from "@/lib/auth-actions"

export default async function NetlifyDocsPage() {
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
            <span className="text-sm text-gray-500">Netlify Guide</span>
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
              <li className="text-gray-600 dark:text-gray-400">Netlify</li>
            </ol>
          </nav>

          <h1 className="mb-4 text-4xl font-bold">Netlify Setup Guide</h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Deploy your Hugo blog to Netlify with forms, functions, and powerful build features.
          </p>

          {/* Table of Contents */}
          <nav className="mb-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold">Contents</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#oauth-connection" className="text-blue-600 hover:underline">OAuth Connection Process</a></li>
              <li><a href="#auto-creation" className="text-blue-600 hover:underline">Auto-Created Sites</a></li>
              <li><a href="#custom-domain" className="text-blue-600 hover:underline">Custom Domain Configuration</a></li>
              <li><a href="#build-settings" className="text-blue-600 hover:underline">Build Settings</a></li>
              <li><a href="#troubleshooting" className="text-blue-600 hover:underline">Troubleshooting</a></li>
            </ul>
          </nav>

          {/* OAuth Connection Process */}
          <section id="oauth-connection" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">OAuth Connection Process</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Connect StaticPress to your Netlify account securely via OAuth:
              </p>

              <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Navigate to Deploy</strong>
                  <p className="mt-1">Go to Settings &gt; Deploy in your StaticPress dashboard.</p>
                </li>
                <li>
                  <strong>Click &quot;Connect Netlify&quot;</strong>
                  <p className="mt-1">You&apos;ll be redirected to Netlify&apos;s authorization page.</p>
                </li>
                <li>
                  <strong>Authorize StaticPress</strong>
                  <p className="mt-1">Review the permissions requested and click &quot;Authorize&quot;.</p>
                </li>
                <li>
                  <strong>Return to StaticPress</strong>
                  <p className="mt-1">You&apos;ll be redirected back with Netlify connected.</p>
                </li>
              </ol>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: Netlify OAuth authorization screen</p>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Permissions Requested:</strong> StaticPress requests permission to create sites, trigger builds, and manage domains on your Netlify account.
                </p>
              </div>
            </div>
          </section>

          {/* Auto-Created Sites */}
          <section id="auto-creation" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">How Sites Are Auto-Created</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Once connected, StaticPress automatically creates and configures your Netlify site:
              </p>

              <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                <li>A new Netlify site is created with a random subdomain</li>
                <li>Your GitHub repository is linked to the site</li>
                <li>Build settings are automatically configured for Hugo</li>
                <li>Continuous deployment is enabled for your main branch</li>
                <li>First deployment is triggered immediately</li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">What Gets Created</h3>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li><strong>Site URL:</strong> <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">random-name-12345.netlify.app</code></li>
                <li><strong>Git Integration:</strong> Auto-deploy on push to main branch</li>
                <li><strong>Deploy Previews:</strong> Preview URLs for pull requests</li>
                <li><strong>Build Logs:</strong> Detailed logs for every deployment</li>
              </ul>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: Netlify dashboard showing newly created Hugo site</p>
                </div>
              </div>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Renaming Your Site</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You can change the random subdomain to something memorable:
              </p>
              <ol className="mb-4 list-decimal space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Go to Site settings &gt; Site details</li>
                <li>Click &quot;Change site name&quot;</li>
                <li>Enter your preferred name (e.g., <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">myblog.netlify.app</code>)</li>
              </ol>
            </div>
          </section>

          {/* Custom Domain Configuration */}
          <section id="custom-domain" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Custom Domain Configuration</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Add your custom domain to Netlify:
              </p>

              <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Go to Domain Settings</strong>
                  <p className="mt-1">In Netlify dashboard, navigate to your site &gt; Domain settings</p>
                </li>
                <li>
                  <strong>Add Custom Domain</strong>
                  <p className="mt-1">Click &quot;Add custom domain&quot; and enter your domain</p>
                </li>
                <li>
                  <strong>Verify Ownership</strong>
                  <p className="mt-1">Netlify will check if you own the domain</p>
                </li>
                <li>
                  <strong>Configure DNS</strong>
                  <p className="mt-1">Update your DNS records as instructed:</p>
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
                          <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">75.2.60.5</td>
                        </tr>
                        <tr>
                          <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">CNAME</td>
                          <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">www</td>
                          <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">your-site.netlify.app</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </li>
                <li>
                  <strong>Enable HTTPS</strong>
                  <p className="mt-1">Netlify provisions free SSL certificates automatically via Let&apos;s Encrypt</p>
                </li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Netlify DNS (Optional)</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                For the best performance and automatic SSL, consider using Netlify DNS:
              </p>
              <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-600 dark:text-gray-400">
                <li>Faster DNS propagation</li>
                <li>Automatic certificate renewal</li>
                <li>Branch subdomains</li>
              </ul>

              {/* Screenshot placeholder */}
              <div className="my-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Screenshot: Netlify domain settings with custom domain configured</p>
                </div>
              </div>
            </div>
          </section>

          {/* Build Settings */}
          <section id="build-settings" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Build Settings</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                StaticPress configures optimal build settings automatically, but here&apos;s what they mean:
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Default Configuration</h3>
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
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Build command</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700"><code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo --gc --minify</code></td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Publish directory</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700"><code className="rounded bg-gray-200 px-1 dark:bg-gray-700">public</code></td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Production branch</td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700"><code className="rounded bg-gray-200 px-1 dark:bg-gray-700">main</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Environment Variables</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Common environment variables for Hugo on Netlify:
              </p>
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
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Specify Hugo version</td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700"><code className="rounded bg-gray-200 px-1 dark:bg-gray-700">HUGO_ENV</code></td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">Set to &quot;production&quot;</td>
                    </tr>
                    <tr>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700"><code className="rounded bg-gray-200 px-1 dark:bg-gray-700">GO_VERSION</code></td>
                      <td className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">For Hugo modules</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="mt-6 mb-3 text-xl font-semibold">netlify.toml Configuration</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                For more control, create a <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">netlify.toml</code> file in your repository:
              </p>
              <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
{`[build]
  command = "hugo --gc --minify"
  publish = "public"

[build.environment]
  HUGO_VERSION = "0.120.0"

[context.production.environment]
  HUGO_ENV = "production"

[context.deploy-preview]
  command = "hugo --gc --minify --buildFuture -b $DEPLOY_PRIME_URL"`}
              </pre>
            </div>
          </section>

          {/* Troubleshooting */}
          <section id="troubleshooting" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Troubleshooting</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">Build Failed: Hugo Version Mismatch</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If builds fail due to Hugo version issues:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Set <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">HUGO_VERSION</code> in Site settings &gt; Environment</li>
                  <li>Or add it to <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">netlify.toml</code></li>
                  <li>Use the same version you have locally (<code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo version</code>)</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Theme Not Found</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If Hugo can&apos;t find your theme:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Ensure theme is a git submodule (not just copied files)</li>
                  <li>Check <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">.gitmodules</code> file exists and is correct</li>
                  <li>Verify theme directory name matches <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo.toml</code> config</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Deploy Preview Not Working</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If deploy previews aren&apos;t appearing on PRs:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Check Build settings &gt; Deploy contexts</li>
                  <li>Ensure &quot;Deploy previews&quot; is enabled</li>
                  <li>Verify GitHub app has proper permissions</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">SSL Certificate Not Provisioning</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If HTTPS isn&apos;t working on your custom domain:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Verify all DNS records are correctly configured</li>
                  <li>Wait for DNS propagation (can take several hours)</li>
                  <li>Try clicking &quot;Verify DNS configuration&quot; in Domain settings</li>
                  <li>Check for CAA records blocking Let&apos;s Encrypt</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Build Exceeds Time Limit</h3>
                <p className="mb-2 text-gray-600 dark:text-gray-400">
                  If your build times out:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-400">
                  <li>Optimize images before uploading</li>
                  <li>Use Hugo&apos;s image processing instead of external tools</li>
                  <li>Consider using <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">--gc</code> flag to clean up</li>
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
                  href="https://docs.netlify.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Netlify Documentation &rarr;
                </a>
              </li>
              <li>
                <a
                  href="https://docs.netlify.com/domains-https/custom-domains/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Netlify Custom Domains Guide &rarr;
                </a>
              </li>
              <li>
                <a
                  href="https://gohugo.io/hosting-and-deployment/hosting-on-netlify/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Hugo on Netlify Guide &rarr;
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
