import { NextResponse } from 'next/server'
import { TERA_AGENT } from '@/lib/teammate-run'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    teammate: TERA_AGENT,
    loop: ['create a run', 'pause for approval', 'run one tool', 'return a receipt'],
    tool: 'A public https source. One paid credit only if that source loads and the answer is taken from it.',
    create: 'POST /api/teammate/runs',
    approve: 'POST /api/teammate/runs/{id}/approve',
    receipt: 'GET /api/teammate/runs/{id}',
  })
}
