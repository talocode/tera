export const TALOCODE_BASE_URL = process.env.TALOCODE_BASE_URL || 'https://api.talocode.site'

const TALOCODE_API_KEY = process.env.TALOCODE_API_KEY || ''

export interface TalocodeChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<Record<string, unknown>>
}

export interface TalocodeChatOptions {
  model?: string
  messages: TalocodeChatMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  response_format?: { type: string }
}

export interface TalocodeChatResult {
  id?: string
  object?: string
  choices: Array<{
    index: number
    message: { role: string; content: string }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  meta?: Record<string, unknown>
}

async function retryFetch(url: string, options: RequestInit, retries = 2, delay = 1200): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url, options)
  } catch (error) {
    if (retries <= 0) throw error
    await new Promise((resolve) => setTimeout(resolve, delay))
    return retryFetch(url, options, retries - 1, delay * 2)
  }

  if ([429, 502, 503, 504].includes(response.status)) {
    if (retries <= 0) {
      throw new Error(`Talocode upstream unavailable: ${response.status}`)
    }
    await new Promise((resolve) => setTimeout(resolve, delay))
    return retryFetch(url, options, retries - 1, delay * 2)
  }

  return response
}

function missingKeyError(): Error & { status?: number } {
  const error: Error & { status?: number } = new Error('TALOCODE_API_KEY is not configured. Tera routes through Talocode Cloud and needs a valid key.')
  error.status = 401
  return error
}

export async function talocodeChatCompletion(opts: TalocodeChatOptions): Promise<TalocodeChatResult> {
  if (!TALOCODE_API_KEY) {
    throw missingKeyError()
  }

  const body: Record<string, unknown> = {
    model: opts.model || 'default',
    messages: opts.messages,
  }
  if (opts.temperature != null) body.temperature = opts.temperature
  if (opts.max_tokens != null) body.max_tokens = opts.max_tokens
  if (opts.top_p != null) body.top_p = opts.top_p
  if (opts.stream != null) body.stream = opts.stream
  if (opts.response_format != null) body.response_format = opts.response_format

  const response = await retryFetch(`${TALOCODE_BASE_URL}/v1/tera/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TALOCODE_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let message = `Talocode API error: ${response.status}`
    try {
      const data = await response.json()
      if (data?.error?.message) message = `${message} (${data.error.message})`
    } catch {
      // ignore parse errors
    }
    const error: Error & { status?: number } = new Error(message)
    error.status = response.status
    throw error
  }

  return response.json()
}

export async function talocodeChatContent(opts: TalocodeChatOptions): Promise<string> {
  const result = await talocodeChatCompletion(opts)
  const content = result.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    return ''
  }
  return content.trim()
}