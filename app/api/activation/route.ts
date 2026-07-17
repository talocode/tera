import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventType, metadata } = await req.json()

    if (!eventType) {
      return NextResponse.json({ error: 'Missing eventType' }, { status: 400 })
    }

    const validEvents = ['onboarding_viewed', 'onboarding_completed', 'quickstart_clicked', 'first_message_sent', 'first_credit_used']
    if (!validEvents.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
    }

    await supabaseServer.from('activation_events').insert({
      user_id: session.user.id,
      event_type: eventType,
      metadata: metadata || {},
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[activation_event_error]', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data } = await supabaseServer
      .from('activation_events')
      .select('event_type, metadata, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ events: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
