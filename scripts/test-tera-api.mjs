#!/usr/bin/env node

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

process.env.TERA_API_ALLOW_MOCK_PROVIDER = 'true'
process.env.TERA_API_PROVIDER = 'mock'
process.env.STACKLANE_API_BASE_URL = 'http://localhost:0'

// Auth module
const authMod = await import('../lib/tera-api/auth.ts')
// Errors module
const errorsMod = await import('../lib/tera-api/errors.ts')
// Request ID module
const ridMod = await import('../lib/tera-api/request-id.ts')
// Pricing module
const pricingMod = await import('../lib/tera-api/pricing.ts')
// Schemas module
const schemasMod = await import('../lib/tera-api/schemas.ts')
// Writing capabilities
const writingMod = await import('../lib/tera-api/capabilities/writing.ts')
// Coding capabilities
const codingMod = await import('../lib/tera-api/capabilities/coding.ts')
// Provider
const providerMod = await import('../lib/tera-api/capabilities/provider.ts')
// Redaction
const redactMod = await import('../lib/tera-api/redaction.ts')
// Billing
const billingMod = await import('../lib/tera-api/billing.ts')

// ─── Auth Tests ────────────────────────────────────────────────────────────
describe('auth', () => {
  it('extracts Bearer token from Authorization header', () => {
    const { extractApiKey } = authMod
    const req = new Request('http://localhost', {
      headers: { authorization: 'Bearer tk_dev_testkey123' },
    })
    assert.equal(extractApiKey(req), 'tk_dev_testkey123')
  })

  it('extracts key from X-Api-Key header', () => {
    const { extractApiKey } = authMod
    const req = new Request('http://localhost', {
      headers: { 'x-api-key': 'tk_dev_testkey456' },
    })
    assert.equal(extractApiKey(req), 'tk_dev_testkey456')
  })

  it('returns null when no auth header present', () => {
    const { extractApiKey } = authMod
    const req = new Request('http://localhost')
    assert.equal(extractApiKey(req), null)
  })

  it('missingApiKeyError returns correct error shape', () => {
    const { missingApiKeyError } = authMod
    const err = missingApiKeyError('req_123')
    assert.equal(err.error.code, 'missing_api_key')
    assert.equal(typeof err.error.message, 'string')
    assert.equal(err.error.requestId, 'req_123')
  })
})

// ─── Errors Tests ──────────────────────────────────────────────────────────
describe('errors', () => {
  it('makeError creates correct error shape', () => {
    const { makeError, ERROR_CODES } = errorsMod
    const err = makeError(ERROR_CODES.INVALID_REQUEST, 'Bad input.', 'req_abc')
    assert.equal(err.error.code, 'invalid_request')
    assert.equal(err.error.message, 'Bad input.')
    assert.equal(err.error.requestId, 'req_abc')
  })

  it('makeError works without requestId', () => {
    const { makeError, ERROR_CODES } = errorsMod
    const err = makeError(ERROR_CODES.MISSING_API_KEY, 'No key.')
    assert.equal(err.error.code, 'missing_api_key')
    assert.equal(err.error.requestId, undefined)
  })
})

// ─── Request ID Tests ──────────────────────────────────────────────────────
describe('request-id', () => {
  it('makeRequestId returns prefixed id', () => {
    const { makeRequestId } = ridMod
    const id = makeRequestId()
    assert.ok(id.startsWith('tera_req_'))
    assert.ok(id.length > 10)
  })

  it('generates unique ids', () => {
    const { makeRequestId } = ridMod
    const a = makeRequestId()
    const b = makeRequestId()
    assert.notEqual(a, b)
  })
})

// ─── Pricing Tests ─────────────────────────────────────────────────────────
describe('pricing', () => {
  it('returns correct prices for all actions', () => {
    const { getPrice, TERA_API_PRICING } = pricingMod
    assert.equal(getPrice('writing.rewrite'), 5)
    assert.equal(getPrice('writing.draft'), 10)
    assert.equal(getPrice('coding.explain'), 10)
    assert.equal(getPrice('coding.review'), 20)
    assert.equal(getPrice('nonexistent'), null)
  })

  it('TERA_API_PRICING has all expected actions', () => {
    const { TERA_API_PRICING } = pricingMod
    assert.deepEqual(Object.keys(TERA_API_PRICING).sort(), [
      'coding.explain', 'coding.review', 'writing.draft', 'writing.rewrite',
    ])
  })
})

