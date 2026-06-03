export type TavilySearchResult = {
  title: string
  url: string
  content?: string | null
  raw_content?: string | null
  score?: number
  published_date?: string | null
}

export type TavilySearchResponse = {
  query: string
  answer?: string | null
  results: TavilySearchResult[]
  response_time?: number
  auto_parameters?: Record<string, unknown>
  usage?: {
    credits: number
  }
}

export type ResearchCitation = {
  title: string
  url: string
  snippet?: string | null
  publishedDate?: string | null
}

export type TavilySearchInput = {
  query: string
  searchDepth?: 'basic' | 'advanced'
  maxResults?: number
  includeAnswer?: boolean
  includeRawContent?: boolean
}

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search'

function getTavilyApiKey() {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is missing in environment variables')
  }
  return apiKey
}

export async function searchTavily(input: TavilySearchInput): Promise<TavilySearchResponse> {
  const response = await fetch(TAVILY_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getTavilyApiKey()}`,
    },
    body: JSON.stringify({
      query: input.query,
      search_depth: input.searchDepth ?? 'advanced',
      max_results: input.maxResults ?? 5,
      include_answer: input.includeAnswer ?? true,
      include_raw_content: input.includeRawContent ?? false,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.message || errorData?.error || `Tavily search failed with status ${response.status}`
    throw new Error(message)
  }

  return (await response.json()) as TavilySearchResponse
}

export function formatTavilyResearchContext(response: TavilySearchResponse): string {
  const lines: string[] = []

  if (response.answer) {
    lines.push(`Tavily answer: ${response.answer.trim()}`)
  }

  if (response.results?.length) {
    lines.push('Top web results:')
    for (const result of response.results.slice(0, 5)) {
      const title = result.title?.trim() || 'Untitled result'
      const url = result.url?.trim()
      const content = result.content?.trim() || result.raw_content?.trim() || ''
      lines.push(`- ${title}${url ? ` (${url})` : ''}${content ? `\n  ${content.slice(0, 300)}` : ''}`)
    }
  }

  return lines.join('\n')
}

export function buildResearchCitations(response: TavilySearchResponse): ResearchCitation[] {
  return (response.results || [])
    .slice(0, 5)
    .map((result) => ({
      title: result.title?.trim() || 'Untitled result',
      url: result.url?.trim() || '',
      snippet: result.content?.trim() || result.raw_content?.trim() || null,
      publishedDate: result.published_date || null,
    }))
    .filter((result) => Boolean(result.url))
}
