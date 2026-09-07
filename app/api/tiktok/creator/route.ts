import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'
import { tiktokRequest } from '@/lib/tiktok'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: connection } = await supabaseServer.from('tiktok_connections').select('access_token').eq('user_id', session.user.id).maybeSingle()
  if (!connection) return NextResponse.json({ error: 'TikTok is not connected' }, { status: 404 })
  try {
    const result = await tiktokRequest<{ data?: { user?: Record<string, unknown> } }>(connection.access_token, '/v2/user/info/?fields=open_id,display_name,avatar_url,profile_deep_link')
    return NextResponse.json(result.data?.user || {})
  } catch { return NextResponse.json({ error: 'Unable to load TikTok creator profile' }, { status: 502 }) }
}
