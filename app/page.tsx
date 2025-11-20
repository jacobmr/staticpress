import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SignInButton, AuthButton } from "@/components/auth-buttons"
import { signInWithGitHub } from "@/lib/auth-actions"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await auth()

  // Only redirect to dashboard if we have a valid session with user.id
  // Old sessions (before auth fix) will have empty user.id
  if (session?.user && session.user.id) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
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
            <SignInButton action={signInWithGitHub} variant="primary" />
            <SignInButton action={signInWithGitHub} variant="secondary" />
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

      {/* Pricing Section */}
      <div id="pricing" className="container mx-auto px-4 py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-5xl font-bold">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Start free, upgrade when you need more
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
          {/* Free Tier */}
          <div className="rounded-lg border-2 border-gray-200 p-6 dark:border-gray-700">
            <div className="mb-4">
              <h3 className="text-xl font-bold">Free</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
            </div>
            <ul className="mb-6 space-y-2 text-sm">
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Edit 5 most recent posts</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>WYSIWYG editor</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>GitHub integration</span>
              </li>
            </ul>
            <SignInButton action={signInWithGitHub} variant="outline" />
          </div>

          {/* Personal Tier */}
          <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-6 dark:bg-blue-950">
            <div className="mb-4">
              <h3 className="text-xl font-bold">Personal</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">$2.50</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">or $20/year (save 17%)</div>
            </div>
            <ul className="mb-6 space-y-2 text-sm">
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Edit all posts (unlimited)</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Image uploads</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Categories & tags</span>
              </li>
            </ul>
            <AuthButton
              action={signInWithGitHub}
              loadingText="Signing in..."
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait"
            >
              Upgrade to Personal
            </AuthButton>
          </div>

          {/* SMB Tier */}
          <div className="rounded-lg border-2 border-purple-500 p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold">SMB</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">$5</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">or $50/year (save 17%)</div>
            </div>
            <ul className="mb-6 space-y-2 text-sm">
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Everything in Personal</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Custom domain setup</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Theme gallery</span>
              </li>
            </ul>
            <div className="text-center">
              <button
                disabled
                className="w-full rounded-md bg-gray-300 px-4 py-2 font-medium text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
              >
                Coming Soon
              </button>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Available in Q2 2025
              </p>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="rounded-lg border-2 border-orange-500 p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold">Pro</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">$10</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">or $100/year (save 17%)</div>
            </div>
            <ul className="mb-6 space-y-2 text-sm">
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Everything in SMB</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Up to 5 repositories</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Priority support</span>
              </li>
            </ul>
            <div className="text-center">
              <button
                disabled
                className="w-full rounded-md bg-gray-300 px-4 py-2 font-medium text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
              >
                Coming Soon
              </button>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Available in Q2 2025
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Can I upgrade or downgrade anytime?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                and we&apos;ll prorate your billing accordingly.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">What payment methods do you accept?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards (Visa, Mastercard, American Express) through our
                secure payment processor, Stripe.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Is there a free trial?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                The Free tier is available forever with no credit card required. You can use it to
                edit your 5 most recent posts and get a feel for StaticPress before upgrading.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">What happens if I cancel?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You can cancel anytime. You&apos;ll retain access to your paid features until the end of
                your billing period, then you&apos;ll be automatically downgraded to the Free tier.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 StaticPress. All rights reserved.</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">v0.2.5</p>
        </div>
      </footer>
    </div>
  );
}
