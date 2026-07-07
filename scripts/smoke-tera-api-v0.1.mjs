#!/usr/bin/env node

/**
 * Tera API Smoke Test v0.1
 *
 * Tests the full API surface: health, capabilities, pricing, and capability endpoints.
 *
 * Configurable via env:
 *   TALOCODE_BASE_URL  (default: http://localhost:3000)
 *   TALOCODE_API_KEY   (default: tk_dev_smoke_test_key)
 *
 * Legacy env vars supported (fallback):
 *   TERA_API_BASE_URL (overrides everything if set)
 *   STACKLANE_API_BASE_URL (legacy alias)
 */

const BASE_URL = (process.env.TERA_API_BASE_URL
  || (process.env.TALOCODE_BASE_URL ? `${process.env.TALOCODE_BASE_URL}/api/v1` : null)
  || (process.env.STACKLANE_API_BASE_URL ? `${process.env.STACKLANE_API_BASE_URL}/api/v1/tera` : null)
  || 'http://localhost:3000/api/v1')
const API_KEY = process.env.TALOCODE_API_KEY || 'tk_dev_smoke_test_key'

async function req(method, path, body) {
  const url = `${BASE_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)

  let status, data
  try {
    const res = await fetch(url, opts)
    status = res.status
    data = await res.json()
  } catch (err) {
    return { ok: false, status: 0, error: `Fetch failed: ${err.message}` }
  }
  return { ok: status >= 200 && status < 300, status, data }
}

let passed = 0
let failed = 0

function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  ✅ ${name}`) }
  else { failed++; console.log(`  ❌ ${name} ${detail}`) }
}

console.log(`=== Tera API Smoke v0.1 ===`)
console.log(`Base URL: ${BASE_URL}\n`)

// 1. Health
console.log('── Health ──')
const health = await req('GET', '/health')
check('health returns 200', health.status === 200, `got ${health.status}`)
check('health has status ok', health.data?.status === 'ok', JSON.stringify(health.data))
check('health has endpoints list', Array.isArray(health.data?.endpoints), JSON.stringify(health.data))

// 2. Capabilities
console.log('\n── Capabilities ──')
const caps = await req('GET', '/capabilities')
check('capabilities returns 200', caps.status === 200, `got ${caps.status}`)
check('capabilities is a list', caps.data?.object === 'list', JSON.stringify(caps.data))
check('capabilities has 4 items', Array.isArray(caps.data?.data) && caps.data.data.length === 4, JSON.stringify(caps.data))
check('capabilities include writing.rewrite', caps.data?.data?.some(c => c.id === 'writing.rewrite'), JSON.stringify(caps.data))

// 3. Pricing
console.log('\n── Pricing ──')
const pricing = await req('GET', '/pricing')
check('pricing returns 200', pricing.status === 200, `got ${pricing.status}`)
check('pricing is a list', pricing.data?.object === 'list', JSON.stringify(pricing.data))
check('pricing has 4 items', Array.isArray(pricing.data?.data) && pricing.data.data.length === 4, JSON.stringify(pricing.data))
check('pricing includes writing.rewrite=5', pricing.data?.data?.some(p => p.action === 'writing.rewrite' && p.credits === 5), JSON.stringify(pricing.data))

// 4. Rewrite (expect 402 insufficient credits or success with mock)
console.log('\n── Rewrite ──')
const rewrite = await req('POST', '/writing/rewrite', {
  text: 'We just shipped our browser agent.',
  style: 'clear, founder-like, X post',
  tone: 'direct',
  maxLength: 280,
})
// In local dev without billing, expect 402 or 502
// In dev with mock billing, expect 200
const rewriteOk = rewrite.status === 200 || rewrite.status === 402 || rewrite.status === 502
check('rewrite returns expected status', rewriteOk, `got ${rewrite.status}: ${JSON.stringify(rewrite.data)}`)
if (rewrite.status === 200) {
  check('rewrite has id', typeof rewrite.data?.id === 'string', JSON.stringify(rewrite.data))
  check('rewrite has object type', rewrite.data?.object === 'tera.writing.rewrite', JSON.stringify(rewrite.data))
  check('rewrite has result text', typeof rewrite.data?.result?.text === 'string', JSON.stringify(rewrite.data))
  check('rewrite has usage credits', typeof rewrite.data?.usage?.credits === 'number', JSON.stringify(rewrite.data))
} else if (rewrite.status === 402) {
  check('rewrite returns insufficient_credits', rewrite.data?.error?.code === 'insufficient_credits', JSON.stringify(rewrite.data))
} else if (rewrite.status === 502) {
  check('rewrite returns billing_unavailable', rewrite.data?.error?.code === 'billing_unavailable', JSON.stringify(rewrite.data))
}

