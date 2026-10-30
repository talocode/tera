import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { VERIFIED_LIMIT_PER_MINUTE, readVerifiedReceipt } from '@/lib/verified-call'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: 'Receipt not found.' }, { status: 404 })
  }
  const receipt = await readVerifiedReceipt(id, session.user.id)
  if (!receipt) {
    return NextResponse.json({ ok: false, error: 'Receipt not found.' }, { status: 404 })
  }
  return NextResponse.json(receipt, {
    headers: { 'X-RateLimit-Limit': String(VERIFIED_LIMIT_PER_MINUTE) },
  })
}
