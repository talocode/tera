import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addPurchasedCredits, getPaidCreditsRemaining, spendPaidCredits } from '@/lib/free-plan-credits'
import { VERIFIED_CREDIT_COST } from '@/lib/verified-call'
import { finishApprovedRun, readTeammateRun, updateTeammateRun } from '@/lib/teammate-run'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: 'Receipt not found.' }, { status: 404 })
  }
  const current = await readTeammateRun(id, session.user.id)
  if (!current) return NextResponse.json({ ok: false, error: 'Receipt not found.' }, { status: 404 })
  if (current.state !== 'pending_approval') {
    return NextResponse.json({ ok: false, error: 'This run is no longer waiting for approval.', receipt: current }, { status: 409 })
  }

  const body = await request.json().catch(() => null)
  const approved = body?.approved === true
  if (!approved) {
    const rejected = await updateTeammateRun({
      id,
      userId: session.user.id,
      state: 'rejected',
      loaded: false,
      answer: 'You rejected this run. Nothing ran. You were not charged.',
      creditsCharged: 0,
      chargedKind: 'teammate_run',
    })
    if (!rejected) return NextResponse.json({ ok: false, error: 'The rejection did not save.' }, { status: 503 })
    return NextResponse.json(rejected)
  }

  if (current.source) {
    let paid = 0
    try {
      paid = await getPaidCreditsRemaining(session.user.id)
    } catch {
      return NextResponse.json({ ok: false, error: 'Tera could not read your paid credit balance.' }, { status: 503 })
    }
    if (paid < VERIFIED_CREDIT_COST) {
      return NextResponse.json({
        ok: false,
        error: 'This job runs only on credits you bought. A hold does not run it. The minimum top-up is $5.',
        code: 'paid_topup_required',
        paidCredits: paid,
        pricingPath: '/pricing',
      }, { status: 402 })
    }
  }

  const finished = await finishApprovedRun(current.source, current.task)
  if (!finished.loaded) {
    const missed = await updateTeammateRun({
      id,
      userId: session.user.id,
      state: 'completed',
      loaded: false,
      answer: finished.answer,
      creditsCharged: 0,
      chargedKind: 'teammate_run',
    })
    if (!missed) return NextResponse.json({ ok: false, error: 'The receipt did not save. You were not charged.' }, { status: 503 })
    return NextResponse.json(missed)
  }

  const spent = await spendPaidCredits(session.user.id, VERIFIED_CREDIT_COST)
  if (!spent) {
    return NextResponse.json({
      ok: false,
      error: 'This job runs only on credits you bought. A hold does not run it. The minimum top-up is $5.',
      code: 'paid_topup_required',
      pricingPath: '/pricing',
    }, { status: 402 })
  }
  const done = await updateTeammateRun({
    id,
    userId: session.user.id,
    state: 'completed',
    loaded: true,
    answer: finished.answer,
    creditsCharged: VERIFIED_CREDIT_COST,
    chargedKind: 'verified_call',
  })
  if (!done) {
    await addPurchasedCredits(session.user.id, VERIFIED_CREDIT_COST)
    return NextResponse.json({ ok: false, error: 'The job finished, but the receipt did not save. You were not charged.' }, { status: 503 })
  }
  return NextResponse.json(done)
}
