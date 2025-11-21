
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseClient, getUserByGithubId } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { type, message } = await req.json()

        if (!type || !message) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const user = await getUserByGithubId(session.user.id)
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const supabase = await getSupabaseClient()

        const { error } = await supabase
            .from('feedback')
            .insert({
                user_id: user.id,
                type,
                message
            })

        if (error) {
            console.error('Feedback insert error:', error)
            return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Feedback API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
