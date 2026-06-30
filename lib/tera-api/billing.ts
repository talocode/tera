import { ERROR_CODES, makeError, type TeraApiError } from './errors.ts'
import type { UsageMeta } from './responses.ts'
import { redactForLogging } from './redaction.ts'

interface StacklaneChargePayload {
  product: string
  action: string
  requestId: string
  credits: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

interface StacklaneChargeResponse {
  data?: {
    ok?: boolean
    error?: string
    event?: {
      credits: number
      status: string
    }
  }
  error?: {
    code: string
    message: string
  }
}

export interface ChargeResult {
  success: boolean
  usage: UsageMeta
  error?: TeraApiError
}

function getStacklaneBaseUrl(): string {
  return process.env.TALOCODE_BASE_URL || process.env.STACKLANE_API_BASE_URL || 'http://localhost:4000'
}

export async function chargeCredits(opts: {
  apiKey: string
  action: string
  credits: number
  requestId: string
  metadata?: Record<string, unknown>
}): Promise<ChargeResult> {
  const payload: StacklaneChargePayload = {
    product: 'tera_api',
    action: opts.action,
    requestId: opts.requestId,
    credits: opts.credits,
    idempotencyKey: opts.requestId,
    metadata: opts.metadata ? redactForLogging(opts.metadata) : undefined,
  }

  try {
    const response = await fetch(`${getStacklaneBaseUrl()}/api/v1/cloud/usage/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      if (response.status === 402) {
        return {
          success: false,
          usage: { credits: opts.credits, action: opts.action },
          error: makeError(
            ERROR_CODES.INSUFFICIENT_CREDITS,
            `Insufficient Talocode Cloud credits. Required: ${opts.credits}.`,
            opts.requestId
          ),
        }
      }

      let body: StacklaneChargeResponse | null = null
      try {
        body = await response.json()
      } catch {
        // ignore parse errors
      }

      return {
        success: false,
        usage: { credits: opts.credits, action: opts.action },
        error: makeError(
          ERROR_CODES.BILLING_UNAVAILABLE,
          body?.error?.message || `Billing service returned status ${response.status}.`,
          opts.requestId
        ),
      }
    }

    const body: StacklaneChargeResponse = await response.json()

    if (body?.data?.ok !== true) {
      return {
        success: false,
        usage: { credits: opts.credits, action: opts.action },
        error: makeError(
          ERROR_CODES.BILLING_UNAVAILABLE,
          body?.data?.error || 'Billing service rejected the charge.',
          opts.requestId
        ),
      }
    }

    return {
      success: true,
      usage: { credits: opts.credits, action: opts.action },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Billing service unreachable.'
    return {
      success: false,
      usage: { credits: opts.credits, action: opts.action },
      error: makeError(ERROR_CODES.BILLING_UNAVAILABLE, message, opts.requestId),
    }
  }
}
