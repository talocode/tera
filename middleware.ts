import { NextRequest, NextResponse } from 'next/server'
import { getAgentReadablePage } from '@/lib/agent-readable-content'

export function middleware(request: NextRequest) {
  if (request.method !== 'GET') return NextResponse.next()

  const requestedMarkdown = request.nextUrl.searchParams.get('format') === 'markdown'
    || request.headers.get('accept')?.includes('text/markdown')
  const page = getAgentReadablePage(request.nextUrl.pathname)
  const isDiscoveryRequest = request.nextUrl.pathname === '/llms.txt' || request.nextUrl.pathname === '/llms-full.txt'

  if (isDiscoveryRequest) {
    console.info(JSON.stringify({ event: 'agent_readable_request', path: request.nextUrl.pathname, representation: 'text' }))
  }
  if (!requestedMarkdown || !page) return NextResponse.next()

  console.info(JSON.stringify({ event: 'agent_readable_request', path: page.path, representation: 'markdown' }))
  const url = request.nextUrl.clone()
  url.pathname = '/api/agent-readable'
  url.search = ''
  url.searchParams.set('path', page.path)
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|robots.txt|sitemap.xml).*)'],
}