// 5. Draft (same expectations as rewrite)
console.log('\n── Draft ──')
const draft = await req('POST', '/writing/draft', {
  type: 'announcement',
  brief: 'Talocode Cloud v0.1 is live',
  audience: 'developers',
  tone: 'clear and builder-minded',
})
const draftOk = draft.status === 200 || draft.status === 402 || draft.status === 502
check('draft returns expected status', draftOk, `got ${draft.status}: ${JSON.stringify(draft.data)}`)
if (draft.status === 200) {
  check('draft has id', typeof draft.data?.id === 'string', JSON.stringify(draft.data))
  check('draft result has text', typeof draft.data?.result?.text === 'string', JSON.stringify(draft.data))
}

// 6. Explain
console.log('\n── Explain ──')
const explain = await req('POST', '/coding/explain', {
  language: 'typescript',
  code: 'export function add(a,b){ return a+b }',
  level: 'beginner',
  focus: ['logic'],
})
const explainOk = explain.status === 200 || explain.status === 402 || explain.status === 502
check('explain returns expected status', explainOk, `got ${explain.status}: ${JSON.stringify(explain.data)}`)

// 7. Review
console.log('\n── Review ──')
const review = await req('POST', '/coding/review', {
  language: 'typescript',
  code: 'export function add(a,b){ return a+b }',
  focus: ['bugs', 'types'],
  strictness: 'normal',
})
const reviewOk = review.status === 200 || review.status === 402 || review.status === 502
check('review returns expected status', reviewOk, `got ${review.status}: ${JSON.stringify(review.data)}`)

// 8. Missing API key
console.log('\n── Auth (missing key) ──')
const noKeyUrl = `${BASE_URL}/writing/rewrite`
let noKeyStatus, noKeyData
try {
  const res = await fetch(noKeyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'test' }),
  })
  noKeyStatus = res.status
  noKeyData = await res.json()
} catch {
  noKeyStatus = 0
}
check('missing key returns 401', noKeyStatus === 401, `got ${noKeyStatus}`)
check('missing key error code', noKeyData?.error?.code === 'missing_api_key', JSON.stringify(noKeyData))

// 9. Invalid body
console.log('\n── Validation (empty body) ──')
const invalid = await req('POST', '/writing/rewrite', { text: '' })
check('empty text returns 400', invalid.status === 400, `got ${invalid.status}`)
check('empty text error code', invalid.data?.error?.code === 'invalid_request', JSON.stringify(invalid.data))

// 10. Response headers (only if rewrite succeeded)
if (rewrite.status === 200) {
  console.log('\n── Response Headers ──')
  const url = `${BASE_URL}/writing/rewrite`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ text: 'Hello world.', style: 'professional', tone: 'neutral' }),
  })
  check('x-tera-request-id header present', !!res.headers.get('x-tera-request-id'), 'missing')
  check('x-tera-api-action header present', !!res.headers.get('x-tera-api-action'), 'missing')
  check('x-tera-credits-charged header present', !!res.headers.get('x-tera-credits-charged'), 'missing')
  check('x-tera-billing-provider header is stacklane', res.headers.get('x-tera-billing-provider') === 'stacklane', `got ${res.headers.get('x-tera-billing-provider')}`)
  check('x-tera-capability header is writing', res.headers.get('x-tera-capability') === 'writing', `got ${res.headers.get('x-tera-capability')}`)
}

// 11-14. Namespaced routes (/tera/ prefix)
console.log('\n── Namespaced Routes (/tera/) ──')
const nsRewrite = await req('POST', '/tera/writing/rewrite', { text: 'Test.', style: 'clear', tone: 'direct', maxLength: 100 })
const nsRewriteOk = nsRewrite.status === 200 || nsRewrite.status === 402 || nsRewrite.status === 502
check('namespaced rewrite returns expected status', nsRewriteOk, `got ${nsRewrite.status}`)

const nsDraft = await req('POST', '/tera/writing/draft', { type: 'post', brief: 'Test', audience: 'dev', tone: 'direct' })
const nsDraftOk = nsDraft.status === 200 || nsDraft.status === 402 || nsDraft.status === 502
check('namespaced draft returns expected status', nsDraftOk, `got ${nsDraft.status}`)

const nsExplain = await req('POST', '/tera/coding/explain', { language: 'js', code: 'const a=1', level: 'beginner', focus: ['logic'] })
const nsExplainOk = nsExplain.status === 200 || nsExplain.status === 402 || nsExplain.status === 502
check('namespaced explain returns expected status', nsExplainOk, `got ${nsExplain.status}`)

const nsReview = await req('POST', '/tera/coding/review', { language: 'js', code: 'const a=1', focus: ['bugs'], strictness: 'normal' })
const nsReviewOk = nsReview.status === 200 || nsReview.status === 402 || nsReview.status === 502
check('namespaced review returns expected status', nsReviewOk, `got ${nsReview.status}`)

console.log(`\nPassed: ${passed}  Failed: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
