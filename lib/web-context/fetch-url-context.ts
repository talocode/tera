import {
  extractUrlsFromText,
  getFallbackUrlContextProvider,
  getUrlContextProvider,
  promptRequestsUrlReading,
  shouldUseContextDevForUrlContext,
} from '@/lib/web-context'
import { isSafePublicUrl } from '@/lib/web-context/url-safety'
import { formatWebContextForPrompt, webContextResultToCitation } from '@/lib/web-context/format'
import type { ResearchCitation } from '@/lib/tavily'
import type { WebContextResult } from '@/lib/web-context/types'
import { WebContextError } from '@/lib/web-context/types'

const MAX_URLS_PER_PROMPT = 2
const DEFAULT_MAX_CHARS = 8_000

export type FetchUrlContextInput = {
  prompt: string
  researchMode: boolean
  subscriptionPlan: 'free' | 'pro' | 'plus' | 'lifetime'
  userId?: string
}

export type FetchUrlContextResult = {
  context: string
  citations: ResearchCitation[]
  results: WebContextResult[]
  usedProvider: boolean
}

function hasPaidResearchAccess(plan: FetchUrlContextInput['subscriptionPlan']): boolean {
  return plan === 'pro' || plan === 'plus' || plan === 'lifetime'
}

export function shouldFetchUrlContext(input: FetchUrlContextInput): boolean {
  if (!shouldUseContextDevForUrlContext()) return false
  if (!hasPaidResearchAccess(input.subscriptionPlan)) return false

  const urls = extractUrlsFromText(input.prompt).filter(isSafePublicUrl)
  if (!urls.length) return false

  if (input.researchMode) return true
  return promptRequestsUrlReading(input.prompt)
}

export async function fetchUrlContextForPrompt(input: FetchUrlContextInput): Promise<FetchUrlContextResult> {
  const empty: FetchUrlContextResult = {
    context: '',
    citations: [],
    results: [],
    usedProvider: false,
  }

  if (!shouldFetchUrlContext(input)) {
    return empty
  }

  const provider = getUrlContextProvider()
  const providerName = provider?.name ?? null
  const fallbackProvider = provider ? getFallbackUrlContextProvider(provider.name) : getFallbackUrlContextProvider(null)

  const urls = extractUrlsFromText(input.prompt).filter(isSafePublicUrl).slice(0, MAX_URLS_PER_PROMPT)
  const results: WebContextResult[] = []

  for (const url of urls) {
    try {
      if (!provider) {
        if (!fallbackProvider) continue
        const result = await fallbackProvider.scrapeMarkdown({
          url,
          userId: input.userId,
          mode: input.researchMode ? 'research' : 'url',
          maxChars: DEFAULT_MAX_CHARS,
        })
        results.push(result)
        continue
      }

      const result = await provider.scrapeMarkdown({
        url,
        userId: input.userId,
        mode: input.researchMode ? 'research' : 'url',
        maxChars: DEFAULT_MAX_CHARS,
      })
      results.push(result)
    } catch (error) {
      if (error instanceof WebContextError) {
        console.error('[context_dev_url_context_failed]', {
          userId: input.userId,
          code: error.code,
          url,
        })
        const fallback = provider ? getFallbackUrlContextProvider(provider.name) : fallbackProvider
        if (fallback && fallback.name !== providerName) {
          try {
            const result = await fallback.scrapeMarkdown({
              url,
              userId: input.userId,
              mode: input.researchMode ? 'research' : 'url',
              maxChars: DEFAULT_MAX_CHARS,
            })
            results.push(result)
            continue
          } catch (fallbackError) {
            if (fallbackError instanceof WebContextError) {
              console.error('[web_context_fallback_failed]', {
                userId: input.userId,
                code: fallbackError.code,
                url,
              })
            } else {
              console.error('[web_context_fallback_failed]', { userId: input.userId, url })
            }
          }
        }
        continue
      }

      console.error('[context_dev_url_context_failed]', { userId: input.userId, url, error })
    }
  }

  if (!results.length) {
    return empty
  }

  return {
    context: formatWebContextForPrompt(results),
    citations: results.map(webContextResultToCitation),
    results,
    usedProvider: true,
  }
}
