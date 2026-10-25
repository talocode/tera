import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPaidCreditsRemaining, spendPaidCredits, addPurchasedCredits } from '@/lib/free-plan-credits'
import { generatePlatformResponse } from '@/lib/mistral'
import { recordUsageLedgerEvent } from '@/lib/usage-ledger'

export const runtime = 'nodejs'
export const maxDuration = 60

const VERIFIED_CREDIT_COST = 1

function extractUrls(text: string): string[] {
  const found = text.match(/https:\/\/[^\s)\]>"']+/g) || []
  const urls: string[] = []
  for (const raw of found) {
    try {
      const url = new URL(raw.replace(/[.,;]+$/, ''))
      if (url.protocol !== 'https:') continue
      const host = url.hostname.toLowerCase()
      if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) continue
      if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0)/.test(host)) continue
      urls.push(url.toString())
    } catch {
      continue
    }
  }
  return [...new Set(urls)].slice(0, 3)
}

async function sourceChecksOut(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'TeraVerifiedCall/1.0' },
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  if (prompt.length < 8 || prompt.length > 2000) {
    return NextResponse.json({ ok: false, error: 'Ask a question between 8 and 2000 characters.' }, { status: 400 })
  }

  let paidCredits = 0
  try {
    paidCredits = await getPaidCreditsRemaining(session.user.id)
  } catch {
    return NextResponse.json({ ok: false, error: 'Tera could not read your paid credit balance.' }, { status: 503 })
  }

  if (paidCredits < VERIFIED_CREDIT_COST) {
    return NextResponse.json({
      ok: false,
      error: 'This call runs only on credits you bought. A hold does not run it. The minimum top-up is $5.',
      code: 'paid_topup_required',
      paidCredits,
      pricingPath: '/pricing',
    }, { status: 402 })
  }

  let draft = ''
  try {
    const generated = await generatePlatformResponse({
      prompt: [
        'Answer the question in plain text.',
        'Cite one public https source that a person can open.',
        'If you cannot name a source you would expect to load, say you cannot verify it and do not invent a URL.',
        '',
        prompt,
      ].join('\n'),
      tool: 'verified-call',
      attachments: [],
      history: [],
      userId: session.user.id,
      researchMode: false,
      chatMode: 'search',
      researchContext: '',
    })
    draft = generated.text || ''
  } catch (error) {
    console.error('[verified_call_model_failed]', { userId: session.user.id, error })
    return NextResponse.json({ ok: false, error: 'The verified call did not run. You were not charged.' }, { status: 503 })
  }

  let source: string | null = null
  for (const url of extractUrls(draft)) {
    if (await sourceChecksOut(url)) {
      source = url
      break
    }
  }

  const verified = Boolean(source)
  const answer = verified
    ? draft
    : 'The source did not check out. I will not give you an answer.'

  const spent = await spendPaidCredits(session.user.id, VERIFIED_CREDIT_COST)
  if (!spent) {
    return NextResponse.json({
      ok: false,
      error: 'This call runs only on credits you bought. A hold does not run it. The minimum top-up is $5.',
      code: 'paid_topup_required',
      pricingPath: '/pricing',
    }, { status: 402 })
  }

  const recorded = await recordUsageLedgerEvent({
    userId: session.user.id,
    eventType: 'chat_generation',
    status: verified ? 'succeeded' : 'failed',
    plan: 'free',
    tool: 'verified-call',
    creditsCharged: VERIFIED_CREDIT_COST,
    metadata: { kind: 'verified_call', verified, source },
  })

  if (!recorded) {
    await addPurchasedCredits(session.user.id, VERIFIED_CREDIT_COST)
    return NextResponse.json({ ok: false, error: 'The call ran, but the receipt did not save. You were not charged.' }, { status: 503 })
  }

  let remaining = 0
  try {
    remaining = await getPaidCreditsRemaining(session.user.id)
  } catch {
    remaining = Math.max(0, paidCredits - VERIFIED_CREDIT_COST)
  }

  return NextResponse.json({
    ok: true,
    verified,
    answer,
    source,
    creditsCharged: VERIFIED_CREDIT_COST,
    paidCreditsRemaining: remaining,
  })
}
