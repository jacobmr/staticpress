import { auth } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutButton } from "@/components/auth-buttons"
import { signOutUser } from "@/lib/auth-actions"

export default async function TermsOfServicePage() {
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
            <span className="text-sm text-gray-500">Terms of Service</span>
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
          <h1 className="mb-4 text-4xl font-bold">Terms of Service</h1>
          <p className="mb-8 text-sm text-gray-500">Last updated: November 23, 2025</p>

          {/* Table of Contents */}
          <nav className="mb-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold">Contents</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#acceptance" className="text-blue-600 hover:underline">Acceptance of Terms</a></li>
              <li><a href="#service-description" className="text-blue-600 hover:underline">Service Description</a></li>
              <li><a href="#account-terms" className="text-blue-600 hover:underline">Account Terms</a></li>
              <li><a href="#user-responsibilities" className="text-blue-600 hover:underline">User Responsibilities</a></li>
              <li><a href="#subscriptions" className="text-blue-600 hover:underline">Subscriptions and Billing</a></li>
              <li><a href="#intellectual-property" className="text-blue-600 hover:underline">Intellectual Property</a></li>
              <li><a href="#prohibited-uses" className="text-blue-600 hover:underline">Prohibited Uses</a></li>
              <li><a href="#service-availability" className="text-blue-600 hover:underline">Service Availability</a></li>
              <li><a href="#limitation-liability" className="text-blue-600 hover:underline">Limitation of Liability</a></li>
              <li><a href="#indemnification" className="text-blue-600 hover:underline">Indemnification</a></li>
              <li><a href="#termination" className="text-blue-600 hover:underline">Termination</a></li>
              <li><a href="#governing-law" className="text-blue-600 hover:underline">Governing Law</a></li>
              <li><a href="#changes" className="text-blue-600 hover:underline">Changes to Terms</a></li>
              <li><a href="#contact" className="text-blue-600 hover:underline">Contact Us</a></li>
            </ul>
          </nav>

          {/* Acceptance of Terms */}
          <section id="acceptance" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Acceptance of Terms</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                By accessing or using StaticPress, you agree to be bound by these Terms of Service and our
                Privacy Policy. If you do not agree to these terms, you may not use the service.
              </p>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                These terms constitute a legally binding agreement between you and StaticPress. Please read
                them carefully before using our service.
              </p>
            </div>
          </section>

          {/* Service Description */}
          <section id="service-description" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Service Description</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                StaticPress is a web-based WYSIWYG editor for Hugo and Krems static site blogs with GitHub
                integration. The service allows you to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Authenticate via GitHub OAuth and connect your repositories</li>
                <li>Create and edit blog posts through a visual editor</li>
                <li>Commit changes directly to your GitHub repository</li>
                <li>Deploy your blog to various platforms</li>
                <li>Upload images and manage blog content</li>
              </ul>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                StaticPress acts as an interface to your GitHub repository. Your content is stored in your
                own GitHub account, not on our servers.
              </p>
            </div>
          </section>

          {/* Account Terms */}
          <section id="account-terms" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Account Terms</h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="mt-6 mb-3 text-xl font-semibold">Account Creation</h3>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>You must have a valid GitHub account to use StaticPress</li>
                <li>You must be at least 13 years old to use this service</li>
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining the security of your GitHub account</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Account Security</h3>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use</li>
                <li>We are not liable for any loss resulting from unauthorized access to your account</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">One Account Per Person</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Each user may only maintain one free account. Paid accounts may be used for business purposes.
              </p>
            </div>
          </section>

          {/* User Responsibilities */}
          <section id="user-responsibilities" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">User Responsibilities</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                As a user of StaticPress, you agree to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Use the service only for lawful purposes</li>
                <li>Ensure you have the right to publish any content you create</li>
                <li>Not violate any applicable laws or regulations</li>
                <li>Not infringe on the intellectual property rights of others</li>
                <li>Not attempt to gain unauthorized access to other systems</li>
                <li>Not interfere with or disrupt the service</li>
                <li>Comply with GitHub&apos;s Terms of Service when using connected repositories</li>
              </ul>
            </div>
          </section>

          {/* Subscriptions and Billing */}
          <section id="subscriptions" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Subscriptions and Billing</h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="mt-6 mb-3 text-xl font-semibold">Free Tier</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                The free tier includes limited access to features. Free tier users can edit their 5 most
                recent posts and do not have access to image uploads.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Paid Subscriptions</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Paid subscriptions (Personal, SMB, Pro) are billed monthly or annually, depending on your
                selection. All prices are in USD.
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li><strong>Personal:</strong> $2.50/month or $20/year</li>
                <li><strong>SMB:</strong> $5/month or $50/year</li>
                <li><strong>Pro:</strong> $10/month or $100/year</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Billing</h3>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>All payments are processed through Stripe</li>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>You will be charged at the start of each billing period</li>
                <li>Prices may change with 30 days notice</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Cancellation and Refunds</h3>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>You may cancel your subscription at any time</li>
                <li>Access continues until the end of the current billing period</li>
                <li>No refunds for partial billing periods</li>
                <li>After cancellation, your account reverts to the free tier</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Failed Payments</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                If a payment fails, we will attempt to charge your payment method again. If payment
                continues to fail, your subscription may be suspended or cancelled.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section id="intellectual-property" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Intellectual Property</h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="mt-6 mb-3 text-xl font-semibold">Your Content</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You retain full ownership of all content you create using StaticPress. Your blog posts,
                images, and other content belong to you and are stored in your own GitHub repository.
                We claim no intellectual property rights over your content.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">License to Use Your Content</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                By using StaticPress, you grant us a limited license to access, process, and display
                your content solely for the purpose of providing the service to you. This license ends
                when you delete your account or disconnect your repository.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">StaticPress Property</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                StaticPress and its original content, features, and functionality are owned by StaticPress
                and are protected by copyright, trademark, and other intellectual property laws. You may
                not copy, modify, distribute, or reverse engineer any part of the service.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Feedback</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                If you provide feedback or suggestions about StaticPress, we may use this feedback without
                any obligation to you.
              </p>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section id="prohibited-uses" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Prohibited Uses</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You may not use StaticPress to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Publish illegal, harmful, threatening, abusive, or harassing content</li>
                <li>Distribute malware, viruses, or other harmful code</li>
                <li>Spam or send unsolicited communications</li>
                <li>Infringe on copyrights, trademarks, or other intellectual property</li>
                <li>Impersonate any person or entity</li>
                <li>Collect personal information from others without consent</li>
                <li>Interfere with the operation of the service</li>
                <li>Attempt to bypass any security measures</li>
                <li>Use the service for any commercial purpose without a paid subscription</li>
                <li>Resell or redistribute the service without authorization</li>
              </ul>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Violation of these prohibited uses may result in immediate termination of your account.
              </p>
            </div>
          </section>

          {/* Service Availability */}
          <section id="service-availability" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Service Availability and Modifications</h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="mt-6 mb-3 text-xl font-semibold">Availability</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We strive to maintain high availability but do not guarantee uninterrupted access. The
                service may be temporarily unavailable due to maintenance, updates, or circumstances
                beyond our control.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Service Modifications</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We reserve the right to modify, suspend, or discontinue any part of the service at any
                time, with or without notice. We are not liable for any modification, suspension, or
                discontinuation of the service.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Third-Party Dependencies</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                StaticPress depends on third-party services (GitHub, Stripe, etc.). We are not responsible
                for outages or issues caused by these third-party services.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section id="limitation-liability" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Limitation of Liability</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, STATICPRESS AND ITS OFFICERS, DIRECTORS, EMPLOYEES,
                AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Loss of profits, data, use, or goodwill</li>
                <li>Service interruption or computer damage</li>
                <li>Cost of substitute services</li>
                <li>Any damages arising from your use of the service</li>
              </ul>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12)
                MONTHS PRECEDING THE CLAIM.
              </p>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section id="indemnification" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Indemnification</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You agree to indemnify, defend, and hold harmless StaticPress and its officers, directors,
                employees, contractors, and agents from any claims, damages, losses, liabilities, and
                expenses (including legal fees) arising from:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Your use of the service</li>
                <li>Your violation of these terms</li>
                <li>Your content or its publication</li>
                <li>Your violation of any third-party rights</li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section id="termination" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Termination</h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="mt-6 mb-3 text-xl font-semibold">Termination by You</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You may terminate your account at any time by contacting us. Upon termination:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Your access to the service will be revoked</li>
                <li>Your account data will be deleted according to our Privacy Policy</li>
                <li>Your content remains in your GitHub repository</li>
                <li>Any outstanding payments remain due</li>
              </ul>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Termination by Us</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We may suspend or terminate your account if:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>You violate these terms</li>
                <li>Your payment method fails repeatedly</li>
                <li>We are required to by law</li>
                <li>We discontinue the service</li>
              </ul>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We will provide reasonable notice before termination, except in cases of serious violation
                where immediate action is required.
              </p>

              <h3 className="mt-6 mb-3 text-xl font-semibold">Effect of Termination</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Sections that by their nature should survive termination will survive, including intellectual
                property, limitation of liability, indemnification, and governing law provisions.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section id="governing-law" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Governing Law and Disputes</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                These terms shall be governed by and construed in accordance with the laws of the State
                of Delaware, United States, without regard to its conflict of law provisions.
              </p>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Any disputes arising from these terms or your use of the service shall be resolved through
                binding arbitration in accordance with the rules of the American Arbitration Association.
                You agree to waive your right to a jury trial and to participate in class actions.
              </p>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Notwithstanding the above, we may seek injunctive relief in any court of competent
                jurisdiction to protect our intellectual property rights.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section id="changes" className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Changes to Terms</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We reserve the right to modify these terms at any time. We will provide notice of significant
                changes by:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li>Posting the updated terms on this page</li>
                <li>Updating the &quot;Last updated&quot; date</li>
                <li>Sending an email to registered users (for material changes)</li>
              </ul>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Your continued use of the service after changes become effective constitutes acceptance
                of the revised terms. If you do not agree to the new terms, you must stop using the service.
              </p>
            </div>
          </section>

          {/* Miscellaneous */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Miscellaneous</h2>
            <div className="prose dark:prose-invert max-w-none">
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
                <li><strong>Entire Agreement:</strong> These terms constitute the entire agreement between you and StaticPress.</li>
                <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions will continue in effect.</li>
                <li><strong>Waiver:</strong> Failure to enforce any right or provision does not constitute a waiver.</li>
                <li><strong>Assignment:</strong> You may not assign these terms without our consent. We may assign our rights at any time.</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section id="contact" className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-2 text-xl font-semibold">Contact Us</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <a href="mailto:legal@staticpress.me" className="text-blue-600 hover:underline">
                legal@staticpress.me
              </a>
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/privacy" className="text-blue-600 hover:underline text-sm">
                View Privacy Policy
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
