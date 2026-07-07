import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = process.hrtime.bigint()

  const info = {
    status: 'ok',
    service: 'tera-api',
    version: '0.1.0',
    endpoints: [
      '/v1/writing/rewrite',
      '/v1/writing/draft',
      '/v1/coding/explain',
      '/v1/coding/review',
      '/v1/health',
      '/v1/capabilities',
      '/v1/pricing',
      '/v1/chat/completions',
      '/v1/tera/chat/completions',
    ],
    timestamp: new Date().toISOString(),
  }

  const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000

  return NextResponse.json(info, {
    status: 200,
    headers: {
      'x-tera-response-time': `${elapsed.toFixed(2)}ms`,
    },
  })
}
