
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserByGithubId } from '@/lib/db'
import { GitHubClient } from '@/lib/github'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await getUserByGithubId(session.user.id)
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File
        const repoOwner = formData.get('owner') as string
        const repoName = formData.get('repo') as string

        if (!file || !repoOwner || !repoName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate file type (ico or png)
        if (!file.name.endsWith('.ico') && !file.name.endsWith('.png')) {
            return NextResponse.json({ error: 'Favicon must be .ico or .png' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const base64Content = buffer.toString('base64')

        const github = new GitHubClient(session.accessToken)

        // Get SHA of existing favicon if it exists
        const existingSha = await github.getFileSha(repoOwner, repoName, 'static/favicon.ico')
        console.log('Existing favicon SHA:', existingSha)

        // Upload to both locations for maximum theme compatibility
        const locations = [
            'static/favicon.ico',      // Standard location
            'static/images/favicon.ico' // Ananke theme location
        ]

        for (const location of locations) {
            const sha = await github.getFileSha(repoOwner, repoName, location)
            try {
                await github.createOrUpdateFile(
                    repoOwner,
                    repoName,
                    location,
                    base64Content,
                    'Update favicon via StaticPress',
                    sha || undefined,
                    true
                )
            } catch (uploadError) {
                console.error(`GitHub upload error for ${location}:`, uploadError)
                // Continue to next location even if one fails
            }
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Favicon upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
