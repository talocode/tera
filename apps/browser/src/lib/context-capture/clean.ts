const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey|secret|token|password|passwd|auth|credential)[=:]\s*['"]?[A-Za-z0-9_\-.]{16,}/gi,
  /(?:sk-[A-Za-z0-9]{20,})/g,
  /(?:ghp_[A-Za-z0-9]{36})/g,
  /(?:Bearer\s+[A-Za-z0-9\-._~+/]{20,})/gi,
  /(?:AKIA[0-9A-Z]{16})/g,
]

const FORMS_SELECTORS = 'input[type="password"], input[type="email"], input[type="text"][name*="password"], input[type="text"][name*="token"], input[name*="card"], input[name*="cvv"], input[name*="cc-number"], input[autocomplete="cc-number"], input[autocomplete="cc-csc"]'

const BLOCKED_INPUT_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /apikey/i,
  /api[_-]?key/i,
]

export function redactText(text: string): string {
  let result = text
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

export function cleanHtmlForCapture(html: string): string {
  if (!html) return ''

  let cleaned = html

  cleaned = cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')

  cleaned = cleaned.replace(/on\w+\s*=\s*"[^"]*"/gi, '')
  cleaned = cleaned.replace(/on\w+\s*=\s*'[^']*'/gi, '')
  cleaned = cleaned.replace(/on\w+\s*=\s*[^\s>]+/gi, '')

  return cleaned
}

export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#[0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeText(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
}

export function truncateContent(text: string, maxChars: number = 50000): string {
  if (!text || text.length <= maxChars) return text
  return text.substring(0, maxChars).trimEnd() + '\n\n[... content truncated]'
}

export function isLikelySensitivePage(doc: Document): string | null {
  const url = doc.URL || ''
  const path = url.toLowerCase()

  if (path.includes('/login') || path.includes('/signin') || path.includes('/auth/')) {
    return 'Login or authentication page detected'
  }

  if (path.includes('/password') || path.includes('/reset') || path.includes('/recover')) {
    return 'Password-related page detected'
  }

  if (path.includes('/checkout') || path.includes('/cart') || path.includes('/payment')) {
    return 'Checkout or payment page detected'
  }

  const passwordFields = doc.querySelectorAll(BLOCKED_INPUT_PATTERNS.map((p) => `input[name${p.source}]`).join(', '))
  if (passwordFields.length > 0) {
    return 'Contains credential input fields'
  }

  return null
}

export function hasFormInputs(doc: Document): boolean {
  try {
    const inputs = doc.querySelectorAll(FORMS_SELECTORS)
    return inputs.length > 0
  } catch {
    return false
  }
}
