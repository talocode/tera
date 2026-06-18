import assert from 'node:assert/strict'
import test from 'node:test'
import { firecrawlProvider } from './firecrawl'
import { WebContextError } from '../types'

const originalFetch = globalThis.fetch
const originalApiKey = process.env.FIRECRAWL_API_KEY
const originalBaseUrl = process.env.FIRECRAWL_API_BASE_URL

test.afterEach(() => {
  globalThis.fetch = originalFetch
  process.env.FIRECRAWL_API_KEY = originalApiKey
  process.env.FIRECRAWL_API_BASE_URL = originalBaseUrl
})

test('missing API key returns clean error', async () => {
  delete process.env.FIRECRAWL_API_KEY

  await assert.rejects(
    () => firecrawlProvider.scrapeMarkdown({ url: 'https://example.com' }),
    (error: unknown) => {
      assert.ok(error instanceof WebContextError)
      assert.equal(error.code, 'FIRECRAWL_API_KEY_MISSING')
      assert.equal(String(error.message).includes('sk-'), false)
      return true
    }
  )
})

test('Firecrawl response maps to normalized WebContextResult', async () => {
  process.env.FIRECRAWL_API_KEY = 'test-key-not-printed'
  process.env.FIRECRAWL_API_BASE_URL = 'https://api.firecrawl.dev'

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    assert.equal(url, 'https://api.firecrawl.dev/v2/scrape')
    assert.equal(init?.method, 'POST')
    const headers = init?.headers instanceof Headers ? init.headers : new Headers(init?.headers)
    assert.equal(headers.get('Authorization'), 'Bearer test-key-not-printed')
    assert.equal(headers.get('Content-Type'), 'application/json')

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          markdown: '# Example Page\n\nHello world',
          url: 'https://example.com',
          metadata: { title: 'Example Page', sourceURL: 'https://example.com' },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }) as typeof fetch

  const result = await firecrawlProvider.scrapeMarkdown({ url: 'https://example.com', maxChars: 1000 })

  assert.equal(result.provider, 'firecrawl')
  assert.equal(result.source.provider, 'firecrawl')
  assert.equal(result.url, 'https://example.com')
  assert.equal(result.source.url, 'https://example.com')
  assert.equal(result.title, 'Example Page')
  assert.match(result.source.content, /Hello world/)
  assert.ok(result.fetchedAt)
})

test('endpoint construction normalizes trailing slash and /v2 suffix', async () => {
  process.env.FIRECRAWL_API_KEY = 'test-key-not-printed'
  process.env.FIRECRAWL_API_BASE_URL = 'https://api.firecrawl.dev/v2/'

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    assert.equal(String(input), 'https://api.firecrawl.dev/v2/scrape')
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          markdown: '# Example Page\n\nHello world',
          url: 'https://example.com',
          metadata: { title: 'Example Page', sourceURL: 'https://example.com' },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }) as typeof fetch

  const result = await firecrawlProvider.scrapeMarkdown({ url: 'https://example.com', maxChars: 1000 })
  assert.equal(result.provider, 'firecrawl')
})

test('fetch failures do not expose api keys', async () => {
  process.env.FIRECRAWL_API_KEY = 'super-secret-firecrawl-key'
  process.env.FIRECRAWL_API_BASE_URL = 'https://api.firecrawl.dev'

  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch

  await assert.rejects(
    () => firecrawlProvider.scrapeMarkdown({ url: 'https://example.com' }),
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      assert.equal(message.includes('super-secret-firecrawl-key'), false)
      assert.equal(message.includes('FIRECRAWL_API_KEY'), false)
      assert.equal(message.includes('https://api.firecrawl.dev/v2/scrape'), true)
      assert.equal(message.includes('401'), true)
      return true
    }
  )
})
