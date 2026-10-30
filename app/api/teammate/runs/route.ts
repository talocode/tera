import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isPublicHttps } from '@/lib/verified-call'
import { createTeammateRun } from '@/lib/teammate-run'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const task = typeof body?.task === 'string' ? body.task.trim() : ''
  const rawSource = typeof body?.sourceUrl === 'string' ? body.sourceUrl.trim() : ''
  if (task.length < 8 || task.length > 2000) {
    return NextResponse.json({ ok: false, error: 'Give Tera a job between 8 and 2000 characters.' }, { status: 400 })
  }
  const source = rawSource ? isPublicHttps(rawSource) : null
  if (rawSource && !source) {
    return NextResponse.json({ ok: false, error: 'Send one public https source URL, or leave it empty.' }, { status: 400 })
  }
  const run = await createTeammateRun({ userId: session.user.id, task, source })
  if (!run) {
    return NextResponse.json({ ok: false, error: 'The run did not save.' }, { status: 503 })
  }
  return NextResponse.json(run)
}
