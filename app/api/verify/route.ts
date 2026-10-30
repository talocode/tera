import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPaidCreditsRemaining, spendPaidCredits, addPurchasedCredits } from '@/lib/free-plan-credits'
import {
  VERIFIED_CREDIT_COST,
  VERIFIED_LIMIT_PER_MINUTE,
  answerFromSource,
  fetchPublicSource,
  isPublicHttps,
  saveVerifiedReceipt,
  verifiedCallsInLastMinute,
} from '@/lib/verified-call'

export const runtime = 'nodejs'
export const maxDuration = 60

function limitHeaders(remaining: number | null, retryAfter?: number) {
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', String(VERIFIED_LIMIT_PER_MINUTE))
  if (remaining != null) headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)))
  if (retryAfter) headers.set('Retry-After', String(retryAfter))
  return headers
}

export async function GET() {
  return NextResponse.json({
    job: 'verified-call',
    method: 'POST',
    body: { question: 'string', sourceUrl: 'https URL' },
    credit: VERIFIED_CREDIT_COST,
    paidOnly: true,
    charge: 'one paid credit only if the source loads and the answer is taken from it',
    receipt: '/api/verify/{id}',
    limit: { perMinute: VERIFIED_LIMIT_PER_MINUTE },
  }, { headers: limitHeaders(null) })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: limitHeaders(null) })
  }

  const used = await verifiedCallsInLastMinute(session.user.id)
  if (used == null) {
    return NextResponse.json({ ok: false, error: 'Tera could not read the call limit.' }, { status: 503, headers: limitHeaders(null) })
  }
  if (used >= VERIFIED_LIMIT_PER_MINUTE) {
    return NextResponse.json({
      ok: false,
      error: 'Rate limit exceeded',
      limit: { perMinute: VERIFIED_LIMIT_PER_MINUTE },
    }, { status: 429, headers: limitHeaders(0, 60) })
  }
  const remainingBefore = VERIFIED_LIMIT_PER_MINUTE - used

  const body = await request.json().catch(() => null)
  const question = typeof body?.question === 'string'
    ? body.question.trim()
    : typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  const sourceUrl = typeof body?.sourceUrl === 'string' ? body.sourceUrl.trim() : ''
  if (question.length < 8 || question.length > 2000) {
    return NextResponse.json({ ok: false, error: 'Ask a question between 8 and 2000 characters.' }, { status: 400, headers: limitHeaders(remainingBefore) })
  }
  const source = isPublicHttps(sourceUrl)
  if (!source) {
    return NextResponse.json({ ok: false, error: 'Send one public https source URL.' }, { status: 400, headers: limitHeaders(remainingBefore) })
  }

  let paidCredits = 0
  try {
    paidCredits = await getPaidCreditsRemaining(session.user.id)
  } catch {
    return NextResponse.json({ ok: false, error: 'Tera could not read your paid credit balance.' }, { status: 503, headers: limitHeaders(remainingBefore) })
  }
  if (paidCredits < VERIFIED_CREDIT_COST) {
    return NextResponse.json({
      ok: false,
      error: 'This call runs only on credits you bought. A hold does not run it. The minimum top-up is $5.',
      code: 'paid_topup_required',
      paidCredits,
      pricingPath: '/pricing',
    }, { status: 402, headers: limitHeaders(remainingBefore) })
  }

  const fetched = await fetchPublicSource(source)
  const answer = fetched.text ? answerFromSource(fetched.text, question) : null
  const loaded = Boolean(fetched.loaded && answer)

  if (!loaded) {
    const id = await saveVerifiedReceipt({
      userId: session.user.id,
      question,
      source,
      finalUrl: fetched.finalUrl,
      loaded: false,
      answer: null,
      creditsCharged: 0,
    })
    if (!id) {
      return NextResponse.json({ ok: false, error: 'The source did not load, and the receipt did not save. You were not charged.' }, { status: 503, headers: limitHeaders(remainingBefore) })
    }
    return NextResponse.json({
      ok: true,
      id,
      question,
      source,
      loaded: false,
      answer: null,
      creditsCharged: 0,
      paidCreditsRemaining: paidCredits,
      limit: { perMinute: VERIFIED_LIMIT_PER_MINUTE },
    }, { headers: limitHeaders(Math.max(0, remainingBefore - 1)) })
  }

  const spent = await spendPaidCredits(session.user.id, VERIFIED_CREDIT_COST)
  if (!spent) {
    return NextResponse.json({
      ok: false,
      error: 'This call runs only on credits you bought. A hold does not run it. The minimum top-up is $5.',
      code: 'paid_topup_required',
      paidCredits,
      pricingPath: '/pricing',
    }, { status: 402, headers: limitHeaders(remainingBefore) })
  }

  const id = await saveVerifiedReceipt({
    userId: session.user.id,
    question,
    source,
    finalUrl: fetched.finalUrl,
    loaded: true,
    answer,
    creditsCharged: VERIFIED_CREDIT_COST,
  })
  if (!id) {
    await addPurchasedCredits(session.user.id, VERIFIED_CREDIT_COST)
    return NextResponse.json({ ok: false, error: 'The source loaded, but the receipt did not save. You were not charged.' }, { status: 503, headers: limitHeaders(remainingBefore) })
  }

  return NextResponse.json({
    ok: true,
    id,
    question,
    source,
    loaded: true,
    answer,
    creditsCharged: VERIFIED_CREDIT_COST,
    paidCreditsRemaining: paidCredits - VERIFIED_CREDIT_COST,
    limit: { perMinute: VERIFIED_LIMIT_PER_MINUTE },
  }, { headers: limitHeaders(Math.max(0, remainingBefore - 1)) })
}
