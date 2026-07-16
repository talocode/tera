import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isGmailConnected, getGmailTokens } from '@/lib/gmail'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connected = await isGmailConnected(session.user.id)
    const tokens = await getGmailTokens(session.user.id)

    // Get email from database
    const { supabaseServer } = await import('@/lib/supabase-server')
    const { data: userData } = await supabaseServer
      .from('users')
      .select('google_email')
      .eq('id', session.user.id)
      .maybeSingle()

    return NextResponse.json({
      connected,
      email: userData?.google_email || null,
      hasTokens: !!tokens,
    })
  } catch (error) {
    console.error('[gmail_status_error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
