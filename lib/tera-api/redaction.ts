const API_KEY_PATTERN = /tk_(dev|live)_[a-zA-Z0-9]{32,}/g

function redactApiKeys(input: string): string {
  return input.replace(API_KEY_PATTERN, 'tk_redacted')
}

export function redactForLogging(meta: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(meta)) {
    if (typeof value === 'string') {
      result[key] = redactApiKeys(value)
    } else {
      result[key] = value
    }
  }
  return result
}
