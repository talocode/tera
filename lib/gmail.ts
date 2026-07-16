import { google } from 'googleapis'
import { supabaseServer } from './supabase-server'

/**
 * Gmail integration — send emails using the user's Gmail account.
 * Uses the same Google OAuth credentials as NextAuth sign-in.
 */

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
]

type GmailTokens = {
  accessToken: string
  refreshToken: string
  expiryDate: number
}

/**
 * Get the OAuth2 client with stored credentials.
 */
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || 'https://teraai.chat'}/api/gmail/callback`
  )
}

/**
 * Generate the Gmail OAuth authorization URL.
 */
export function getGmailAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client()

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
    state: userId,
  })

  return url
}

/**
 * Exchange authorization code for tokens and store them.
 */
export async function exchangeGmailCode(code: string): Promise<{ success: boolean; email?: string }> {
  try {
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return { success: false }
    }

    // Get user email
    oauth2Client.setCredentials(tokens)
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const profile = await gmail.users.getProfile({ userId: 'me' })
    const email = profile.data.emailAddress

    return {
      success: true,
      email: email || undefined,
    }
  } catch (error) {
    console.error('[gmail_code_exchange_failed]', error)
    return { success: false }
  }
}

/**
 * Store Gmail tokens for a user.
 */
export async function storeGmailTokens(userId: string, tokens: GmailTokens, email: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from('users')
      .update({
        google_access_token: tokens.accessToken,
        google_refresh_token: tokens.refreshToken,
        google_token_expiry: new Date(tokens.expiryDate).toISOString(),
        google_email: email,
      })
      .eq('id', userId)

    if (error) {
      console.error('[gmail_token_store_failed]', { userId, error })
      return false
    }

    return true
  } catch (error) {
    console.error('[gmail_token_store_exception]', { userId, error })
    return false
  }
}

/**
 * Get stored Gmail tokens for a user.
 */
export async function getGmailTokens(userId: string): Promise<GmailTokens | null> {
  try {
    const { data, error } = await supabaseServer
      .from('users')
      .select('google_access_token, google_refresh_token, google_token_expiry, google_email')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return null
    if (!data.google_access_token || !data.google_refresh_token) return null

    return {
      accessToken: data.google_access_token,
      refreshToken: data.google_refresh_token,
      expiryDate: data.google_token_expiry ? new Date(data.google_token_expiry).getTime() : 0,
    }
  } catch (error) {
    console.error('[gmail_token_read_failed]', { userId, error })
    return null
  }
}

/**
 * Check if a user has Gmail connected.
 */
export async function isGmailConnected(userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseServer
      .from('users')
      .select('google_refresh_token, google_email')
      .eq('id', userId)
      .maybeSingle()

    return !!(data?.google_refresh_token && data?.google_email)
  } catch {
    return false
  }
}

/**
 * Get an authenticated Gmail client for a user.
 * Refreshes the token if expired.
 */
async function getAuthenticatedGmailClient(userId: string) {
  const tokens = await getGmailTokens(userId)
  if (!tokens) return null

  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
  })

  // Listen for token refresh events
  oauth2Client.on('tokens', async (newTokens) => {
    if (newTokens.access_token && newTokens.expiry_date) {
      await storeGmailTokens(userId, {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiryDate: newTokens.expiry_date,
      }, '')
    }
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

/**
 * Send an email via Gmail.
 */
export async function sendGmailEmail(
  userId: string,
  to: string,
  subject: string,
  body: string,
  options?: {
    cc?: string
    bcc?: string
    replyTo?: string
    isHtml?: boolean
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const gmail = await getAuthenticatedGmailClient(userId)
    if (!gmail) {
      return { success: false, error: 'Gmail not connected' }
    }

    // Build the email message
    const emailParts = [
      `To: ${to}`,
      options?.cc ? `Cc: ${options.cc}` : '',
      options?.bcc ? `Bcc: ${options.bcc}` : '',
      options?.replyTo ? `Reply-To: ${options.replyTo}` : '',
      `Subject: ${subject}`,
      `Content-Type: ${options?.isHtml ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8'}`,
      '',
      body,
    ].filter(Boolean).join('\r\n')

    // Base64url encode the email
    const encodedMessage = Buffer.from(emailParts)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    })

    return {
      success: true,
      messageId: result.data.id || undefined,
    }
  } catch (error: any) {
    console.error('[gmail_send_failed]', { userId, error })
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Get recent emails from Gmail inbox.
 */
export async function getGmailMessages(
  userId: string,
  options?: {
    maxResults?: number
    query?: string
    labelIds?: string[]
  }
): Promise<Array<{
  id: string
  subject: string
  from: string
  date: string
  snippet: string
}>> {
  try {
    const gmail = await getAuthenticatedGmailClient(userId)
    if (!gmail) return []

    const listResult = await gmail.users.messages.list({
      userId: 'me',
      maxResults: options?.maxResults || 10,
      q: options?.query,
      labelIds: options?.labelIds,
    })

    if (!listResult.data.messages) return []

    const messages = await Promise.all(
      listResult.data.messages.map(async (msg) => {
        const full = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date'],
        })

        const headers = full.data.payload?.headers || []
        const subject = headers.find((h) => h.name === 'Subject')?.value || ''
        const from = headers.find((h) => h.name === 'From')?.value || ''
        const date = headers.find((h) => h.name === 'Date')?.value || ''

        return {
          id: msg.id!,
          subject,
          from,
          date,
          snippet: full.data.snippet || '',
        }
      })
    )

    return messages
  } catch (error) {
    console.error('[gmail_read_failed]', { userId, error })
    return []
  }
}

/**
 * Disconnect Gmail for a user (clear tokens).
 */
export async function disconnectGmail(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from('users')
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expiry: null,
        google_email: null,
      })
      .eq('id', userId)

    if (error) {
      console.error('[gmail_disconnect_failed]', { userId, error })
      return false
    }

    return true
  } catch (error) {
    console.error('[gmail_disconnect_exception]', { userId, error })
    return false
  }
}
