import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'
import { tiktokRequest } from '@/lib/tiktok'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (process.env.TIKTOK_POSTING_ENABLED !== 'true') return NextResponse.json({ error: 'TikTok posting is disabled until app approval is complete' }, { status: 403 })
  const input = await request.json() as { videoUrl?: string; title?: string; privacyLevel?: string }
  if (!input.videoUrl || !input.title || !input.privacyLevel) return NextResponse.json({ error: 'videoUrl, title, and privacyLevel are required' }, { status: 400 })
  const { data: connection } = await supabaseServer.from('tiktok_connections').select('access_token').eq('user_id', session.user.id).maybeSingle()
  if (!connection) return NextResponse.json({ error: 'TikTok is not connected' }, { status: 404 })
  try {
    const result = await tiktokRequest(connection.access_token, '/v2/post/publish/video/init/', { method: 'POST', body: JSON.stringify({ post_info: { title: input.title, privacy_level: input.privacyLevel, disable_duet: false, disable_comment: false, disable_stitch: false }, source_info: { source: 'PULL_FROM_URL', video_url: input.videoUrl } }) })
    return NextResponse.json(result, { status: 201 })
  } catch { return NextResponse.json({ error: 'TikTok publishing request failed' }, { status: 502 }) }
}
