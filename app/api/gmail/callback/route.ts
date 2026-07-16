import { NextRequest, NextResponse } from 'next/server'
import { exchangeGmailCode, storeGmailTokens } from '@/lib/gmail'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state') // userId
    const error = req.nextUrl.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings/usage?gmail=error&message=${encodeURIComponent(error)}`, req.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/usage?gmail=error&message=Missing+authorization+code', req.url)
      )
    }

    const result = await exchangeGmailCode(code)

    if (!result.success || !result.email) {
      return NextResponse.redirect(
        new URL('/settings/usage?gmail=error&message=Failed+to+exchange+code', req.url)
      )
    }

    // Store the tokens
    const oauth2Client = new (await import('googleapis')).google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://teraai.chat'}/api/gmail/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    await storeGmailTokens(state, {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date || Date.now() + 3600000,
    }, result.email)

    return NextResponse.redirect(
      new URL('/settings/usage?gmail=connected', req.url)
    )
  } catch (error) {
    console.error('[gmail_callback_error]', error)
    return NextResponse.redirect(
      new URL('/settings/usage?gmail=error&message=Callback+failed', req.url)
    )
  }
}
