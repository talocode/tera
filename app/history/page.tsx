'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { fetchHistoryPageData } from '@/app/actions/user'
import { createSavedWorkflow, loadSavedWorkflows, persistSavedWorkflows, type SavedWorkflow } from '@/lib/saved-workflows'
import { loadContinueLaterQueue, pinContinueLaterItem, setContinueLaterReminder, unpinContinueLaterItem } from '@/lib/continue-later'

type Tab = 'history' | 'bookmarks' | 'notes'

interface ChatSession {
  id?: string
  title?: string | null
  created_at: string
  session_id: string
  last_message?: string | null
  tool?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildExportRows(conversations: ChatSession[]) {
  return conversations.map((conversation) => ({
    sessionId: conversation.session_id,
    title: conversation.title || 'Untitled chat',
    message: conversation.last_message || '',
    tool: conversation.tool || 'Chat',
    date: new Date(conversation.created_at).toLocaleString(),
  }))
}

function buildExportTable(rows: ReturnType<typeof buildExportRows>) {
  return `
    <table>
      <thead>
        <tr>
          <th>Session</th>
          <th>Title</th>
          <th>Tool</th>
          <th>Message</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${escapeHtml(row.sessionId)}</td>
            <td>${escapeHtml(row.title)}</td>
            <td>${escapeHtml(row.tool)}</td>
            <td>${escapeHtml(row.message)}</td>
            <td>${escapeHtml(row.date)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([])
  const [savedWorkflowSessionId, setSavedWorkflowSessionId] = useState<string | null>(null)
  const [savedWorkflowsLoaded, setSavedWorkflowsLoaded] = useState(false)
  const [pinnedMap, setPinnedMap] = useState<Record<string, true>>({})
  const [activeTab, setActiveTab] = useState<Tab>('history')
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(false)
  const [notes, setNotes] = useState<any[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const pageSize = 25

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setConversations([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const result = await fetchHistoryPageData(user.id, page, pageSize, searchQuery)
      setConversations(result.sessions)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Unexpected error loading history:', error)
      setConversations([])
    }

    setLoading(false)
  }, [page, pageSize, searchQuery, user])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    setSavedWorkflows(loadSavedWorkflows())
    setSavedWorkflowsLoaded(true)
  }, [])

  useEffect(() => {
    const queue = loadContinueLaterQueue()
    setPinnedMap(Object.fromEntries(queue.map((item) => [`${item.kind}:${item.id}`, true])) as Record<string, true>)
  }, [])

  useEffect(() => {
    if (!savedWorkflowsLoaded) return
    persistSavedWorkflows(savedWorkflows)
  }, [savedWorkflows, savedWorkflowsLoaded])

  useEffect(() => {
    if (activeTab !== 'bookmarks' || !user) return
    setBookmarksLoading(true)
    fetch('/api/user/bookmarks', { headers: { 'x-user-id': user.id } })
      .then((r) => r.json())
      .then((data) => { setBookmarks(data?.bookmarks || []); setBookmarksLoading(false) })
      .catch(() => setBookmarksLoading(false))
  }, [activeTab, user])

  useEffect(() => {
    if (activeTab !== 'notes' || !user) return
    setNotesLoading(true)
    fetch('/api/user/notes', { headers: { 'x-user-id': user.id } })
      .then((r) => r.json())
      .then((data) => { setNotes(data?.notes || []); setNotesLoading(false) })
      .catch(() => setNotesLoading(false))
  }, [activeTab, user])

  const handleExportJson = () => {
    const data = buildExportRows(conversations)

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `tera-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleExportWord = () => {
    const rows = buildExportRows(conversations)
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Tera history export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 24px; margin: 0 0 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; vertical-align: top; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Tera chat history</h1>
          ${buildExportTable(rows)}
        </body>
      </html>
    `

    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `tera-history-${new Date().toISOString().split('T')[0]}.doc`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = () => {
    const rows = buildExportRows(conversations)
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900')

    if (!printWindow) {
      alert('Popup blocked. Allow popups to export PDF.')
      return
    }

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Tera history export</title>
          <style>
            @page { margin: 18mm; }
            body { font-family: Arial, sans-serif; padding: 0; color: #111; }
            h1 { font-size: 24px; margin: 0 0 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; vertical-align: top; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Tera chat history</h1>
          ${buildExportTable(rows)}
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  const handleSaveWorkflow = (conversation: ChatSession) => {
    const workflow = createSavedWorkflow(
      conversation.title || `Workflow from ${conversation.tool || 'chat'}`,
      conversation.last_message || conversation.title || '',
    )

    setSavedWorkflowSessionId(conversation.session_id)
    setSavedWorkflows((current) => [
      workflow,
      ...current.filter((item) => item.prompt !== workflow.prompt || item.name !== workflow.name),
    ])

    window.setTimeout(() => {
      setSavedWorkflowSessionId((current) => (current === conversation.session_id ? null : current))
    }, 1200)
  }

  const handlePinConversation = (conversation: ChatSession) => {
    const key = `chat:${conversation.session_id}`
    const isPinned = !!pinnedMap[key]

    if (isPinned) {
      const next = unpinContinueLaterItem('chat', conversation.session_id)
      setPinnedMap(Object.fromEntries(next.map((item) => [`${item.kind}:${item.id}`, true])) as Record<string, true>)
      return
    }

    const next = pinContinueLaterItem({
      id: conversation.session_id,
      kind: 'chat',
      title: conversation.title || 'Untitled chat',
      excerpt: conversation.last_message || 'Continue this conversation.',
      href: `/new/${conversation.session_id}`,
      timestamp: conversation.created_at,
    })
    setPinnedMap(Object.fromEntries(next.map((item) => [`${item.kind}:${item.id}`, true])) as Record<string, true>)
  }

  const handleReminder = (conversation: ChatSession, days: number) => {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + days)
    dueDate.setHours(9, 0, 0, 0)

    setContinueLaterReminder(
      {
        id: conversation.session_id,
        kind: 'chat',
        title: conversation.title || 'Untitled chat',
        excerpt: conversation.last_message || 'Continue this conversation.',
        href: `/new/${conversation.session_id}`,
        timestamp: conversation.created_at,
      },
      dueDate.toISOString(),
    )
  }

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-20 md:pt-10">
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Workspace</p>
            <h1 className="tera-title mt-3">History</h1>
            <p className="tera-subtitle mt-4">Browse chat history, bookmarks, and saved notes in one place.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {([
            { id: 'history' as Tab, label: 'Chats' },
            { id: 'bookmarks' as Tab, label: 'Bookmarks' },
            { id: 'notes' as Tab, label: 'Notes' },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white/[0.08] text-tera-primary' : 'text-tera-secondary hover:text-tera-primary'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tera-surface mt-8 flex min-h-[60vh] flex-col p-6 md:p-8">
          {activeTab === 'history' && (
            <>
              <div className="flex items-center justify-between gap-4 pb-5">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">Sessions</p>
                  <h2 className="mt-2 text-xl font-semibold text-tera-primary">Your recent conversations</h2>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                    className="tera-input h-9 min-w-[14rem]"
                  />
                  <button type="button" onClick={handleExportJson} className="tera-button-secondary text-xs">JSON</button>
                  <button type="button" onClick={handleExportWord} className="tera-button-secondary text-xs">Word</button>
                </div>
              </div>

              <div className="custom-scrollbar mt-6 flex-1 space-y-4 overflow-y-auto pr-2">
                {loading && <p className="text-sm text-tera-secondary">Loading history...</p>}
                {!loading && !user && <p className="text-sm text-tera-secondary">Sign in to view your history.</p>}
                {!loading && user && conversations.length === 0 && <p className="text-sm text-tera-secondary">No conversations found.</p>}
                {conversations.map((conversation, index) => (
                  <div
                    key={`${conversation.session_id}-${conversation.created_at}-${index}`}
                    className="tera-card-subtle p-5 transition-transform duration-200 hover:-translate-y-px hover:bg-white/[0.06]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">{conversation.tool || 'Chat'}</p>
                        <p className="mt-2 truncate text-base font-medium text-tera-primary">{conversation.title || 'Untitled chat'}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-tera-secondary">{conversation.last_message}</p>
                      </div>
                      <p className="shrink-0 text-xs uppercase tracking-[0.22em] text-tera-secondary">
                        {new Date(conversation.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link href={`/new/${conversation.session_id}`} className="tera-button-primary">Open</Link>
                      <button type="button" onClick={() => handlePinConversation(conversation)} className="tera-button-secondary">
                        {pinnedMap[`chat:${conversation.session_id}`] ? 'Pinned' : 'Pin for later'}
                      </button>
                      <button type="button" onClick={() => handleSaveWorkflow(conversation)} className="tera-button-secondary">
                        {savedWorkflowSessionId === conversation.session_id ? 'Saved' : 'Save workflow'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between pt-5">
                <button type="button" onClick={() => setPage((c) => Math.max(1, c - 1))} disabled={page === 1 || loading} className="tera-button-secondary disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <button type="button" onClick={() => setPage((c) => c + 1)} disabled={!hasMore || loading} className="tera-button-secondary disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>
            </>
          )}

          {activeTab === 'bookmarks' && (
            <div className="flex-1">
              <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">Bookmarks</p>
              <h2 className="mt-2 text-xl font-semibold text-tera-primary">Saved bookmarks</h2>
              <div className="mt-6 space-y-4">
                {bookmarksLoading ? (
                  <p className="text-sm text-tera-secondary">Loading bookmarks...</p>
                ) : bookmarks.length === 0 ? (
                  <p className="text-sm text-tera-secondary">No bookmarks yet. Save bookmarks from chat responses.</p>
                ) : (
                  bookmarks.map((b: any) => (
                    <div key={b.id} className="tera-card-subtle p-5">
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-tera-primary hover:underline">{b.title}</a>
                      {b.snippet && <p className="mt-2 text-sm text-tera-secondary line-clamp-2">{b.snippet}</p>}
                      <p className="mt-2 text-[0.62rem] uppercase tracking-[0.22em] text-tera-secondary">{new Date(b.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="flex-1">
              <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">Notes</p>
              <h2 className="mt-2 text-xl font-semibold text-tera-primary">Saved notes</h2>
              <div className="mt-6 space-y-4">
                {notesLoading ? (
                  <p className="text-sm text-tera-secondary">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-tera-secondary">No notes yet. Save notes from chat responses.</p>
                ) : (
                  notes.map((n: any) => (
                    <div key={n.id} className="tera-card-subtle p-5">
                      <p className="text-sm leading-7 text-tera-primary whitespace-pre-wrap">{n.content || n.note_text}</p>
                      <p className="mt-2 text-[0.62rem] uppercase tracking-[0.22em] text-tera-secondary">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
