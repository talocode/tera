import { NextRequest, NextResponse } from 'next/server'
import { saveGoogleTokens } from '@/lib/google-sheets'
import { resolveAppOrigin } from '@/lib/url'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(new URL('/?sheets_auth=error', request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/?sheets_auth=missing_params', request.url))
    }

    const appOrigin = resolveAppOrigin(request.nextUrl.origin)

    const { google } = await import('googleapis')
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${appOrigin}/api/auth/google/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      console.error('No access token received from Google')
      return NextResponse.redirect(new URL('/?sheets_auth=no_token', request.url))
    }

    await saveGoogleTokens(state, tokens.access_token, tokens.refresh_token || '')

    return NextResponse.redirect(new URL('/?sheets_auth=success', request.url))
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?sheets_auth=error', request.url))
  }
}
