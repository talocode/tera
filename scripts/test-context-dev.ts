/**
 * Context.dev smoke test
 *
 * Usage:
 *   npx tsx scripts/test-context-dev.ts https://example.com
 */

import { contextDevProvider } from '../lib/web-context/providers/context-dev'

async function main() {
  const url = process.argv[2]

  if (!url) {
    console.error('Usage: npx tsx scripts/test-context-dev.ts <url>')
    process.exit(1)
  }

  if (!process.env.CONTEXT_DEV_API_KEY?.trim()) {
    console.error('CONTEXT_DEV_API_KEY is required in the environment')
    process.exit(1)
  }

  const result = await contextDevProvider.scrapeMarkdown({ url, maxChars: 5000 })

  console.log('Provider:', result.source.provider)
  console.log('Title:', result.source.title)
  console.log('URL:', result.source.url)
  console.log('Content length:', result.source.content.length)
  console.log('Credits estimated:', result.creditsEstimated ?? 'n/a')
  console.log('Preview:\n')
  console.log(result.source.content.slice(0, 500))
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error('Context.dev smoke test failed:', message)
  process.exit(1)
})