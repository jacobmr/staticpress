import { auth } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutButton } from "@/components/auth-buttons"
import { signOutUser } from "@/lib/auth-actions"

export default async function PrivacyPolicyPage() {
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
            <span className="text-sm text-gray-500">Privacy Policy</span>
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
          <h1 className="mb-4 text-4xl font-bold">Privacy Policy</h1>
          <p className="mb-8 text-sm text-gray-500">Last updated: November 23, 2025</p>

          {/* Table of Contents */}
          <nav className="mb-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold">Contents</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#information-collected" className="text-blue-600 hover:underline">Information We Collect</a></li>
              <li><a href="#how-we-use" className="text-blue-600 hover:underline">How We Use Your Information</a></li>
              <li><a href="#third-party-services" className="text-blue-600 hover:underline">Third-Party Services</a></li>
              <li><a href="#data-storage" className="text-blue-600 hover:underline">Data Storage and Security</a></li>
              <li><a href="#cookies" className="text-blue-600 hover:underline">Cookies and Local Storage</a></li>
              <li><a href="#user-rights" className="text-blue-600 hover:underline">Your Rights</a></li>
              <li><a href="#data-retention" className="text-blue-600 hover:underline">Data Retention</a></li>
              <li><a href="#children" className="text-blue-600 hover:underline">Children&apos;s Privacy</a></li>
              <li><a href="#changes" className="text-blue-600 hover:underline">Changes to This Policy</a></li>
              <li><a href="#contact" className="text-blue-600 hover:underline">Contact Us</a></li>
            </ul>
          </nav>

          {/* Information Collected */}
          <section id="information-collected" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Information We Collect</h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="mt-6 mb-3 text-xl font-semibold">Information from GitHub OAuth</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                When you sign in with GitHub, we collect the following information from your GitHub account:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Your GitHub username and user ID</li>
                <li>Your email address</li>
                <li>Your profile name and avatar URL</li>
                <li>OAuth access token (used to access your repositories on your behalf)</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Repository Information</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                When you connect a repository, we store:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Repository owner and name</li>
                <li>Content path configuration (e.g., content/posts)</li>
                <li>Blog engine type (Hugo or Krems)</li>
                <li>Theme selection</li>
                <li>Site URL for deployment</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Usage Information</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We collect information about how you use StaticPress:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Post edit counts (for free tier usage tracking)</li>
                <li>Analytics events (e.g., repository connected, post published)</li>
                <li>Feedback submissions</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Payment Information</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                If you subscribe to a paid plan, payment information is collected and processed by Stripe.
                We store only your Stripe customer ID and subscription ID, not your payment card details.
              </p>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section id="how-we-use" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">How We Use Your Information</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We use the information we collect to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Authenticate you and maintain your session</li>
                <li>Access your GitHub repositories to read and write blog posts</li>
                <li>Store your repository configuration preferences</li>
                <li>Process subscription payments and manage your billing</li>
                <li>Track usage for free tier limitations</li>
                <li>Improve our service based on usage patterns</li>
                <li>Respond to your feedback and support requests</li>
                <li>Send service-related communications (e.g., subscription updates)</li>
              </ul>
            </div>
          </section>

          {/* Third-Party Services */}
          <section id="third-party-services" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Third-Party Services</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                StaticPress integrates with the following third-party services:
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">GitHub</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We use GitHub for authentication and repository access. When you connect your account,
                you authorize us to read and write to your repositories. GitHub&apos;s privacy policy applies
                to information stored in your repositories.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Stripe</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We use Stripe for payment processing. Stripe collects and processes your payment information
                according to their privacy policy. We do not store your credit card numbers or bank account details.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Supabase</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We use Supabase as our database provider to store user accounts, repository configurations,
                and usage data. Data is stored securely with encryption at rest.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Deployment Platforms</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Your blog may be deployed to platforms like GitHub Pages, Cloudflare Pages, Vercel, or Netlify.
                These platforms have their own privacy policies that govern how they handle your site content.
              </p>
            </div>
          </section>

          {/* Data Storage and Security */}
          <section id="data-storage" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Data Storage and Security</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We take reasonable measures to protect your information:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>All data is transmitted over HTTPS/TLS encryption</li>
                <li>Database storage is encrypted at rest</li>
                <li>OAuth tokens are stored securely and used only for authorized operations</li>
                <li>We use secure session management with JWT tokens</li>
                <li>Access to production systems is restricted and monitored</li>
              </ul>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Your blog content is stored in your own GitHub repository, not on our servers.
                We only access your content when you actively use the editor.
              </p>
            </div>
          </section>

          {/* Cookies and Local Storage */}
          <section id="cookies" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Cookies and Local Storage</h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="mt-6 mb-3 text-xl font-semibold">Essential Cookies</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We use essential cookies to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Maintain your authentication session</li>
                <li>Store your repository configuration preferences</li>
                <li>Remember your theme preference (light/dark mode)</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Local Storage</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We use browser local storage to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Cache post data for faster loading</li>
                <li>Store unsaved editor content to prevent data loss</li>
              </ul>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You can clear local storage through your browser settings at any time.
              </p>
            </div>
          </section>

          {/* User Rights */}
          <section id="user-rights" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Your Rights</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You have the following rights regarding your data:
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Access</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You can request a copy of the personal data we hold about you by contacting us.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Correction</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Your profile information syncs from GitHub. To update it, change your GitHub profile settings.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Deletion</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You can request deletion of your account and associated data by contacting us. This will:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Remove your user account from our database</li>
                <li>Delete your repository configurations</li>
                <li>Cancel any active subscriptions</li>
                <li>Remove usage tracking data</li>
              </ul>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Note: Your blog content remains in your GitHub repository as you own that data.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Revoke Access</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You can revoke StaticPress&apos;s access to your GitHub account at any time through your
                GitHub settings under Applications &gt; Authorized OAuth Apps.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Data Portability</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Your blog content is already portable as it lives in your GitHub repository in standard Markdown format.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section id="data-retention" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Data Retention</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We retain your data as follows:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li><strong>Account data:</strong> Retained while your account is active</li>
                <li><strong>Usage data:</strong> Retained for 12 months for analytics purposes</li>
                <li><strong>Payment records:</strong> Retained as required by law and for accounting purposes</li>
                <li><strong>Server logs:</strong> Retained for 30 days for security and debugging</li>
              </ul>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                After account deletion, we may retain certain data in anonymized form for analytics.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section id="children" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Children&apos;s Privacy</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                StaticPress is not intended for children under 13 years of age. We do not knowingly
                collect personal information from children under 13. If you believe we have collected
                information from a child under 13, please contact us immediately.
              </p>
            </div>
          </section>

          {/* Changes to This Policy */}
          <section id="changes" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Changes to This Policy</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We may update this privacy policy from time to time. We will notify you of any significant
                changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
                We encourage you to review this policy periodically.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section id="contact" className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-2 text-xl font-semibold">Contact Us</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              If you have questions about this privacy policy or our data practices, please contact us at:
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <a href="mailto:privacy@staticpress.me" className="text-blue-600 hover:underline">
                privacy@staticpress.me
              </a>
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/terms" className="text-blue-600 hover:underline text-sm">
                View Terms of Service
              </Link>
              <span className="mx-2 text-gray-400">|</span>
              <Link href="/help" className="text-blue-600 hover:underline text-sm">
                Help & Documentation
              </Link>
            </div>
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
