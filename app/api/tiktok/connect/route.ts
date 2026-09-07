import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'
import { getTikTokAuthorizationUrl } from '@/lib/tiktok'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const state = crypto.randomUUID()
  const { error } = await supabaseServer.from('tiktok_oauth_states').insert({ state, user_id: session.user.id, expires_at: new Date(Date.now() + 10 * 60_000).toISOString() })
  if (error) return NextResponse.json({ error: 'Unable to start TikTok connection' }, { status: 500 })
  return NextResponse.json({ url: getTikTokAuthorizationUrl(state, request.nextUrl.origin) })
}
