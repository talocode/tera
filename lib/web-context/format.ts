import type { ResearchCitation } from '@/lib/tavily'
import type { WebContextResult } from '@/lib/web-context/types'

export function webContextResultToCitation(result: WebContextResult): ResearchCitation {
  const content = result.source.content || result.text || result.markdown || ''
  const snippet = content.slice(0, 300).trim()
  return {
    title: result.source.title || result.title || 'Web page',
    url: result.source.url || result.url || '',
    snippet: snippet || null,
    publishedDate: null,
    provider: result.provider,
  }
}

export function formatWebContextForPrompt(results: WebContextResult[]): string {
  if (!results.length) return ''

  const lines = ['URL context:']

  for (const result of results) {
    const title = result.source.title || result.title || 'Web page'
    lines.push(`- ${title} (${result.source.url || result.url || ''})`)
    lines.push(result.source.content || result.text || result.markdown || '')
  }

  return lines.join('\n')
}
