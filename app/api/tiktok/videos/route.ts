import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'
import { tiktokRequest } from '@/lib/tiktok'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: connection } = await supabaseServer.from('tiktok_connections').select('access_token').eq('user_id', session.user.id).maybeSingle()
  if (!connection) return NextResponse.json({ error: 'TikTok is not connected' }, { status: 404 })
  const cursor = request.nextUrl.searchParams.get('cursor') || '0'
  try {
    const result = await tiktokRequest(connection.access_token, '/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,share_url,view_count', { method: 'POST', body: JSON.stringify({ max_count: 20, cursor: Number(cursor) }) })
    return NextResponse.json(result)
  } catch { return NextResponse.json({ error: 'Unable to load TikTok videos' }, { status: 502 }) }
}
