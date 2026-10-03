import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const incoming = new URL(request.url)
  const code = incoming.searchParams.get('code')
  const state = incoming.searchParams.get('state')
  const cookie = request.headers.get('cookie') || ''
  const raw = cookie.split('; ').find((part) => part.startsWith('tera_mcp='))?.slice('tera_mcp='.length)
  if (!code || !raw) return NextResponse.redirect(new URL('/connectors?error=consent', request.url))
  const pending = JSON.parse(decodeURIComponent(raw))
  if (pending.state !== state) return NextResponse.redirect(new URL('/connectors?error=state', request.url))
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: new URL('/api/connectors/callback', request.url).toString(),
    code_verifier: pending.verifier,
    client_id: process.env.TERA_MCP_CLIENT_ID || 'teraai.chat',
  })
  const token = await fetch(pending.tokenEndpoint, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body }).then((response) => response.json()).catch(() => null)
  if (!token?.access_token) return NextResponse.redirect(new URL('/connectors?error=token', request.url))
  const response = NextResponse.redirect(new URL(`/connectors?connected=${pending.platform}`, request.url))
  response.cookies.set(`tera_mcp_${pending.platform}`, token.access_token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  response.cookies.set('tera_mcp', '', { path: '/', maxAge: 0 })
  return response
}
