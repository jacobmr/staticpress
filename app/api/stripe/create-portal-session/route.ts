import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createPortalSession } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dynamically import database functions to prevent build-time initialization
    const { getUserByGithubId } = await import('@/lib/db')

    // Get user from database
    const user = await getUserByGithubId(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has a Stripe customer ID
    if (!user.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Create Stripe Customer Portal session
    const portalSession = await createPortalSession({
      customerId: user.stripe_customer_id,
      returnUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
