'use client'

import { useState } from 'react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'post_limit' | 'images' | 'custom_domain' | 'themes'
}

export function UpgradeModal({ isOpen, onClose, reason = 'post_limit' }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (tier: 'personal' | 'smb' | 'pro', interval: 'monthly' | 'yearly') => {
    setIsLoading(true)
    setError(null)

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier, interval }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const reasonMessages = {
    post_limit: {
      title: 'Upgrade to Edit All Posts',
      description: 'Free tier is limited to editing your 5 most recent posts. Upgrade to Personal to edit all posts.',
    },
    images: {
      title: 'Upgrade for Image Support',
      description: 'Image uploads are available on Personal tier and above.',
    },
    custom_domain: {
      title: 'Upgrade for Custom Domains',
      description: 'Custom domain setup is available on SMB tier and above.',
    },
    themes: {
      title: 'Upgrade for Theme Gallery',
      description: 'Access to premium themes is available on SMB tier and above.',
    },
  }

  const message = reasonMessages[reason]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-8 shadow-xl dark:bg-gray-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-3xl font-bold">{message.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{message.description}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Personal Tier */}
          <div className="relative rounded-lg border-2 border-blue-500 bg-blue-50 p-6 shadow-lg dark:bg-blue-950">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              MOST POPULAR
            </div>
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
                <span>Edit all posts (no 5-post limit)</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Image uploads & optimization</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Categories & tags</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Preview before publish</span>
              </li>
            </ul>
            <div className="space-y-2">
              <button
                onClick={() => handleUpgrade('personal', 'monthly')}
                disabled={isLoading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Monthly ($2.50)'}
              </button>
              <button
                onClick={() => handleUpgrade('personal', 'yearly')}
                disabled={isLoading}
                className="w-full rounded-md border-2 border-blue-600 bg-white px-4 py-2 font-bold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 disabled:opacity-50 dark:bg-transparent dark:hover:bg-blue-950"
              >
                {isLoading ? 'Loading...' : 'Yearly ($20) - Best Value'}
              </button>
            </div>
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
                <span>Theme gallery (5-8 themes)</span>
              </li>
            </ul>
            <div className="space-y-2">
              <button
                onClick={() => handleUpgrade('smb', 'monthly')}
                disabled={isLoading}
                className="w-full rounded-md bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Monthly ($5)'}
              </button>
              <button
                onClick={() => handleUpgrade('smb', 'yearly')}
                disabled={isLoading}
                className="w-full rounded-md border border-purple-600 px-4 py-2 font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-50 dark:hover:bg-purple-950"
              >
                {isLoading ? 'Loading...' : 'Yearly ($50)'}
              </button>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="rounded-lg border-2 border-gradient-to-r from-yellow-400 to-orange-500 p-6">
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
                <span>Up to 5 repositories/sites</span>
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Priority support</span>
              </li>
            </ul>
            <div className="space-y-2">
              <button
                onClick={() => handleUpgrade('pro', 'monthly')}
                disabled={isLoading}
                className="w-full rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 font-medium text-white hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Monthly ($10)'}
              </button>
              <button
                onClick={() => handleUpgrade('pro', 'yearly')}
                disabled={isLoading}
                className="w-full rounded-md border-2 border-orange-500 px-4 py-2 font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50 dark:hover:bg-orange-950"
              >
                {isLoading ? 'Loading...' : 'Yearly ($100)'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          All plans include secure payments via Stripe. Cancel anytime.
        </div>
      </div>
    </div>
  )
}
