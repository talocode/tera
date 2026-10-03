import { createHash, randomBytes } from 'node:crypto'

export function codeVerifier() {
  return randomBytes(32).toString('base64url')
}

export function codeChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url')
}

export async function authorizationUrl(mcpUrl: string, redirectUri: string, state: string, verifier: string) {
  const challenge = codeChallenge(verifier)
  const resource = new URL(mcpUrl)
  const metadataUrl = new URL('/.well-known/oauth-authorization-server', resource.origin)
  const metadata = await fetch(metadataUrl).then((response) => response.ok ? response.json() : null).catch(() => null)
  const authorize = metadata?.authorization_endpoint || new URL('/authorize', resource.origin).toString()
  const url = new URL(authorize)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', process.env.TERA_MCP_CLIENT_ID || 'teraai.chat')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', state)
  url.searchParams.set('resource', mcpUrl)
  return { url: url.toString(), tokenEndpoint: metadata?.token_endpoint || new URL('/token', resource.origin).toString() }
}
