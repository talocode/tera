export type TeraBrowserContextCapture = {
  id: string
  url: string
  title?: string
  description?: string
  text: string
  headings: string[]
  links: Array<{ text: string; href: string }>
  selectedText?: string
  capturedAt: string
  source: 'browser' | 'search' | 'manual-url'
  warnings: string[]
}

export type CaptureResult =
  | { ok: true; capture: TeraBrowserContextCapture }
  | { ok: false; error: string; code?: string; warnings?: string[] }

export type ProviderName = 'dom' | 'jina-reader' | 'firecrawl' | 'fetch-readability'

export type ProviderFallbackResult = {
  provider: ProviderName
  text: string
  title?: string
  description?: string
  headings: string[]
  links: Array<{ text: string; href: string }>
  warnings: string[]
}

export type ResearchMode = 'summarize' | 'learn' | 'save-source' | 'send-to-tera'

export type CapturedSource = {
  id: string
  url: string
  title?: string
  description?: string
  text: string
  headings: string[]
  links: Array<{ text: string; href: string }>
  selectedText?: string
  capturedAt: string
  source: 'browser' | 'search' | 'manual-url'
  warnings: string[]
}

export type CaptureHistoryEntry = {
  id: string
  url: string
  title?: string
  capturedAt: string
  source: 'browser' | 'search' | 'manual-url'
  warnings: string[]
}
