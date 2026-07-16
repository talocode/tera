import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGmailAuthUrl } from '@/lib/gmail'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = getGmailAuthUrl(session.user.id)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('[gmail_auth_error]', error)
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}
