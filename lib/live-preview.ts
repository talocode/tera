export type PreviewKind = 'html' | 'svg' | 'css' | 'js'

export type PreviewSource = {
  language: string
  code: string
  srcDoc: string
}

export function previewKind(language: string, code: string): PreviewKind | null {
  const lang = language.toLowerCase()
  if (lang === 'svg' || code.trim().startsWith('<svg')) return 'svg'
  if (['html', 'htm', 'xml'].includes(lang) || /<!doctype|<html|<body|<div|<button|<section|<main/i.test(code)) return 'html'
  if (lang === 'css') return 'css'
  if (['js', 'javascript'].includes(lang)) return 'js'
  return null
}

export function documentFor(kind: PreviewKind, code: string) {
  const errorScript = `<script>window.onerror=function(msg){document.body.innerHTML='<pre style="color:#9a3412;padding:12px;white-space:pre-wrap">'+msg+'</pre>';return true}</script>`
  if (kind === 'html' && /<!doctype|<html/i.test(code)) return code
  if (kind === 'html' || kind === 'svg') {
    return `<!doctype html><html><head><meta charset="utf-8">${errorScript}<style>html,body{margin:0;padding:16px;font-family:system-ui,sans-serif}</style></head><body>${code}</body></html>`
  }
  if (kind === 'css') {
    return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:16px;font-family:system-ui,sans-serif}${code}</style></head><body><h1>Heading</h1><p>Preview text for this stylesheet.</p><button>Button</button></body></html>`
  }
  return `<!doctype html><html><head><meta charset="utf-8">${errorScript}<style>html,body{margin:0;padding:16px;font-family:system-ui,sans-serif}</style></head><body><div id="root"></div><script>${code}</script></body></html>`
}

export function extractPreviewSources(markdown: string): PreviewSource[] {
  const openFence = (markdown.match(/```/g)?.length ?? 0) % 2 === 1
  const source = openFence ? `${markdown}\n\`\`\`` : markdown
  const parts = source.split(/(```[\s\S]*?```)/g)
  const previews: PreviewSource[] = []

  for (const part of parts) {
    if (!part.startsWith('```')) continue
    const match = part.match(/```(\w+)?(?::(\w+))?\n?([\s\S]*?)```/)
    if (!match) continue
    const language = match[1] || 'text'
    const code = (match[3] || '').trim()
    const kind = previewKind(language, code)
    if (!kind || code.length < 12) continue
    previews.push({ language, code, srcDoc: documentFor(kind, code) })
  }

  return previews
}

const storageKey = (sessionId: string) => `tera-live-previews:${sessionId}`

export function rememberPreview(sessionId: string, index: number, source: PreviewSource) {
  if (typeof window === 'undefined') return
  try {
    const current = JSON.parse(window.sessionStorage.getItem(storageKey(sessionId)) || '{}')
    current[String(index)] = source
    window.sessionStorage.setItem(storageKey(sessionId), JSON.stringify(current))
  } catch {
    // The chat history page can still rebuild the preview.
  }
}

export function readRememberedPreviews(sessionId: string): Record<string, PreviewSource> {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(storageKey(sessionId)) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}
