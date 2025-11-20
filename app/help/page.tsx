import { auth } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutButton } from "@/components/auth-buttons"
import { signOutUser } from "@/lib/auth-actions"

export default async function HelpPage() {
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
            <span className="text-sm text-gray-500">Help</span>
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
          <h1 className="mb-8 text-4xl font-bold">Help & Documentation</h1>

          {/* Table of Contents */}
          <nav className="mb-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold">Contents</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#getting-started" className="text-blue-600 hover:underline">Getting Started</a></li>
              <li><a href="#creating-posts" className="text-blue-600 hover:underline">Creating Posts</a></li>
              <li><a href="#editor-features" className="text-blue-600 hover:underline">Editor Features</a></li>
              <li><a href="#deployment" className="text-blue-600 hover:underline">Deployment</a></li>
              <li><a href="#subscription-tiers" className="text-blue-600 hover:underline">Subscription Tiers</a></li>
              <li><a href="#faq" className="text-blue-600 hover:underline">FAQ</a></li>
            </ul>
          </nav>

          {/* Getting Started */}
          <section id="getting-started" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Getting Started</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                StaticPress is a WYSIWYG editor for Hugo static site blogs. It connects to your GitHub repository
                and lets you create and edit posts through a clean, visual interface.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Option 1: Create a New Blog</h3>
              <ol className="mb-4 list-decimal space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Sign in with GitHub</li>
                <li>Click &quot;Create New Blog&quot; on the setup page</li>
                <li>Enter your blog name and description</li>
                <li>StaticPress creates a GitHub repository with Hugo pre-configured</li>
                <li>Start writing!</li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Option 2: Connect Existing Blog</h3>
              <ol className="mb-4 list-decimal space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Sign in with GitHub</li>
                <li>Select your existing Hugo repository</li>
                <li>Set the content path (default: content/posts)</li>
                <li>Your existing posts will appear in the sidebar</li>
              </ol>
            </div>
          </section>

          {/* Creating Posts */}
          <section id="creating-posts" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Creating Posts</h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="mt-6 mb-3 text-xl font-semibold">Writing a New Post</h3>
              <ol className="mb-4 list-decimal space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Click the &quot;New Post&quot; button in the sidebar</li>
                <li>Enter a title for your post</li>
                <li>Write your content using the rich text editor</li>
                <li>Click &quot;Publish&quot; to make it live, or &quot;Save Draft&quot; to save without publishing</li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Editing Existing Posts</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Click on any post in the sidebar to load it into the editor. Make your changes and click
                &quot;Publish&quot; to update the post on your site.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Deleting Posts</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Hover over a post in the sidebar and click the delete icon. Confirm the deletion when prompted.
                This removes the post from your GitHub repository.
              </p>
            </div>
          </section>

          {/* Editor Features */}
          <section id="editor-features" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Editor Features</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                The StaticPress editor supports rich text formatting:
              </p>

              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li><strong>Bold</strong> and <em>Italic</em> text</li>
                <li>Headings (H2, H3)</li>
                <li>Bulleted and numbered lists</li>
                <li>Block quotes</li>
                <li>Code blocks</li>
                <li>Horizontal rules</li>
                <li>Links</li>
                <li>Images (paid tiers)</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Adding Images</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                With a paid subscription, you can add images to your posts:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Click the Image button in the toolbar</li>
                <li>Or paste an image directly from your clipboard (Ctrl/Cmd+V)</li>
                <li>Images are automatically uploaded to your GitHub repository</li>
              </ul>
            </div>
          </section>

          {/* Deployment */}
          <section id="deployment" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Deployment</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Your Hugo blog can be deployed to various platforms. Here are the most popular options:
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">GitHub Pages (Easiest)</h3>
              <ol className="mb-4 list-decimal space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Go to your repository Settings on GitHub</li>
                <li>Click &quot;Pages&quot; in the sidebar</li>
                <li>Under &quot;Source&quot;, select &quot;GitHub Actions&quot;</li>
                <li>Your blog will deploy automatically on each push</li>
                <li>Access it at: username.github.io/repo-name</li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Cloudflare Pages</h3>
              <ol className="mb-4 list-decimal space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Sign up at pages.cloudflare.com</li>
                <li>Connect your GitHub account</li>
                <li>Select your repository</li>
                <li>Set build command: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo</code></li>
                <li>Set output directory: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">public</code></li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Vercel</h3>
              <ol className="mb-4 list-decimal space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Sign up at vercel.com</li>
                <li>Import your GitHub repository</li>
                <li>Vercel auto-detects Hugo projects</li>
                <li>Click Deploy</li>
              </ol>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Netlify</h3>
              <ol className="mb-4 list-decimal space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Sign up at netlify.com</li>
                <li>Connect your GitHub repository</li>
                <li>Set build command: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">hugo</code></li>
                <li>Set publish directory: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">public</code></li>
              </ol>
            </div>
          </section>

          {/* Subscription Tiers */}
          <section id="subscription-tiers" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Subscription Tiers</h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="mt-6 mb-3 text-xl font-semibold">Free</h3>
              <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-600 dark:text-gray-400">
                <li>Edit your 5 most recent posts</li>
                <li>Rich text editor</li>
                <li>GitHub sync</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Personal - $2.50/month</h3>
              <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-600 dark:text-gray-400">
                <li>Unlimited posts</li>
                <li>Image uploads</li>
                <li>Clipboard paste for images</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">SMB - $5/month</h3>
              <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-600 dark:text-gray-400">
                <li>Everything in Personal</li>
                <li>Custom domains</li>
                <li>Theme gallery</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Pro - $10/month</h3>
              <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-600 dark:text-gray-400">
                <li>Everything in SMB</li>
                <li>Up to 5 repositories</li>
                <li>Priority support</li>
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">FAQ</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">How does StaticPress work?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  StaticPress connects to your GitHub repository and uses the GitHub API to read and write
                  Markdown files. When you publish a post, it commits the file to your repo, which triggers
                  your site to rebuild.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Is my data secure?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes. We use GitHub OAuth for authentication and only request the permissions needed to
                  read and write to your repositories. Your posts are stored in your own GitHub repository.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Can I use StaticPress with an existing Hugo blog?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Absolutely! Select &quot;Connect Existing Blog&quot; on the setup page and choose your repository.
                  Make sure to set the correct content path for where your posts are stored.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">What Hugo themes are supported?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  StaticPress works with any Hugo theme. The editor creates standard Markdown files with
                  YAML frontmatter that Hugo expects.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">How do I change my blog&apos;s theme or settings?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Edit the hugo.toml file in your repository directly on GitHub, or clone the repo locally
                  and make changes there. StaticPress focuses on post editing.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Can I cancel my subscription?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes, you can cancel anytime from the Pricing page. You&apos;ll continue to have access
                  until the end of your billing period, then revert to the Free tier.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-2 text-xl font-semibold">Need More Help?</h2>
            <p className="text-gray-600 dark:text-gray-400">
              If you have questions not covered here, please reach out at{' '}
              <a href="mailto:support@staticpress.me" className="text-blue-600 hover:underline">
                support@staticpress.me
              </a>
            </p>
          </section>
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
