const PRIVATE_URL_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./i,
  /^https?:\/\/10\./i,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./i,
  /^https?:\/\/192\.168\./i,
  /^https?:\/\/0\./i,
  /^file:\/\//i,
]

const UNSAFE_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
]

const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey|secret|token|password|passwd|auth|credential)[=:]\s*['"]?[A-Za-z0-9_\-.]{16,}/gi,
  /(?:sk-[A-Za-z0-9]{20,})/g,
  /(?:ghp_[A-Za-z0-9]{36})/g,
  /(?:Bearer\s+[A-Za-z0-9\-._~+/]{20,})/gi,
  /(?:AKIA[0-9A-Z]{16})/g,
]

function isPrivateUrl(url: string): boolean {
  return PRIVATE_URL_PATTERNS.some((p) => p.test(url))
}

function isUnsafeProtocol(url: string): boolean {
  return UNSAFE_PROTOCOLS.some((p) => url.trim().toLowerCase().startsWith(p))
}

function generateId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 8)
  return `cc_${ts}_${rand}`
}

function extractMetaDescription(doc: Document): string | undefined {
  const meta = doc.querySelector('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]')
  if (meta) {
    const content = meta.getAttribute('content')
    if (content) return content.trim().substring(0, 500)
  }
  return undefined
}

function extractTitle(doc: Document, url: string): string {
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
  if (ogTitle) return ogTitle.trim()

  const twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')
  if (twitterTitle) return twitterTitle.trim()

  const title = doc.querySelector('title')?.textContent
  if (title) return title.trim()

  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return url
  }
}

function extractHeadings(doc: Document): string[] {
  const headings: string[] = []
  for (const tag of ['h1', 'h2', 'h3']) {
    const els = doc.querySelectorAll(tag)
    for (const el of els) {
      const text = (el as HTMLElement).textContent?.trim()
      if (text && text.length > 0 && text.length < 200) {
        headings.push(text)
      }
    }
  }
  return headings
}

function extractLinks(doc: Document): Array<{ text: string; href: string }> {
  const links: Array<{ text: string; href: string }> = []
  const seen = new Set<string>()

  const anchors = doc.querySelectorAll('a[href]')
  for (const a of anchors) {
    const href = (a as HTMLAnchorElement).href?.trim()
    const text = (a as HTMLElement).textContent?.trim()

    if (!href || !text) continue
    if (isUnsafeProtocol(href)) continue
    if (isPrivateUrl(href)) continue
    if (seen.has(href)) continue

    seen.add(href)
    links.push({ text: text.substring(0, 200), href })
  }

  return links.slice(0, 200)
}

function extractMainText(doc: Document): string {
  const selectors = [
    'article',
    '[role="main"]',
    'main',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    '#content',
    'body',
  ]

  for (const sel of selectors) {
    const el = doc.querySelector(sel)
    if (el) {
      const clone = el.cloneNode(true) as HTMLElement
      const removals = clone.querySelectorAll('script, style, nav, header, footer, iframe, .ad, .ads, .advertisement, .sidebar, .comment, .comments, .nav, .footer, .header, noscript')
      for (const r of removals) r.remove()

      const text = (clone.textContent || '').trim()
      if (text.length > 200) return text
    }
  }

  return (doc.body?.textContent || '').trim()
}

function redactSecrets(text: string): string {
  let result = text
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

export function captureFromDocument(doc: Document, url: string, selectedText?: string): TeraBrowserContextCapture {
  const warnings: string[] = []

  if (isPrivateUrl(url)) {
    warnings.push('URL appears to be on a private or local network')
  }

  const title = extractTitle(doc, url)
  const description = extractMetaDescription(doc)
  const headings = extractHeadings(doc)
  const links = extractLinks(doc)
  const text = redactSecrets(extractMainText(doc))

  if (!text || text.trim().length === 0) {
    warnings.push('No readable text content found on page')
  }

  if (links.length === 0) {
    warnings.push('No external links found on page')
  }

  let selected: string | undefined
  if (selectedText && selectedText.trim().length > 0) {
    selected = redactSecrets(selectedText.trim().substring(0, 10000))
  }

  return {
    id: generateId(),
    url,
    title,
    description,
    text: text.substring(0, 50000),
    headings,
    links,
    selectedText: selected,
    capturedAt: new Date().toISOString(),
    source: url.startsWith('https://teraai.chat') ? 'search' : 'browser',
    warnings,
  }
}

export function validateCaptureUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' }
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return { valid: false, error: 'URL cannot be empty' }
  }

  if (isUnsafeProtocol(trimmed)) {
    return { valid: false, error: 'Unsafe protocol blocked' }
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' }
  }

  if (trimmed.startsWith('file://')) {
    return { valid: false, error: 'file:// URLs are not allowed' }
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname === 'localhost' || parsed.hostname === '0.0.0.0') {
      return { valid: false, error: 'Localhost URLs are not allowed' }
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  return { valid: true }
}

export { isPrivateUrl, isUnsafeProtocol, generateId, extractMainText, extractHeadings, extractLinks, extractTitle, extractMetaDescription, redactSecrets }
