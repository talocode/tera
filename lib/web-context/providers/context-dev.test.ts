import assert from 'node:assert/strict'
import test from 'node:test'
import { contextDevProvider } from './context-dev'
import { WebContextError } from '../types'

const originalFetch = globalThis.fetch
const originalApiKey = process.env.CONTEXT_DEV_API_KEY
const originalBaseUrl = process.env.CONTEXT_DEV_BASE_URL

test.afterEach(() => {
  globalThis.fetch = originalFetch
  process.env.CONTEXT_DEV_API_KEY = originalApiKey
  process.env.CONTEXT_DEV_BASE_URL = originalBaseUrl
})

test('missing API key returns clean error', async () => {
  delete process.env.CONTEXT_DEV_API_KEY

  await assert.rejects(
    () => contextDevProvider.scrapeMarkdown({ url: 'https://example.com' }),
    (error: unknown) => {
      assert.ok(error instanceof WebContextError)
      assert.equal(error.code, 'CONTEXT_DEV_API_KEY_MISSING')
      assert.equal(String(error.message).includes('sk-'), false)
      return true
    }
  )
})

test('Context.dev response maps to WebContextResult/source format', async () => {
  process.env.CONTEXT_DEV_API_KEY = 't3st-v4lu3-n0t-s3cr3t'
  process.env.CONTEXT_DEV_BASE_URL = 'https://api.context.dev/v1'

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    assert.match(url, /\/web\/scrape\/markdown/)
    assert.match(url, /url=https%3A%2F%2Fexample.com/)

    return new Response(
      JSON.stringify({
        success: true,
        markdown: '# Example Page\n\nHello world',
        url: 'https://example.com',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }) as typeof fetch

  const result = await contextDevProvider.scrapeMarkdown({ url: 'https://example.com', maxChars: 1000 })

  assert.equal(result.provider, 'context-dev')
  assert.equal(result.source.provider, 'context-dev')
  assert.equal(result.source.url, 'https://example.com')
  assert.equal(result.source.title, 'Example Page')
  assert.match(result.source.content, /Hello world/)
  assert.equal(result.creditsEstimated, 1)
  assert.ok(result.source.fetchedAt)
})

test('env values and API key never appear in thrown errors', async () => {
  process.env.CONTEXT_DEV_API_KEY = 't3st-v4lu3-n0t-s3cr3t'
  process.env.CONTEXT_DEV_BASE_URL = 'https://api.context.dev/v1'

  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ message: 'Unauthorized', error_code: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch

  await assert.rejects(
    () => contextDevProvider.scrapeMarkdown({ url: 'https://example.com' }),
    (error: unknown) => {
      const serialized = JSON.stringify(error)
      assert.equal(serialized.includes('t3st-v4lu3-n0t-s3cr3t'), false)
      assert.equal(serialized.includes('CONTEXT_DEV_API_KEY'), false)
      return true
    }
  )
})
