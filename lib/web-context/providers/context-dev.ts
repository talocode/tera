import { assertSafePublicUrl } from '@/lib/web-context/url-safety'
import type { WebContextProvider, WebContextRequest, WebContextResult } from '@/lib/web-context/types'
import { WebContextError } from '@/lib/web-context/types'
import { buildWebContextResult, deriveTitle } from '@/lib/web-context/provider-utils'

const DEFAULT_BASE_URL = 'https://api.context.dev/v1'
const DEFAULT_TIMEOUT_MS = 30_000
const SCRAPE_PATH = '/web/scrape/markdown'

type ContextDevScrapeResponse = {
  success?: boolean
  markdown?: string
  url?: string
  title?: string
  message?: string
  error_code?: string
}

function getContextDevApiKey(): string {
  const apiKey = process.env.CONTEXT_DEV_API_KEY?.trim()
  if (!apiKey) {
    throw new WebContextError('CONTEXT_DEV_API_KEY_MISSING', 'CONTEXT_DEV_API_KEY_MISSING')
  }
  return apiKey
}

function getContextDevBaseUrl(): string {
  const configured = process.env.CONTEXT_DEV_BASE_URL?.trim()
  if (!configured) return DEFAULT_BASE_URL
  return configured.replace(/\/$/, '')
}

function trimContent(content: string, maxChars?: number): string {
  if (!maxChars || content.length <= maxChars) return content
  return `${content.slice(0, maxChars).trimEnd()}\n\n[Content truncated]`
}

/**
 * Context.dev markdown scrape adapter.
 * Endpoint: GET /v1/web/scrape/markdown?url=... (1 credit per scrape)
 */
async function requestContextDevMarkdown(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<ContextDevScrapeResponse> {
  const endpoint = new URL(`${getContextDevBaseUrl()}${SCRAPE_PATH}`)
  endpoint.searchParams.set('url', url)
  endpoint.searchParams.set('useMainContentOnly', 'true')
  endpoint.searchParams.set('includeLinks', 'false')
  endpoint.searchParams.set('includeImages', 'false')
  endpoint.searchParams.set('timeoutMS', String(timeoutMs))

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs + 1_000)

  try {
    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getContextDevApiKey()}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    const payload = (await response.json().catch(() => null)) as ContextDevScrapeResponse | null

    if (response.status === 408 || payload?.error_code === 'REQUEST_TIMEOUT') {
      throw new WebContextError('CONTEXT_DEV_TIMEOUT', 'CONTEXT_DEV_TIMEOUT')
    }

    if (!response.ok) {
      throw new WebContextError(
        'CONTEXT_DEV_REQUEST_FAILED',
        payload?.message || `CONTEXT_DEV_REQUEST_FAILED (${response.status})`
      )
    }

    return payload ?? {}
  } catch (error) {
    if (error instanceof WebContextError) throw error

    if (error instanceof Error && error.name === 'AbortError') {
      throw new WebContextError('CONTEXT_DEV_TIMEOUT', 'CONTEXT_DEV_TIMEOUT')
    }

    throw new WebContextError('CONTEXT_DEV_REQUEST_FAILED', 'CONTEXT_DEV_REQUEST_FAILED')
  } finally {
    clearTimeout(timeout)
  }
}

export const contextDevProvider: WebContextProvider = {
  name: 'context-dev',

  async scrapeMarkdown(request: WebContextRequest): Promise<WebContextResult> {
    let safeUrl: URL

    try {
      safeUrl = assertSafePublicUrl(request.url)
    } catch {
      throw new WebContextError('CONTEXT_DEV_INVALID_URL', 'CONTEXT_DEV_INVALID_URL')
    }

    const response = await requestContextDevMarkdown(safeUrl.toString())
    const markdown = response.markdown?.trim() ?? ''

    if (!markdown) {
      throw new WebContextError('CONTEXT_DEV_EMPTY_CONTENT', 'CONTEXT_DEV_EMPTY_CONTENT')
    }

    const resolvedUrl = response.url?.trim() || safeUrl.toString()
    const content = trimContent(markdown, request.maxChars)
    const title = deriveTitle(content, resolvedUrl, response.title?.trim() || undefined)

    return buildWebContextResult({
      provider: 'context-dev',
      url: resolvedUrl,
      title,
      content,
      fetchedAt: new Date().toISOString(),
      creditsEstimated: 1,
    })
  },
}
