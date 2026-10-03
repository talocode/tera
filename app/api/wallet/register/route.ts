import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isSolanaAddress } from '@/lib/tcode/crypto'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const walletAddress = String(body?.walletAddress || '').trim()
  if (!isSolanaAddress(walletAddress)) {
    return NextResponse.json({ ok: false, error: 'walletAddress must be a Solana address' }, { status: 400 })
  }

  const userId = session.user.id
  const now = new Date().toISOString()
  const { data: existing, error: readError } = await supabaseServer
    .from('credit_usage_events')
    .select('id, metadata')
    .eq('event_type', 'tera_wallet')
    .eq('user_id', userId)
    .limit(1)

  if (readError) {
    return NextResponse.json({ ok: false, error: 'Could not record wallet' }, { status: 503 })
  }

  const row = existing?.[0]
  if (row) {
    if (row.metadata?.walletAddress === walletAddress) {
      return NextResponse.json({ ok: true, recorded: true })
    }
    const { error } = await supabaseServer
      .from('credit_usage_events')
      .update({
        metadata: {
          kind: 'tera_wallet',
          walletAddress,
          createdAt: row.metadata?.createdAt || now,
          updatedAt: now,
        },
      })
      .eq('id', row.id)
    if (error) return NextResponse.json({ ok: false, error: 'Could not record wallet' }, { status: 503 })
    return NextResponse.json({ ok: true, recorded: true })
  }

  const { error } = await supabaseServer.from('credit_usage_events').insert({
    user_id: userId,
    event_type: 'tera_wallet',
    credits_charged: 0,
    token_usage: 0,
    metadata: { kind: 'tera_wallet', walletAddress, createdAt: now },
  })
  if (error) return NextResponse.json({ ok: false, error: 'Could not record wallet' }, { status: 503 })
  return NextResponse.json({ ok: true, recorded: true })
}
