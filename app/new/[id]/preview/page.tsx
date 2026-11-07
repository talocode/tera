'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { fetchChatHistory } from '@/app/actions/user'
import { extractPreviewSources, readRememberedPreviews, type PreviewSource } from '@/lib/live-preview'

export default function ChatLivePreviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const sessionId = params.id as string
  const selected = searchParams.get('n')
  const { user, userReady } = useAuth()
  const [previews, setPreviews] = useState<PreviewSource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const remembered = readRememberedPreviews(sessionId)
      let fromHistory: PreviewSource[] = []
      if (user?.id) {
        const rows = await fetchChatHistory(user.id, sessionId)
        fromHistory = rows.flatMap((row) => extractPreviewSources(row.response || ''))
      }
      const merged = fromHistory.length > 0
        ? fromHistory.map((preview, index) => remembered[String(index)] || preview)
        : Object.keys(remembered)
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => remembered[key])
      if (!cancelled) {
        setPreviews(merged)
        setLoading(false)
      }
    }
    if (!userReady) return
    void load()
    return () => {
      cancelled = true
    }
  }, [sessionId, user?.id, userReady])

  const index = selected == null ? null : Number(selected)
  const current = index != null && Number.isInteger(index) ? previews[index] : null

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] flex-col bg-tera-bg text-tera-primary">
      <div className="flex items-center justify-between gap-3 border-b border-tera-border px-4 py-3">
        <Link href={`/new/${sessionId}`} className="text-sm font-medium text-tera-secondary hover:text-tera-primary">
          Back to chat
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tera-secondary">
          {index == null ? 'Live previews' : `Live preview ${index + 1}`}
        </p>
      </div>
      {loading ? (
        <div className="grid flex-1 place-items-center text-sm text-tera-secondary">Loading the preview...</div>
      ) : index == null ? (
        <div className="grid flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-2">
          {previews.length === 0 && <p className="text-sm text-tera-secondary">This chat has no live preview yet.</p>}
          {previews.map((preview, previewIndex) => (
            <Link key={previewIndex} href={`/new/${sessionId}/preview?n=${previewIndex}`} className="overflow-hidden rounded-2xl border border-tera-border bg-white">
              <iframe title={`Preview ${previewIndex + 1}`} sandbox="allow-scripts" srcDoc={preview.srcDoc} className="pointer-events-none h-56 w-full border-0" />
              <p className="bg-tera-bg px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-tera-secondary">Open preview {previewIndex + 1}</p>
            </Link>
          ))}
        </div>
      ) : current ? (
        <iframe title="Live full preview" sandbox="allow-scripts" srcDoc={current.srcDoc} className="min-h-0 w-full flex-1 border-0 bg-white" />
      ) : (
        <div className="grid flex-1 place-items-center text-sm text-tera-secondary">That preview is not in this chat.</div>
      )}
    </div>
  )
}
