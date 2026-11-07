'use client'

import { useEffect, useState } from 'react'

type PreviewKind = 'html' | 'svg' | 'css' | 'js'

function previewKind(language: string, code: string): PreviewKind | null {
  const lang = language.toLowerCase()
  if (lang === 'svg' || code.trim().startsWith('<svg')) return 'svg'
  if (['html', 'htm', 'xml'].includes(lang) || /<!doctype|<html|<body|<div|<button|<section|<main/i.test(code)) return 'html'
  if (lang === 'css') return 'css'
  if (['js', 'javascript'].includes(lang)) return 'js'
  return null
}

function documentFor(kind: PreviewKind, code: string) {
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

export default function LiveCodePreview({ code, language, partial = false }: { code: string; language: string; partial?: boolean }) {
  const kind = previewKind(language, code)
  const [srcDoc, setSrcDoc] = useState<string | null>(null)

  useEffect(() => {
    if (!kind || (kind === 'js' && partial) || code.trim().length < 12) {
      setSrcDoc(null)
      return
    }
    const timer = setTimeout(() => setSrcDoc(documentFor(kind, code)), 160)
    return () => clearTimeout(timer)
  }, [code, kind, partial])

  if (!srcDoc) return null

  return (
    <div className="border-t border-white/10 bg-white">
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">Live preview</p>
      <iframe title="Live code preview" sandbox="allow-scripts" srcDoc={srcDoc} className="h-64 w-full border-0 bg-white" />
    </div>
  )
}
