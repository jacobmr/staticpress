'use client'

import { useState } from 'react'

interface PricingClientProps {
  currentTier: 'free' | 'personal' | 'smb' | 'pro'
  userId: number | null
  hasStripeCustomer: boolean
}

export function PricingClient({ currentTier, userId, hasStripeCustomer }: PricingClientProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (tier: 'personal' | 'smb' | 'pro', interval: 'monthly' | 'yearly') => {
    if (!userId) {
      window.location.href = '/'
      return
    }

    setIsLoading(true)
    setError(null)

    try {
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

  const handleManageSubscription = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to open billing portal')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for trying out StaticPress',
      features: [
        'Edit last 5 posts',
        'Text-only blogging',
        '1 repository',
        'Categories & tags',
        'Preview before publish',
        'GitHub integration',
      ],
      limitations: ['No images', 'Limited to 5 most recent posts'],
      color: 'gray',
      cta: 'Current Plan',
    },
    {
      id: 'personal',
      name: 'Personal',
      price: { monthly: 2.5, yearly: 20 },
      description: 'For individual bloggers who need images',
      features: [
        'Edit all posts (unlimited)',
        'Image uploads & optimization',
        'Categories & tags',
        'Preview before publish',
        '1 repository',
        'GitHub integration',
      ],
      popular: true,
      color: 'blue',
      cta: 'Upgrade to Personal',
    },
    {
      id: 'smb',
      name: 'SMB',
      price: { monthly: 5, yearly: 50 },
      description: 'Small businesses needing professional branding',
      features: [
        'Everything in Personal',
        'Custom domain setup',
        'Theme gallery (5-8 themes)',
        'One-click theme switching',
        '1 repository',
      ],
      color: 'purple',
      cta: 'Upgrade to SMB',
      comingSoon: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: 10, yearly: 100 },
      description: 'Agencies managing multiple sites',
      features: [
        'Everything in SMB',
        'Up to 5 repositories/sites',
        'Multi-site management',
        'Priority support',
      ],
      color: 'orange',
      cta: 'Upgrade to Pro',
      comingSoon: true,
    },
  ]

  return (
    <div>
      {/* Billing Toggle */}
      <div className="mb-8 flex items-center justify-center gap-4">
        <span className={`text-sm ${billingInterval === 'monthly' ? 'font-semibold' : 'text-gray-600'}`}>
          Monthly
        </span>
        <button
          onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            billingInterval === 'yearly' ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
              billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm ${billingInterval === 'yearly' ? 'font-semibold' : 'text-gray-600'}`}>
          Yearly <span className="text-green-600">(Save 17%)</span>
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 mx-auto max-w-2xl rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => {
          const isCurrentTier = tier.id === currentTier
          const canUpgrade = tier.id !== 'free' && !isCurrentTier
          const tierIndex = ['free', 'personal', 'smb', 'pro'].indexOf(tier.id)
          const currentTierIndex = ['free', 'personal', 'smb', 'pro'].indexOf(currentTier)
          const isDowngrade = tierIndex < currentTierIndex

          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl border-2 p-8 ${
                tier.popular
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700'
              } ${isCurrentTier ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{tier.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    ${billingInterval === 'monthly' ? tier.price.monthly : tier.price.yearly}
                  </span>
                  {tier.id !== 'free' && (
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  )}
                </div>
                {tier.id !== 'free' && billingInterval === 'yearly' && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    ${(tier.price.yearly / 12).toFixed(2)}/month billed annually
                  </p>
                )}
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <svg
                      className={`mr-3 mt-0.5 h-5 w-5 flex-shrink-0 ${
                        tier.color === 'blue' ? 'text-blue-600' :
                        tier.color === 'purple' ? 'text-purple-600' :
                        tier.color === 'orange' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
                {tier.limitations?.map((limitation, idx) => (
                  <li key={`limitation-${idx}`} className="flex items-start text-sm text-gray-500">
                    <svg
                      className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>

              {isCurrentTier ? (
                <div>
                  <button
                    disabled
                    className="w-full rounded-md bg-gray-300 px-6 py-3 font-medium text-gray-600 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                  {hasStripeCustomer && tier.id !== 'free' && (
                    <button
                      onClick={handleManageSubscription}
                      disabled={isLoading}
                      className="mt-2 w-full rounded-md border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {isLoading ? 'Loading...' : 'Manage Subscription'}
                    </button>
                  )}
                </div>
              ) : tier.id === 'free' ? (
                <button
                  disabled
                  className="w-full rounded-md border border-gray-300 px-6 py-3 font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  Free Forever
                </button>
              ) : tier.comingSoon ? (
                <div className="text-center">
                  <button
                    disabled
                    className="w-full rounded-md bg-gray-300 px-6 py-3 font-medium text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  >
                    Coming Soon
                  </button>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Available in Q2 2025
                  </p>
                </div>
              ) : canUpgrade && !isDowngrade ? (
                <button
                  onClick={() => handleUpgrade(tier.id as 'personal' | 'smb' | 'pro', billingInterval)}
                  disabled={isLoading}
                  className={`w-full rounded-md px-6 py-3 font-medium text-white disabled:opacity-50 ${
                    tier.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                    tier.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                    'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600'
                  }`}
                >
                  {isLoading ? 'Loading...' : tier.cta}
                </button>
              ) : (
                <button
                  onClick={handleManageSubscription}
                  disabled={isLoading || !hasStripeCustomer}
                  className="w-full rounded-md border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {isLoading ? 'Loading...' : 'Manage Subscription'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Feature Comparison Note */}
      <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>All plans include GitHub integration, WYSIWYG editor, and automatic Hugo file management.</p>
      </div>
    </div>
  )
}