// ─── Schema Validation Tests ───────────────────────────────────────────────
describe('schemas', () => {
  describe('rewriteSchema', () => {
    it('validates correct rewrite input', () => {
      const { rewriteSchema } = schemasMod
      const result = rewriteSchema.safeParse({ text: 'Hello world', style: 'professional', tone: 'direct', maxLength: 280 })
      assert.ok(result.success)
    })
    it('rejects empty text', () => {
      const { rewriteSchema } = schemasMod
      assert.ok(!rewriteSchema.safeParse({ text: '' }).success)
    })
    it('rejects text over 20000 chars', () => {
      const { rewriteSchema, REWRITE_TEXT_MAX } = schemasMod
      assert.ok(!rewriteSchema.safeParse({ text: 'x'.repeat(REWRITE_TEXT_MAX + 1) }).success)
    })
    it('applies defaults for optional fields', () => {
      const { rewriteSchema } = schemasMod
      const r = rewriteSchema.safeParse({ text: 'hello' })
      assert.ok(r.success)
      if (r.success) {
        assert.equal(r.data.style, 'professional')
        assert.equal(r.data.tone, 'neutral')
      }
    })
  })
  describe('draftSchema', () => {
    it('validates correct draft input', () => {
      const { draftSchema } = schemasMod
      assert.ok(draftSchema.safeParse({ type: 'email', brief: 'Welcome' }).success)
    })
    it('rejects invalid draft type', () => {
      const { draftSchema } = schemasMod
      assert.ok(!draftSchema.safeParse({ type: 'invalid', brief: 'test' }).success)
    })
    it('rejects empty brief', () => {
      const { draftSchema } = schemasMod
      assert.ok(!draftSchema.safeParse({ type: 'email', brief: '' }).success)
    })
  })
  describe('explainSchema', () => {
    it('validates correct explain input', () => {
      const { explainSchema } = schemasMod
      const r = explainSchema.safeParse({ language: 'typescript', code: 'const x = 1', level: 'beginner', focus: ['logic'] })
      assert.ok(r.success)
    })
    it('rejects empty code', () => {
      const { explainSchema } = schemasMod
      assert.ok(!explainSchema.safeParse({ language: 'ts', code: '' }).success)
    })
    it('rejects invalid level', () => {
      const { explainSchema } = schemasMod
      assert.ok(!explainSchema.safeParse({ language: 'ts', code: 'x', level: 'expert+' }).success)
    })
  })
  describe('reviewSchema', () => {
    it('validates correct review input', () => {
      const { reviewSchema } = schemasMod
      assert.ok(reviewSchema.safeParse({ language: 'python', code: 'def add(a,b): return a+b', focus: ['bugs'], strictness: 'normal' }).success)
    })
    it('rejects invalid strictness', () => {
      const { reviewSchema } = schemasMod
      assert.ok(!reviewSchema.safeParse({ language: 'ts', code: 'x', strictness: 'extreme' }).success)
    })
    it('rejects code over limit', () => {
      const { reviewSchema, CODE_MAX } = schemasMod
      assert.ok(!reviewSchema.safeParse({ language: 'ts', code: 'x'.repeat(CODE_MAX + 1) }).success)
    })
  })
})

