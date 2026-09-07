import { NextRequest, NextResponse } from 'next/server'
import { exchangeTikTokCode } from '@/lib/tiktok'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code'); const state = searchParams.get('state')
  if (!code || !state) return NextResponse.redirect(new URL('/?tiktok=missing_params', request.url))
  const { data: pending } = await supabaseServer.from('tiktok_oauth_states').select('user_id,expires_at').eq('state', state).maybeSingle()
  await supabaseServer.from('tiktok_oauth_states').delete().eq('state', state)
  if (!pending || new Date(pending.expires_at) < new Date()) return NextResponse.redirect(new URL('/?tiktok=invalid_state', request.url))
  try {
    const tokens = await exchangeTikTokCode(code, request.nextUrl.origin)
    const now = Date.now()
    const { error } = await supabaseServer.from('tiktok_connections').upsert({ user_id: pending.user_id, open_id: tokens.open_id, access_token: tokens.access_token, refresh_token: tokens.refresh_token || null, token_expires_at: tokens.expires_in ? new Date(now + tokens.expires_in * 1000).toISOString() : null, refresh_expires_at: tokens.refresh_expires_in ? new Date(now + tokens.refresh_expires_in * 1000).toISOString() : null, scopes: tokens.scope ? tokens.scope.split(/[,\s]+/).filter(Boolean) : [], updated_at: new Date().toISOString() })
    if (error) throw error
    return NextResponse.redirect(new URL('/?tiktok=connected', request.url))
  } catch { return NextResponse.redirect(new URL('/?tiktok=error', request.url)) }
}
