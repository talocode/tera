import type { ResearchCitation } from './tavily'

const CONTEXT_DEV_API_URL = 'https://api.context.dev/v1'

function getContextDevApiKey(): string {
  const apiKey = process.env.CONTEXT_DEV_API_KEY
  if (!apiKey) {
    throw new Error('CONTEXT_DEV_API_KEY is missing in environment variables')
  }
  return apiKey
}

export type ContextDevSearchResult = {
  url: string
  title: string
  description: string
  relevance: 'high' | 'medium' | 'low'
  markdown?: {
    markdown: string | null
    code: 'SUCCESS' | 'NOT_REQUESTED' | 'TIMEOUT' | 'WEBSITE_ACCESS_ERROR' | 'ERROR'
  }
}

export type ContextDevSearchResponse = {
  results: ContextDevSearchResult[]
  query: string
  key_metadata?: {
    credits_consumed: number
    credits_remaining: number
  }
}

export type ContextDevSearchInput = {
  query: string
  maxResults?: number
  scrapeToMarkdown?: boolean
  freshness?: 'last_24_hours' | 'last_week' | 'last_month' | 'last_year'
  includeDomains?: string[]
  excludeDomains?: string[]
}

export async function searchContextDev(input: ContextDevSearchInput): Promise<ContextDevSearchResponse> {
  const apiKey = getContextDevApiKey()

  const body: Record<string, any> = {
    query: input.query,
  }

  if (input.freshness) {
    body.freshness = input.freshness
  }

  if (input.includeDomains?.length) {
    body.includeDomains = input.includeDomains
  }

  if (input.excludeDomains?.length) {
    body.excludeDomains = input.excludeDomains
  }

  if (input.scrapeToMarkdown) {
    body.markdownOptions = {
      enabled: true,
      useMainContentOnly: true,
      includeLinks: true,
      includeImages: false,
      maxAgeMs: 3600000,
    }
  }

  const response = await fetch(`${CONTEXT_DEV_API_URL}/web/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.message || errorData?.error || `Context.dev search failed with status ${response.status}`
    throw new Error(message)
  }

  return (await response.json()) as ContextDevSearchResponse
}

export type ContextDevScrapeResponse = {
  success: boolean
  markdown: string
  url: string
  key_metadata?: {
    credits_consumed: number
    credits_remaining: number
  }
}

export async function scrapeUrl(url: string, options?: {
  useMainContentOnly?: boolean
  maxAgeMs?: number
}): Promise<ContextDevScrapeResponse> {
  const apiKey = getContextDevApiKey()

  const params = new URLSearchParams({ url })
  if (options?.useMainContentOnly) params.set('useMainContentOnly', 'true')
  if (options?.maxAgeMs !== undefined) params.set('maxAgeMs', String(options.maxAgeMs))

  const response = await fetch(`${CONTEXT_DEV_API_URL}/web/scrape/markdown?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.message || `Context.dev scrape failed with status ${response.status}`
    throw new Error(message)
  }

  return (await response.json()) as ContextDevScrapeResponse
}

export function formatContextDevSearchContext(response: ContextDevSearchResponse): string {
  const lines: string[] = []

  if (response.results?.length) {
    lines.push('Web search results (via Context.dev):')
    for (const result of response.results.slice(0, 5)) {
      const title = result.title?.trim() || 'Untitled result'
      const url = result.url?.trim()
      const description = result.description?.trim() || ''
      const markdown = result.markdown?.markdown?.trim() || ''
      const content = markdown || description

      lines.push(`- ${title}${url ? ` (${url})` : ''}`)
      if (content) {
        lines.push(`  ${content.slice(0, 500)}`)
      }
    }
  }

  return lines.join('\n')
}

export function buildContextDevCitations(response: ContextDevSearchResponse): ResearchCitation[] {
  return (response.results || [])
    .slice(0, 5)
    .map((result) => ({
      title: result.title?.trim() || 'Untitled result',
      url: result.url?.trim() || '',
      snippet: result.description?.trim() || result.markdown?.markdown?.trim()?.slice(0, 300) || null,
      publishedDate: null,
    }))
    .filter((result) => Boolean(result.url))
}