// ─── Capability Execution Tests (mock provider) ────────────────────────────
describe('capabilities (mock provider)', () => {
  it('executeRewrite returns expected shape', async () => {
    const { executeRewrite } = writingMod
    const result = await executeRewrite({ text: 'Hello world', style: 'professional', tone: 'neutral' })
    assert.ok(typeof result.text === 'string')
    assert.ok(Array.isArray(result.notes))
  })
  it('executeDraft returns expected shape', async () => {
    const { executeDraft } = writingMod
    const result = await executeDraft({ type: 'email', brief: 'Welcome email', audience: 'users', tone: 'warm' })
    assert.ok(typeof result.text === 'string')
    assert.ok(result.title === null || typeof result.title === 'string')
  })
  it('executeExplain returns expected shape', async () => {
    const { executeExplain } = codingMod
    const result = await executeExplain({ language: 'typescript', code: 'const x = 1', level: 'beginner', focus: ['logic', 'types'] })
    assert.ok(typeof result.summary === 'string')
    assert.ok(typeof result.explanation === 'string')
    assert.ok(Array.isArray(result.importantLines))
    assert.ok(Array.isArray(result.risks))
  })
  it('executeReview returns expected shape', async () => {
    const { executeReview } = codingMod
    const result = await executeReview({ language: 'typescript', code: 'export function add(a,b){ return a+b }', focus: ['bugs', 'security'], strictness: 'normal' })
    assert.ok(typeof result.summary === 'string')
    assert.ok(Array.isArray(result.issues))
    if (result.issues.length > 0) {
      const i = result.issues[0]
      assert.ok(typeof i.title === 'string' && typeof i.description === 'string' && typeof i.suggestion === 'string')
      assert.ok(['low', 'medium', 'high'].includes(i.severity))
    }
  })
})

// ─── Provider Tests ────────────────────────────────────────────────────────
describe('provider', () => {
  it('getProviderConfig returns mock config', () => {
    const { getProviderConfig } = providerMod
    assert.equal(getProviderConfig().provider, 'mock')
  })
  it('isMockAllowed returns true when env set', () => {
    const { isMockAllowed } = providerMod
    assert.equal(isMockAllowed(), true)
  })
  it('callProvider with mock returns a string', async () => {
    const { callProvider } = providerMod
    const result = await callProvider('test instruction', 'test content')
    assert.ok(typeof result === 'string')
    assert.ok(result.length > 0)
  })
})

// ─── Redaction Tests ───────────────────────────────────────────────────────
describe('redaction', () => {
  it('redacts API keys from metadata values', () => {
    const { redactForLogging } = redactMod
    const meta = { key: 'tk_dev_abcdefghijklmnopqrstuvwxyz1234567890' }
    const result = redactForLogging(meta)
    assert.ok(typeof result.key === 'string')
    assert.ok(!result.key.includes('abcdefghijklmnop'))
    assert.ok(result.key.includes('tk_redacted'))
  })
  it('passes through non-string values unchanged', () => {
    const { redactForLogging } = redactMod
    const result = redactForLogging({ count: 42, active: true })
    assert.equal(result.count, 42)
    assert.equal(result.active, true)
  })
})

// ─── Billing Tests ─────────────────────────────────────────────────────────
describe('billing', () => {
  it('returns billing_unavailable when Stacklane is unreachable', async () => {
    const { chargeCredits } = billingMod
    const result = await chargeCredits({ apiKey: 'tk_dev_test', action: 'writing.rewrite', credits: 5, requestId: 'test_req' })
    assert.equal(result.success, false)
    assert.equal(result.error?.error.code, 'billing_unavailable')
  })
})

// ─── Capabilities Endpoint Shape ───────────────────────────────────────────
describe('capabilities endpoint', () => {
  it('capability entry has expected structure', () => {
    const entry = { id: 'writing.rewrite', object: 'tera.capability', description: '', credits: 5, methods: ['POST'], route: '/v1/writing/rewrite' }
    assert.equal(entry.id, 'writing.rewrite')
    assert.equal(entry.credits, 5)
    assert.ok(Array.isArray(entry.methods))
  })
})

// ─── Pricing Endpoint Shape ────────────────────────────────────────────────
describe('pricing endpoint', () => {
  it('pricing data has expected structure', () => {
    const { TERA_API_PRICING } = pricingMod
    const entries = Object.entries(TERA_API_PRICING).map(([action, credits]) => ({ action, credits, usdValue: credits * 0.01 }))
    assert.equal(entries.length, 4)
    for (const e of entries) {
      assert.ok(typeof e.action === 'string')
      assert.ok(typeof e.credits === 'number')
      assert.ok(e.usdValue > 0)
    }
  })
})
