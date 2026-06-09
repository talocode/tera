'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type QuickAction = {
  label: string
  description: string
  href: string
  keywords: string[]
}

const quickActions: QuickAction[] = [
  { label: 'New chat', description: 'Start a fresh session', href: '/new', keywords: ['new', 'chat', 'session', 'start'] },
  { label: 'Continue later', description: 'Open your queue and reminders', href: '/queue', keywords: ['queue', 'later', 'reminder', 'continue'] },
  { label: 'Workspace search', description: 'Search chats, notes, memories, and workflows', href: '/search', keywords: ['search', 'find', 'workspace', 'everything'] },
  { label: 'Bookmarks', description: 'Review saved research sources', href: '/bookmarks', keywords: ['bookmarks', 'sources', 'research', 'saved'] },
  { label: 'Notes', description: 'View and edit saved notes', href: '/notes', keywords: ['notes', 'note', 'memo'] },
  { label: 'Deep research', description: 'Use web-backed research mode', href: '/deep-research', keywords: ['research', 'web', 'sources', 'deep'] },
  { label: 'Study assistant', description: 'Open the study assistant page', href: '/ai-study-assistant', keywords: ['study', 'assistant', 'learn'] },
  { label: 'Research assistant', description: 'Open the research assistant page', href: '/ai-research-assistant', keywords: ['research', 'assistant', 'source'] },
  { label: 'Skills', description: 'Browse available tools and skills', href: '/skills', keywords: ['skills', 'tools', 'apps'] },
  { label: 'Profile', description: 'Review memories, workflows, and usage', href: '/profile', keywords: ['profile', 'usage', 'memories', 'workflows'] },
  { label: 'Settings', description: 'Adjust reminders and account preferences', href: '/settings', keywords: ['settings', 'preferences', 'account'] },
  { label: 'Pricing', description: 'Review plans and credit top-ups', href: '/pricing', keywords: ['pricing', 'billing', 'credits', 'upgrade'] },
]

export default function QuickSwitcher() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const isShortcut = (event.metaKey || event.ctrlKey) && key === 'k'

      if (isShortcut) {
        event.preventDefault()
        setOpen((current) => !current)
      }

      if (key === 'escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onRouteChange = () => setOpen(false)
    window.addEventListener('popstate', onRouteChange)
    return () => window.removeEventListener('popstate', onRouteChange)
  }, [open])

  const visibleActions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return quickActions

    return quickActions.filter((action) => {
      const haystack = [action.label, action.description, ...action.keywords].join(' ').toLowerCase()
      return haystack.includes(normalized)
    })
  }, [query])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-40 flex rounded-full border border-tera-border bg-tera-panel/90 px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-tera-secondary shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:-translate-y-px hover:border-tera-primary hover:text-tera-primary md:bottom-4 md:right-4"
      >
        Quick switch
        <span className="ml-3 rounded-full border border-tera-border bg-white/[0.03] px-2 py-1 text-[0.55rem] tracking-[0.12em] text-tera-secondary">
          ⌘K
        </span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/65 px-4 py-24 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close quick switcher" onClick={() => setOpen(false)} />
      <div className="tera-surface relative z-10 w-full max-w-2xl p-4">
        <div className="flex items-center gap-3 rounded-[20px] border border-tera-border bg-black/20 px-4 py-3">
          <svg className="h-5 w-5 shrink-0 text-tera-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, actions, or workspace sections"
            className="w-full bg-transparent text-sm text-tera-primary outline-none placeholder:text-tera-secondary"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-tera-border px-3 py-1 text-[0.6rem] uppercase tracking-[0.22em] text-tera-secondary transition hover:border-tera-primary hover:text-tera-primary"
          >
            Esc
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between px-1">
          <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">
            {pathname === '/' ? 'Home' : pathname?.replace('/', '') || 'Workspace'}
          </p>
          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-tera-secondary">
            {visibleActions.length} result{visibleActions.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {visibleActions.length === 0 ? (
            <div className="tera-card-subtle px-4 py-5 text-sm text-tera-secondary">
              No matching actions. Try “research”, “notes”, or “queue”.
            </div>
          ) : (
            visibleActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setOpen(false)}
                className="block rounded-[20px] border border-tera-border bg-white/[0.03] px-4 py-4 transition hover:-translate-y-px hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-tera-primary">{action.label}</p>
                    <p className="mt-1 text-sm text-tera-secondary">{action.description}</p>
                  </div>
                  <span className="rounded-full border border-tera-border px-2 py-1 text-[0.55rem] uppercase tracking-[0.18em] text-tera-secondary">
                    Open
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
