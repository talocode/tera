import { NextResponse } from 'next/server'
import { authorizationUrl, codeVerifier } from '@/lib/connectors/mcp'

const SERVERS: Record<string, string> = {
  github: 'https://api.githubcopilot.com/mcp/',
  x: 'https://api.x.com/mcp',
  xai: 'https://api.x.ai/mcp',
  google: 'https://mcp.google.com',
}

export async function GET(request: Request) {
  const incoming = new URL(request.url)
  const platform = incoming.searchParams.get('platform') || ''
  const mcp = incoming.searchParams.get('mcp') || SERVERS[platform]
  if (!mcp) return NextResponse.json({ error: 'That platform has no MCP server configured.' }, { status: 400 })
  const verifier = codeVerifier()
  const redirectUri = new URL('/api/connectors/callback', request.url).toString()
  const state = `${platform}:${Date.now()}`
  const started = await authorizationUrl(mcp, redirectUri, state, verifier)
  const response = NextResponse.redirect(started.url)
  response.cookies.set('tera_mcp', JSON.stringify({ platform, mcp, verifier, state, tokenEndpoint: started.tokenEndpoint }), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })
  return response
}
