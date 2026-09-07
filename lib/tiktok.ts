import { resolveAppOrigin } from '@/lib/url'

const authorizationUrl = 'https://www.tiktok.com/v2/auth/authorize/'
const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/'
const scopes = ['user.info.basic', 'user.info.profile', 'user.info.stats', 'video.list', 'video.upload', 'video.publish']

export function getTikTokRedirectUri(origin?: string) {
  return process.env.TIKTOK_REDIRECT_URI || `${resolveAppOrigin(origin)}/api/tiktok/callback`
}

export function getTikTokAuthorizationUrl(state: string, origin?: string) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  if (!clientKey) throw new Error('TikTok client key is not configured')
  const query = new URLSearchParams({ client_key: clientKey, response_type: 'code', scope: scopes.join(','), redirect_uri: getTikTokRedirectUri(origin), state })
  return `${authorizationUrl}?${query}`
}

export async function exchangeTikTokCode(code: string, origin?: string) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) throw new Error('TikTok credentials are not configured')
  const body = new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: getTikTokRedirectUri(origin) })
  const response = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const data = await response.json() as Record<string, unknown>
  if (!response.ok || typeof data.access_token !== 'string' || typeof data.open_id !== 'string') throw new Error(typeof data.error_description === 'string' ? data.error_description : 'TikTok token exchange failed')
  return data as { access_token: string; refresh_token?: string; open_id: string; expires_in?: number; refresh_expires_in?: number; scope?: string }
}

export async function tiktokRequest<T>(accessToken: string, path: string, options: RequestInit = {}) {
  const response = await fetch(`https://open.tiktokapis.com${path}`, { ...options, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...options.headers } })
  const data = await response.json() as T & { error?: { message?: string } }
  if (!response.ok) throw new Error(data.error?.message || 'TikTok API request failed')
  return data
}
