import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabaseServer.from('tiktok_connections').select('open_id,display_name,avatar_url,scopes,connected_at,token_expires_at').eq('user_id', session.user.id).maybeSingle()
  return NextResponse.json({ connected: Boolean(data), connection: data || null })
}
