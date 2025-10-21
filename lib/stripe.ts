import Stripe from 'stripe'

// Lazy-initialize Stripe client to avoid build-time errors
let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (_stripe) {
    return _stripe
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw new Error('Missing Stripe configuration: STRIPE_SECRET_KEY')
  }

  _stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
  })

  return _stripe
}

export { getStripe as stripe }

type PriceIdsType = {
  readonly personal: {
    readonly monthly: string
    readonly yearly: string
  }
  readonly smb: {
    readonly monthly: string
    readonly yearly: string
  }
  readonly pro: {
    readonly monthly: string
    readonly yearly: string
  }
}

let _priceIds: PriceIdsType | null = null

function getPriceIds(): PriceIdsType {
  if (_priceIds) {
    return _priceIds
  }
  
  _priceIds = {
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
  }
  
  return _priceIds
}

export { getPriceIds as PRICE_IDS }

export type PricingTier = 'personal' | 'smb' | 'pro'
export type BillingInterval = 'monthly' | 'yearly'

type PricingConfigType = {
  readonly personal: {
    readonly name: string
    readonly monthly: { readonly amount: number; readonly priceId: string }
    readonly yearly: { readonly amount: number; readonly priceId: string }
    readonly features: readonly string[]
  }
  readonly smb: {
    readonly name: string
    readonly monthly: { readonly amount: number; readonly priceId: string }
    readonly yearly: { readonly amount: number; readonly priceId: string }
    readonly features: readonly string[]
  }
  readonly pro: {
    readonly name: string
    readonly monthly: { readonly amount: number; readonly priceId: string }
    readonly yearly: { readonly amount: number; readonly priceId: string }
    readonly features: readonly string[]
  }
}

let _pricingConfig: PricingConfigType | null = null

function getPricingConfig(): PricingConfigType {
  if (_pricingConfig) {
    return _pricingConfig
  }
  
  const priceIds = getPriceIds()
  
  _pricingConfig = {
    personal: {
      name: 'Personal',
      monthly: { amount: 2.5, priceId: priceIds.personal.monthly },
      yearly: { amount: 20, priceId: priceIds.personal.yearly },
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
      monthly: { amount: 5, priceId: priceIds.smb.monthly },
      yearly: { amount: 50, priceId: priceIds.smb.yearly },
      features: [
        'Everything in Personal',
        'Custom domain setup',
        'Theme gallery (5-8 curated themes)',
        '1 repository',
      ],
    },
    pro: {
      name: 'Pro',
      monthly: { amount: 10, priceId: priceIds.pro.monthly },
      yearly: { amount: 100, priceId: priceIds.pro.yearly },
      features: [
        'Everything in SMB',
        'Up to 5 repositories/sites',
        'Priority support',
      ],
    },
  }
  
  return _pricingConfig
}

export { getPricingConfig as PRICING_CONFIG }

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
  const priceIds = getPriceIds()
  const priceId = priceIds[tier][interval]
  const stripeClient = getStripe()

  const session = await stripeClient.checkout.sessions.create({
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
  const stripeClient = getStripe()
  
  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Get Stripe price ID from tier and interval
 */
export function getPriceId(tier: PricingTier, interval: BillingInterval): string {
  const priceIds = getPriceIds()
  return priceIds[tier][interval]
}

/**
 * Get tier from Stripe price ID
 */
export function getTierFromPriceId(priceId: string): PricingTier | null {
  const priceIds = getPriceIds()
  for (const [tier, prices] of Object.entries(priceIds)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return tier as PricingTier
    }
  }
  return null
}
