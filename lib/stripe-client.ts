import { loadStripe, Stripe } from '@stripe/stripe-js'

// Singleton instance of Stripe.js
let stripePromise: Promise<Stripe | null>

/**
 * Get Stripe.js instance (client-side only)
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}
