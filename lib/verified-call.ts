import { supabaseServer } from './supabase-server'

export const VERIFIED_CREDIT_COST = 1
export const VERIFIED_LIMIT_PER_MINUTE = 10

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal)$/i
const PRIVATE_IP = /^(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|172\.(1[6-9]|2\d|3[0-1])\.)/

export type VerifiedReceipt = {
  ok: true
  id: string
  question: string
  source: string
  loaded: boolean
  answer: string | null
  creditsCharged: number
  createdAt: string
  limit: { perMinute: number }
}

export function isPublicHttps(raw: string): string | null {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
    if (PRIVATE_HOST.test(host) || PRIVATE_IP.test(host)) return null
    if (host === '::1' || host === '0:0:0:0:0:0:0:1') return null
    return url.toString()
  } catch {
    return null
  }
}

export function answerFromSource(html: string, question: string): string | null {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&/gi, '&')
    .replace(/</gi, '<')
    .replace(/>/gi, '>')
    .replace(/&#39;|'/gi, "'")
    .replace(/"/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length < 40) return null

  const tokens = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 5)
  const haystack = text.toLowerCase()
  let at = -1
  for (const token of tokens) {
    const found = haystack.indexOf(token)
    if (found >= 0) {
      at = found
      break
    }
  }
  const start = at < 0 ? 0 : Math.max(0, at - 180)
  const excerpt = text.slice(start, start + 700).trim()
  return excerpt.length >= 40 ? excerpt : null
}

export async function fetchPublicSource(raw: string): Promise<{ loaded: boolean; finalUrl: string; text: string | null }> {
  let current = isPublicHttps(raw)
  if (!current) return { loaded: false, finalUrl: raw, text: null }

  for (let hop = 0; hop < 3; hop += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const response = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'TeraVerifiedCall/1.0',
          Accept: 'text/html,text/plain,application/json,application/xml',
        },
      })
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        const next = location ? isPublicHttps(new URL(location, current).toString()) : null
        if (!next) return { loaded: false, finalUrl: current, text: null }
        current = next
        continue
      }
      if (!response.ok) return { loaded: false, finalUrl: current, text: null }
      const type = (response.headers.get('content-type') || '').toLowerCase()
      if (type && !/(text\/|json|xml|javascript)/.test(type)) {
        return { loaded: false, finalUrl: current, text: null }
      }
      const bytes = await readLimited(response, 180_000)
      if (bytes.includes(0)) return { loaded: false, finalUrl: current, text: null }
      return { loaded: true, finalUrl: current, text: new TextDecoder().decode(bytes) }
    } catch {
      return { loaded: false, finalUrl: current, text: null }
    } finally {
      clearTimeout(timer)
    }
  }
  return { loaded: false, finalUrl: current, text: null }
}

async function readLimited(response: Response, max: number): Promise<Uint8Array> {
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let total = 0
  while (total < max) {
    const { done, value } = await reader.read()
    if (done || !value) break
    const slice = value.byteLength + total > max ? value.slice(0, max - total) : value
    chunks.push(slice)
    total += slice.byteLength
    if (value.byteLength + (total - slice.byteLength) >= max) break
  }
  try { await reader.cancel() } catch { /* already closed */ }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

export async function verifiedCallsInLastMinute(userId: string): Promise<number | null> {
  const since = new Date(Date.now() - 60_000).toISOString()
  const { count, error } = await supabaseServer
    .from('usage_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tool', 'verified-call')
    .gte('created_at', since)
  if (error) {
    console.error('[verified_rate_read_failed]', { userId, error })
    return null
  }
  return count || 0
}

export async function saveVerifiedReceipt(input: {
  userId: string
  question: string
  source: string
  finalUrl: string
  loaded: boolean
  answer: string | null
  creditsCharged: number
}): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from('usage_ledger')
    .insert({
      user_id: input.userId,
      event_type: 'chat_generation',
      status: input.loaded && input.answer ? 'succeeded' : 'failed',
      plan: 'free',
      tool: 'verified-call',
      credits_charged: input.creditsCharged,
      metadata: {
        kind: 'verified_call',
        question: input.question,
        source: input.source,
        finalUrl: input.finalUrl,
        loaded: input.loaded && Boolean(input.answer),
        answer: input.answer,
      },
    })
    .select('id')
    .single()
  if (error || !data?.id) {
    console.error('[verified_receipt_save_failed]', { userId: input.userId, error })
    return null
  }
  return data.id as string
}

export async function readVerifiedReceipt(id: string, userId: string): Promise<VerifiedReceipt | null> {
  const { data, error } = await supabaseServer
    .from('usage_ledger')
    .select('id, user_id, credits_charged, metadata, created_at, tool')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  if (data.user_id !== userId || data.tool !== 'verified-call') return null
  const metadata = (data.metadata || {}) as Record<string, unknown>
  if (metadata.kind !== 'verified_call') return null
  return {
    ok: true,
    id: data.id as string,
    question: typeof metadata.question === 'string' ? metadata.question : '',
    source: typeof metadata.source === 'string' ? metadata.source : '',
    loaded: metadata.loaded === true,
    answer: typeof metadata.answer === 'string' ? metadata.answer : null,
    creditsCharged: Math.max(0, Number(data.credits_charged || 0)),
    createdAt: data.created_at as string,
    limit: { perMinute: VERIFIED_LIMIT_PER_MINUTE },
  }
}
