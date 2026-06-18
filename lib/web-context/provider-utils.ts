import type { WebContextProviderName, WebContextResult, WebContextSource } from './types'

export function trimContent(content: string, maxChars?: number): string {
  if (!maxChars || content.length <= maxChars) return content
  return `${content.slice(0, maxChars).trimEnd()}\n\n[Content truncated]`
}

export function deriveTitle(content: string, url: string, title?: string): string {
  if (title?.trim()) return title.trim()

  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch?.[1]) return headingMatch[1].trim()

  try {
    return new URL(url).hostname
  } catch {
    return 'Web page'
  }
}

export function buildWebContextResult(input: {
  provider: WebContextProviderName
  url: string
  content: string
  title?: string
  summary?: string
  citations?: WebContextResult['citations']
  fetchedAt?: string
  maxChars?: number
  creditsEstimated?: number
}): WebContextResult {
  const fetchedAt = input.fetchedAt ?? new Date().toISOString()
  const content = trimContent(input.content, input.maxChars)
  const source: WebContextSource = {
    url: input.url,
    title: input.title,
    content,
    provider: input.provider,
    fetchedAt,
  }

  return {
    url: input.url,
    title: input.title,
    markdown: content,
    text: content,
    summary: input.summary,
    citations: input.citations,
    provider: input.provider,
    fetchedAt,
    source,
    warnings: [],
    creditsEstimated: input.creditsEstimated,
  }
}
