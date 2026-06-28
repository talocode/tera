import type { ProviderFallbackResult, ProviderName } from './types'
import { redactSecrets } from './extract'
import { normalizeText, truncateContent } from './clean'

type ProviderFn = (url: string) => Promise<ProviderFallbackResult>

const PROVIDER_TIMEOUT = 15_000

function timeoutSignal(ms: number): AbortSignal {
  return AbortSignal.timeout(ms)
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  return fetch(url, { signal: timeoutSignal(ms) })
}

const domProvider: ProviderFn = async (url: string) => {
  const warnings: string[] = []

  if (typeof document === 'undefined') {
    return { provider: 'dom', text: '', headings: [], links: [], warnings: ['DOM provider not available outside browser'] }
  }

  const doc = document
  const headings: string[] = []
  for (const tag of ['h1', 'h2', 'h3']) {
    const els = doc.querySelectorAll(tag)
    for (const el of els) {
      const text = (el as HTMLElement).textContent?.trim()
      if (text && text.length > 0 && text.length < 200) headings.push(text)
    }
  }

  const links: Array<{ text: string; href: string }> = []
  const seen = new Set<string>()
  const anchors = doc.querySelectorAll('a[href]')
  for (const a of anchors) {
    const href = (a as HTMLAnchorElement).href?.trim()
    const text = (a as HTMLElement).textContent?.trim()
    if (href && text && !seen.has(href) && !href.startsWith('javascript:') && !href.startsWith('file:')) {
      seen.add(href)
      links.push({ text: text.substring(0, 200), href })
    }
  }

  const article = doc.querySelector('article') || doc.querySelector('[role="main"]') || doc.querySelector('main')
  let text = article ? (article.textContent || '').trim() : (doc.body?.textContent || '').trim()

  if (!text) {
    warnings.push('No text content extracted via DOM provider')
  }

  return {
    provider: 'dom',
    text: redactSecrets(truncateContent(text, 50000)),
    title: doc.title || undefined,
    description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || undefined,
    headings,
    links: links.slice(0, 200),
    warnings,
  }
}

const jinaReaderProvider: ProviderFn = async (url: string) => {
  const warnings: string[] = []

  try {
    const jinaUrl = `https://r.jina.ai/${url}`
    const res = await fetchWithTimeout(jinaUrl, PROVIDER_TIMEOUT)

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      warnings.push(`Jina Reader returned ${res.status}: ${body.substring(0, 100)}`)
      return { provider: 'jina-reader', text: '', headings: [], links: [], warnings }
    }

    const text = await res.text()
    if (!text || text.trim().length < 50) {
      warnings.push('Jina Reader returned insufficient content')
      return { provider: 'jina-reader', text: '', headings: [], links: [], warnings }
    }

    return { provider: 'jina-reader', text: redactSecrets(truncateContent(text, 50000)), headings: [], links: [], warnings }
  } catch (err) {
    warnings.push(`Jina Reader error: ${err instanceof Error ? err.message : String(err)}`)
    return { provider: 'jina-reader', text: '', headings: [], links: [], warnings }
  }
}

const firecrawlProvider: ProviderFn = async (url: string) => {
  const warnings: string[] = []
  const apiKey = (typeof process !== 'undefined' && (process as any).env?.FIRECRAWL_API_KEY) || ''

  if (!apiKey) {
    warnings.push('Firecrawl API key not configured')
    return { provider: 'firecrawl', text: '', headings: [], links: [], warnings }
  }

  try {
    const res = await fetchWithTimeout('https://api.firecrawl.dev/v2/scrape', PROVIDER_TIMEOUT)

    if (!res.ok) {
      warnings.push(`Firecrawl returned ${res.status}`)
      return { provider: 'firecrawl', text: '', headings: [], links: [], warnings }
    }

    const data = await res.json().catch(() => ({}))
    const markdown = data?.data?.markdown || data?.markdown || ''

    if (!markdown || markdown.trim().length < 50) {
      warnings.push('Firecrawl returned insufficient content')
      return { provider: 'firecrawl', text: '', headings: [], links: [], warnings }
    }

    return {
      provider: 'firecrawl',
      text: redactSecrets(truncateContent(markdown, 50000)),
      title: data?.data?.metadata?.title || data?.title || undefined,
      description: data?.data?.summary || undefined,
      headings: [],
      links: [],
      warnings,
    }
  } catch (err) {
    warnings.push(`Firecrawl error: ${err instanceof Error ? err.message : String(err)}`)
    return { provider: 'firecrawl', text: '', headings: [], links: [], warnings }
  }
}

const fetchReadabilityProvider: ProviderFn = async (url: string) => {
  const warnings: string[] = []

  try {
    const res = await fetchWithTimeout(url, PROVIDER_TIMEOUT)

    if (!res.ok) {
      warnings.push(`Fetch returned ${res.status}`)
      return { provider: 'fetch-readability', text: '', headings: [], links: [], warnings }
    }

    const html = await res.text()
    if (!html || html.trim().length < 100) {
      warnings.push('Fetched page has insufficient content')
      return { provider: 'fetch-readability', text: '', headings: [], links: [], warnings }
    }

    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text || text.length < 50) {
      warnings.push('Stripped text content is too short')
      return { provider: 'fetch-readability', text: '', headings: [], links: [], warnings }
    }

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : undefined

    return {
      provider: 'fetch-readability',
      text: redactSecrets(truncateContent(text, 50000)),
      title,
      headings: [],
      links: [],
      warnings,
    }
  } catch (err) {
    warnings.push(`Fetch/Readability error: ${err instanceof Error ? err.message : String(err)}`)
    return { provider: 'fetch-readability', text: '', headings: [], links: [], warnings }
  }
}

const PROVIDERS_IN_ORDER: Array<{ name: ProviderName; fn: ProviderFn }> = [
  { name: 'dom', fn: domProvider },
  { name: 'jina-reader', fn: jinaReaderProvider },
  { name: 'firecrawl', fn: firecrawlProvider },
  { name: 'fetch-readability', fn: fetchReadabilityProvider },
]

export async function captureViaFallback(url: string, preferredProvider?: ProviderName): Promise<ProviderFallbackResult> {
  const providers = preferredProvider
    ? PROVIDERS_IN_ORDER.filter((p) => p.name === preferredProvider).concat(PROVIDERS_IN_ORDER.filter((p) => p.name !== preferredProvider))
    : PROVIDERS_IN_ORDER

  const allWarnings: string[] = []

  for (const { name, fn } of providers) {
    try {
      const result = await fn(url)
      if (result.text && result.text.trim().length >= 50) {
        return result
      }
      allWarnings.push(...result.warnings.map((w) => `[${name}] ${w}`))
    } catch (err) {
      allWarnings.push(`[${name}] Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return {
    provider: 'dom',
    text: '',
    headings: [],
    links: [],
    warnings: allWarnings.length > 0 ? allWarnings : ['All providers failed to extract content'],
  }
}

export { PROVIDERS_IN_ORDER }
