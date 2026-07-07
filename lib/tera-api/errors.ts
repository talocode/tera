export const ERROR_CODES = {
  MISSING_API_KEY: 'missing_api_key',
  INVALID_REQUEST: 'invalid_request',
  BILLING_UNAVAILABLE: 'billing_unavailable',
  INSUFFICIENT_CREDITS: 'insufficient_credits',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  INTERNAL_ERROR: 'internal_error',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export interface TeraApiError {
  error: {
    code: ErrorCode
    message: string
    requestId?: string
  }
}

export function makeError(code: ErrorCode, message: string, requestId?: string): TeraApiError {
  const err: TeraApiError = {
    error: { code, message },
  }
  if (requestId) err.error.requestId = requestId
  return err
}
