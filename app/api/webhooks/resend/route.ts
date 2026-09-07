import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

const MAX_WEBHOOK_AGE_MINUTES = 5

function decodeBase64(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

async function validSignature(body: string, id: string, timestamp: string, signature: string) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret || !id || !timestamp || !signature) return false

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > MAX_WEBHOOK_AGE_MINUTES * 60) return false

  const key = await crypto.subtle.importKey(
    'raw',
    decodeBase64(secret.replace(/^whsec_/, '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const message = new TextEncoder().encode(`${id}.${timestamp}.${body}`)
  const signatures = signature.split(' ').map((entry) => entry.split(',')[1]).filter(Boolean)
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, message))
  return signatures.some((candidate) => equalBytes(expected, decodeBase64(candidate)))
}

function recipientFor(event: Record<string, unknown>) {
  const data = event.data as Record<string, unknown> | undefined
  const recipients = data?.to
  if (Array.isArray(recipients)) return typeof recipients[0] === 'string' ? recipients[0].toLowerCase() : null
  return typeof recipients === 'string' ? recipients.toLowerCase() : null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const id = request.headers.get('svix-id') || ''
  const timestamp = request.headers.get('svix-timestamp') || ''
  const signature = request.headers.get('svix-signature') || ''

  if (!(await validSignature(body, id, timestamp, signature))) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  try {
    const event = JSON.parse(body) as Record<string, unknown>
    const data = event.data as Record<string, unknown> | undefined
    const { error } = await supabaseServer
      .from('email_delivery_events')
      .upsert({
        provider_event_id: id,
        provider_email_id: typeof data?.email_id === 'string' ? data.email_id : null,
        event_type: typeof event.type === 'string' ? event.type : 'unknown',
        recipient_email: recipientFor(event),
        occurred_at: typeof event.created_at === 'string' ? event.created_at : new Date().toISOString(),
        payload: event,
      }, { onConflict: 'provider_event_id' })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
