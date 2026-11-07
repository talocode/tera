'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { documentFor, previewKind, rememberPreview } from '@/lib/live-preview'

export default function LiveCodePreview({
  code,
  language,
  partial = false,
  sessionId,
  previewIndex = 0,
}: {
  code: string
  language: string
  partial?: boolean
  sessionId?: string | null
  previewIndex?: number
}) {
  const kind = previewKind(language, code)
  const [srcDoc, setSrcDoc] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!kind || (kind === 'js' && partial) || code.trim().length < 12) {
      setSrcDoc(null)
      return
    }
    const timer = setTimeout(() => {
      const next = documentFor(kind, code)
      setSrcDoc(next)
      if (sessionId) rememberPreview(sessionId, previewIndex, { language, code, srcDoc: next })
    }, 160)
    return () => clearTimeout(timer)
  }, [code, kind, language, partial, previewIndex, sessionId])

  if (!srcDoc) return null

  const fullHref = sessionId ? `/new/${sessionId}/preview?n=${previewIndex}` : null

  return (
    <div className="border-t border-white/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">Live preview</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full border border-black/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/70 hover:bg-black/5"
          >
            Expand
          </button>
          {fullHref && (
            <Link
              href={fullHref}
              className="rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-black/80"
            >
              See live full preview
            </Link>
          )}
        </div>
      </div>
      <iframe title="Live code preview" sandbox="allow-scripts" srcDoc={srcDoc} className="h-64 w-full border-0 bg-white" />
      {expanded && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-[#06080d]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Expanded preview</p>
            <div className="flex items-center gap-2">
              {fullHref && (
                <Link href={fullHref} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black">
                  See live full preview
                </Link>
              )}
              <button type="button" onClick={() => setExpanded(false)} className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
          <iframe title="Expanded code preview" sandbox="allow-scripts" srcDoc={srcDoc} className="min-h-0 w-full flex-1 border-0 bg-white" />
        </div>
      )}
    </div>
  )
}
