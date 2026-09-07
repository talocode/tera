import { NextRequest } from 'next/server'
import { getAgentReadablePage } from '@/lib/agent-readable-content'

export function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') || '/'
  const page = getAgentReadablePage(path)
  if (!page) return new Response('No markdown representation is available for this route.\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  return new Response(page.markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept',
      'X-Canonical-URL': new URL(path, request.url).toString(),
    },
  })
}
