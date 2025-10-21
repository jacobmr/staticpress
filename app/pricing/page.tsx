import { auth } from '@/lib/auth'
import { PricingClient } from '@/components/pricing-client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const session = await auth()

  // Get user tier if logged in
  let userTier: 'free' | 'personal' | 'smb' | 'pro' = 'free'
  let userId: number | null = null
  let hasStripeCustomer = false

  if (session?.user?.id) {
    // Dynamically import database functions to prevent build-time initialization
    const { getUserByGithubId } = await import('@/lib/db')
    const user = await getUserByGithubId(session.user.id)
    if (user) {
      userTier = user.subscription_tier
      userId = user.id
      hasStripeCustomer = !!user.stripe_customer_id
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-2xl font-bold">
            StaticPress
          </Link>
          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Settings
                </Link>
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
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Start free, upgrade when you need more
          </p>
          {userTier !== 'free' && (
            <div className="mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Current plan:{' '}
              </span>
              <span className={`font-semibold ${
                userTier === 'personal' ? 'text-blue-600' :
                userTier === 'smb' ? 'text-purple-600' :
                'text-orange-600'
              }`}>
                {userTier === 'personal' ? 'Personal' :
                 userTier === 'smb' ? 'SMB' : 'Pro'}
              </span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <PricingClient
          currentTier={userTier}
          userId={userId}
          hasStripeCustomer={hasStripeCustomer}
        />

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
            <div>
              <h3 className="mb-2 text-lg font-semibold">Do you offer refunds?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We offer a 14-day money-back guarantee. If you&apos;re not satisfied within the first
                14 days of your subscription, contact us for a full refund.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">How does the 5-post limit work on Free?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Free tier users can edit their 5 most recent posts (sorted by date). Older posts are
                still visible in your repository, but you&apos;ll need to upgrade to Personal to edit them
                in StaticPress.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!session?.user && (
          <div className="mt-24 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-16 text-center text-white">
            <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
            <p className="mb-8 text-xl">
              Sign in with GitHub and start publishing to your Hugo blog in seconds
            </p>
            <Link
              href="/"
              className="inline-block rounded-md bg-white px-8 py-3 font-medium text-blue-600 hover:bg-gray-100"
            >
              Sign In with GitHub
            </Link>
          </div>
        )}
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
