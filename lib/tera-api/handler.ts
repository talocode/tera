import { NextResponse } from 'next/server'
import { extractApiKey, missingApiKeyError } from './auth.ts'
import { chargeCredits } from './billing.ts'
import type { UsageMeta } from './responses.ts'
import { makeResponseHeaders, errorJson } from './responses.ts'
import { getPrice } from './pricing.ts'
import { makeRequestId } from './request-id.ts'
import { ERROR_CODES, makeError, type ErrorCode } from './errors.ts'

export interface HandlerOptions<T> {
  action: string
  capability: string
  credits: number
  validate: (body: unknown) => { success: true; data: T } | { success: false; error: unknown }
  execute: (data: T) => Promise<unknown>
}

export async function handleTeraApiRequest<T>(
  request: Request,
  opts: HandlerOptions<T>,
): Promise<NextResponse> {
  const requestId = makeRequestId()

  const apiKey = extractApiKey(request)
  if (!apiKey) {
    return errorJson(missingApiKeyError(requestId), 401, { 'x-tera-request-id': requestId })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorJson(
      makeError(ERROR_CODES.INVALID_REQUEST, 'Request body must be valid JSON.', requestId),
      400,
      { 'x-tera-request-id': requestId }
    )
  }

  const validation = opts.validate(body)
  if (!validation.success) {
    const issues = extractZodIssues(validation.error)
    return errorJson(
      makeError(ERROR_CODES.INVALID_REQUEST, issues.length > 0 ? issues[0] : 'Invalid request body.', requestId),
      400,
      { 'x-tera-request-id': requestId }
    )
  }

  const price = getPrice(opts.action)
  if (price === null) {
    return errorJson(
      makeError(ERROR_CODES.INTERNAL_ERROR, `No pricing defined for action: ${opts.action}`, requestId),
      500,
      { 'x-tera-request-id': requestId }
    )
  }

  const chargeResult = await chargeCredits({
    apiKey,
    action: opts.action,
    credits: price,
    requestId,
  })

  if (!chargeResult.success) {
    const status = chargeResult.error?.error.code === ERROR_CODES.INSUFFICIENT_CREDITS ? 402 : 502
    return errorJson(
      chargeResult.error || makeError(ERROR_CODES.BILLING_UNAVAILABLE, 'Billing failed.', requestId),
      status,
      { 'x-tera-request-id': requestId }
    )
  }

  let result: unknown
  try {
    result = await opts.execute(validation.data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Execution failed.'
    return errorJson(
      makeError(ERROR_CODES.PROVIDER_UNAVAILABLE, message, requestId),
      503,
      makeResponseHeaders({
        requestId,
        action: opts.action,
        credits: price,
        capability: opts.capability,
      })
    )
  }

  const headers = makeResponseHeaders({
    requestId,
    action: opts.action,
    credits: price,
    capability: opts.capability,
  })

  return NextResponse.json(
    {
      id: requestId,
      object: `tera.${opts.action}`,
      result,
      usage: chargeResult.usage satisfies UsageMeta,
    },
    { status: 200, headers }
  )
}

function extractZodIssues(error: unknown): string[] {
  if (typeof error === 'object' && error !== null) {
    const zodError = error as { issues?: Array<{ message: string }> }
    if (Array.isArray(zodError.issues)) {
      return zodError.issues.map((i) => i.message)
    }
  }
  return ['Invalid request body.']
}
