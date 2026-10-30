import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { readTeammateRun } from '@/lib/teammate-run'

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
  const run = await readTeammateRun(id, session.user.id)
  if (!run) return NextResponse.json({ ok: false, error: 'Receipt not found.' }, { status: 404 })
  return NextResponse.json(run)
}
