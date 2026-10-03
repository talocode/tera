import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const clientId = process.env.X_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({
      error: 'X OAuth is not configured on this site.',
      next: 'Set X_CLIENT_ID and X_CLIENT_SECRET. Linking an X account does not bill X Premium for Tera API calls.',
    }, { status: 503 })
  }
  const redirectUri = new URL('/api/connectors/x/callback', request.url).toString()
  const auth = new URL('https://twitter.com/i/oauth2/authorize')
  auth.searchParams.set('response_type', 'code')
  auth.searchParams.set('client_id', clientId)
  auth.searchParams.set('redirect_uri', redirectUri)
  auth.searchParams.set('scope', 'tweet.read users.read offline.access')
  auth.searchParams.set('state', 'tera')
  auth.searchParams.set('code_challenge', 'tera-connectors')
  auth.searchParams.set('code_challenge_method', 'plain')
  return NextResponse.redirect(auth)
}
