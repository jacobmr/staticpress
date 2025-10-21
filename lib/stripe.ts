import Stripe from 'stripe'

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

// Subscription tier to Stripe price ID mapping
export const PRICE_IDS = {
  personal: {
    monthly: process.env.STRIPE_PERSONAL_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_PERSONAL_YEARLY_PRICE_ID!,
  },
  smb: {
    monthly: process.env.STRIPE_SMB_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_SMB_YEARLY_PRICE_ID!,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  },
} as const

export type PricingTier = 'personal' | 'smb' | 'pro'
export type BillingInterval = 'monthly' | 'yearly'

// Pricing configuration for display
export const PRICING_CONFIG = {
  personal: {
    name: 'Personal',
    monthly: { amount: 2.5, priceId: PRICE_IDS.personal.monthly },
    yearly: { amount: 20, priceId: PRICE_IDS.personal.yearly },
    features: [
      'Edit all posts (no 5-post limit)',
      'Image uploads & optimization',
      'Categories & tags',
      'Preview before publish',
      '1 repository',
    ],
  },
  smb: {
    name: 'SMB',
    monthly: { amount: 5, priceId: PRICE_IDS.smb.monthly },
    yearly: { amount: 50, priceId: PRICE_IDS.smb.yearly },
    features: [
      'Everything in Personal',
      'Custom domain setup',
      'Theme gallery (5-8 curated themes)',
      '1 repository',
    ],
  },
  pro: {
    name: 'Pro',
    monthly: { amount: 10, priceId: PRICE_IDS.pro.monthly },
    yearly: { amount: 100, priceId: PRICE_IDS.pro.yearly },
    features: [
      'Everything in SMB',
      'Up to 5 repositories/sites',
      'Priority support',
    ],
  },
} as const

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession({
  userId,
  userEmail,
  tier,
  interval,
  successUrl,
  cancelUrl,
}: {
  userId: number
  userEmail: string
  tier: PricingTier
  interval: BillingInterval
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const priceId = PRICE_IDS[tier][interval]

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      tier,
      interval,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        user_id: userId.toString(),
        tier,
      },
    },
  })

  return session
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Get Stripe price ID from tier and interval
 */
export function getPriceId(tier: PricingTier, interval: BillingInterval): string {
  return PRICE_IDS[tier][interval]
}

/**
 * Get tier from Stripe price ID
 */
export function getTierFromPriceId(priceId: string): PricingTier | null {
  for (const [tier, prices] of Object.entries(PRICE_IDS)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return tier as PricingTier
    }
  }
  return null
}
