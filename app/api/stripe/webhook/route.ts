import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, getTierFromPriceId } from '@/lib/stripe'
import Stripe from 'stripe'

// Disable body parsing for webhook
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    const stripeClient = stripe()
    
    // Verify webhook signature
    event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const { addUniqueKey } = await import('@/lib/cache')
  if (!addUniqueKey(`webhook:${event.id}`, 86400)) {
    console.log(`Duplicate webhook event: ${event.id}`)
    return NextResponse.json({ received: true })
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const tier = session.metadata?.tier

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Get the subscription
  const subscriptionId = session.subscription as string
  const customerId = session.customer as string

  // Dynamically import database functions
  const { getSupabaseClient, logEvent } = await import('@/lib/db')

  // Update user in database
  const supabase = await getSupabaseClient()
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parseInt(userId))

  if (error) {
    console.error('Failed to update user subscription:', error)
    throw error
  }

  // Log upgrade completed event
  await logEvent('upgrade_completed', parseInt(userId), { tier })

  console.log(`User ${userId} upgraded to ${tier}`)
}

/**
 * Handle subscription update (e.g., plan change, renewal)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Get tier from price ID
  const priceId = subscription.items.data[0]?.price.id
  const tier = priceId ? getTierFromPriceId(priceId) : null

  if (!tier) {
    console.error('Could not determine tier from price ID:', priceId)
    return
  }

  // Dynamically import database functions
  const { getSupabaseClient } = await import('@/lib/db')

  // Update user subscription status
  const status = subscription.status === 'active' ? 'active' :
                 subscription.status === 'canceled' ? 'canceled' :
                 'expired'

  const supabase = await getSupabaseClient()
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: status === 'active' ? tier : 'free',
      subscription_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parseInt(userId))

  if (error) {
    console.error('Failed to update subscription status:', error)
    throw error
  }

  console.log(`User ${userId} subscription updated: ${status}`)
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Dynamically import database functions
  const { getSupabaseClient } = await import('@/lib/db')

  // Downgrade user to free tier
  const supabase = await getSupabaseClient()
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', parseInt(userId))

  if (error) {
    console.error('Failed to downgrade user:', error)
    throw error
  }

  console.log(`User ${userId} subscription canceled, downgraded to free`)
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Subscription can be a string ID or expanded object
  const subscriptionField = (invoice as { subscription?: string | Stripe.Subscription }).subscription
  const subscriptionId = typeof subscriptionField === 'string'
    ? subscriptionField
    : subscriptionField?.id
  if (!subscriptionId) return

  const stripeClient = stripe()
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.user_id

  if (userId) {
    const { logEvent } = await import('@/lib/db')

    await logEvent('payment_succeeded', parseInt(userId), {
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
    })
  }

  console.log(`Payment succeeded for invoice ${invoice.id}`)
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Subscription can be a string ID or expanded object
  const subscriptionField = (invoice as { subscription?: string | Stripe.Subscription }).subscription
  const subscriptionId = typeof subscriptionField === 'string'
    ? subscriptionField
    : subscriptionField?.id
  if (!subscriptionId) return

  const stripeClient = stripe()
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.user_id

  if (userId) {
    const { logEvent } = await import('@/lib/db')

    await logEvent('payment_failed', parseInt(userId), {
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
    })
  }

  console.log(`Payment failed for invoice ${invoice.id}`)
}
