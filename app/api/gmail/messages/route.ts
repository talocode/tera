import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGmailMessages } from '@/lib/gmail'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const maxResults = Number(req.nextUrl.searchParams.get('maxResults') || '10')
    const query = req.nextUrl.searchParams.get('query') || undefined

    const messages = await getGmailMessages(session.user.id, {
      maxResults: Math.min(maxResults, 50),
      query,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('[gmail_messages_error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
