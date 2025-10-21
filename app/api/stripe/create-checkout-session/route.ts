import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserByGithubId, logEvent } from '@/lib/db'
import { createCheckoutSession, PricingTier, BillingInterval } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await req.json()
    const { tier, interval } = body as { tier: PricingTier; interval: BillingInterval }

    // Validate tier and interval
    if (!tier || !['personal', 'smb', 'pro'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    if (!interval || !['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })
    }

    // Get user from database
    const user = await getUserByGithubId(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already on a paid tier
    if (user.subscription_tier !== 'free') {
      return NextResponse.json(
        { error: 'User already has a subscription. Please manage it via the billing portal.' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout session
    const checkoutSession = await createCheckoutSession({
      userId: user.id,
      userEmail: session.user.email,
      tier,
      interval,
      successUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard?upgrade=success`,
      cancelUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pricing?upgrade=canceled`,
    })

    // Log upgrade started event
    await logEvent('upgrade_started', user.id, { tier, interval })

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
