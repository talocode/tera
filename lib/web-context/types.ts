export type WebContextProviderName = 'firecrawl' | 'tavily' | 'serpapi' | 'browser' | 'manual' | 'context-dev'

export type WebContextRequest = {
  url: string
  userId?: string
  mode?: 'url' | 'research'
  maxChars?: number
}

export type WebContextSource = {
  url: string
  title?: string
  content: string
  provider: WebContextProviderName
  fetchedAt: string
}

export type WebContextResult = {
  url?: string
  title?: string
  markdown?: string
  text?: string
  summary?: string
  citations?: Array<{
    title?: string
    url: string
    snippet?: string
  }>
  provider: WebContextProviderName
  fetchedAt: string
  source: WebContextSource
  warnings?: string[]
  creditsEstimated?: number
}

export type WebContextProvider = {
  name: WebContextProviderName
  scrapeMarkdown(request: WebContextRequest): Promise<WebContextResult>
}

export type WebContextErrorCode =
  | 'FIRECRAWL_API_KEY_MISSING'
  | 'FIRECRAWL_REQUEST_FAILED'
  | 'FIRECRAWL_INVALID_URL'
  | 'FIRECRAWL_EMPTY_CONTENT'
  | 'FIRECRAWL_TIMEOUT'
  | 'CONTEXT_DEV_API_KEY_MISSING'
  | 'CONTEXT_DEV_REQUEST_FAILED'
  | 'CONTEXT_DEV_INVALID_URL'
  | 'CONTEXT_DEV_EMPTY_CONTENT'
  | 'CONTEXT_DEV_TIMEOUT'

export class WebContextError extends Error {
  code: WebContextErrorCode

  constructor(code: WebContextErrorCode, message: string) {
    super(message)
    this.name = 'WebContextError'
    this.code = code
  }
}
