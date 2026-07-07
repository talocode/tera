import { ERROR_CODES, makeError, type TeraApiError } from './errors.ts'

export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  const xApiKey = request.headers.get('x-api-key')
  if (xApiKey) {
    return xApiKey.trim()
  }

  return null
}

export function missingApiKeyError(requestId?: string): TeraApiError {
  return makeError(ERROR_CODES.MISSING_API_KEY, 'API key is required. Provide via Authorization: Bearer <key> or X-Api-Key header.', requestId)
}
