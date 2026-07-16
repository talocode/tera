import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { disconnectGmail } from '@/lib/gmail'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await disconnectGmail(session.user.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to disconnect Gmail' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[gmail_disconnect_error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
