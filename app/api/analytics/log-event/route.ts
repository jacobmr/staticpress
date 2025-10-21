import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserByGithubId, logEvent, EventName } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { event_name, metadata = {} } = body as {
      event_name: EventName
      metadata?: Record<string, unknown>
    }

    if (!event_name) {
      return NextResponse.json({ error: 'Missing event_name' }, { status: 400 })
    }

    // Get user ID from database
    const user = await getUserByGithubId(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log the event
    await logEvent(event_name, user.id, metadata)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging event:', error)
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
  }
}
