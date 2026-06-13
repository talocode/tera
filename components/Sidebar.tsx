'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import UserMenu from './UserMenu'
import { fetchUserSessions } from '@/app/actions/user'
import { useTheme } from './ThemeProvider'

type User = {
  id: string
  email?: string | null
  user_metadata?: {
    full_name?: string
    plan?: string
    subscription_plan?: string
    [key: string]: any
  } | null
  name?: string | null
  image?: string | null
}

type NavItem = {
  label: string
  icon: string
  href: string
}

type ChatSession = {
  session_id: string
  title: string | null
  created_at: string
  prompt: string
}

export const navigation: NavItem[] = [
  { label: 'New chat', icon: 'chat', href: '/new' },
  { label: 'Search', icon: 'search', href: '/search' },
  { label: 'Images', icon: 'images', href: '/images' },
  { label: 'Skills', icon: 'apps', href: '/skills' },
  { label: 'Blockchain Lab', icon: 'lab', href: '/lab/blockchain' },
  { label: 'Usage', icon: 'usage', href: '/settings/usage' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
]

interface SidebarProps {
  pinned: boolean
  mobileOpen?: boolean
  onTogglePin: () => void
  onHoverChange?: (hovered: boolean) => void
  onCloseMobile?: () => void
  onNewChat?: () => void
  user?: User | null
  onSignOut?: () => void
}

const IconChat = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
)

const IconSearch = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

const IconBookmark = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4.5h12a1.5 1.5 0 0 1 1.5 1.5v14l-7.5-4.25L4.5 20V6A1.5 1.5 0 0 1 6 4.5Z" />
  </svg>
)

const IconQueue = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v5l3 2" />
    <circle cx="12" cy="12" r="8" />
  </svg>
)

const IconImages = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.75" y="4.5" width="16.5" height="15" rx="2.5" />
    <path d="m7.5 14.5 2.8-2.8a1.4 1.4 0 0 1 2 0l4.2 4.2" />
    <circle cx="9" cy="9" r="1" />
  </svg>
)

const IconApps = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="2" />
    <circle cx="17" cy="7" r="2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
)

const IconResearch = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4 8.5 9.5 3 12l5.5 2.5L11 20l2.5-5.5L19 12l-5.5-2.5L11 4Z" />
    <path d="M18.5 4.5 19.5 7l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
  </svg>
)

const IconNotes = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 4.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1.5-1.5Z" />
    <path d="M14 4.5V9h4" />
  </svg>
)

const IconSettings = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.75 14 5l2.4-.35 1.15 2.15 2.1 1.2-.35 2.4L20.25 12l-.95 1.6.35 2.4-2.1 1.2-1.15 2.15L14 19l-2 1.25L10 19l-2.4.35-1.15-2.15-2.1-1.2.35-2.4L3.75 12l.95-1.6-.35-2.4 2.1-1.2L7.6 4.65 10 5l2-1.25Z" />
    <circle cx="12" cy="12" r="3.1" />
  </svg>
)

const IconLab = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const IconUsage = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V10" />
    <path d="M18 20V4" />
    <path d="M6 20v-4" />
  </svg>
)

const IconMessage = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const getIcon = (iconName: string): React.ReactNode => {
  const icons: Record<string, () => React.ReactNode> = {
    chat: IconChat,
    search: IconSearch,
    images: IconImages,
    apps: IconApps,
    settings: IconSettings,
    lab: IconLab,
    usage: IconUsage,
  }
  const Icon = icons[iconName]
  return Icon ? <Icon /> : null
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Sidebar({ pinned, mobileOpen = false, onTogglePin, onHoverChange, onCloseMobile, onNewChat, user, onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const expanded = pinned || mobileOpen
  const { theme } = useTheme()
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadChatHistory = useCallback(async () => {
    if (!user?.id) return
    setHistoryLoading(true)
    try {
      const sessions = await fetchUserSessions(user.id, 15)
      setChatHistory(sessions)
    } catch (err) {
      console.error('Failed to load sidebar chat history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadChatHistory()
  }, [loadChatHistory])

  useEffect(() => {
    const handleRefresh = () => loadChatHistory()
    window.addEventListener('tera:usage-refresh', handleRefresh)
    return () => window.removeEventListener('tera:usage-refresh', handleRefresh)
  }, [loadChatHistory])

  return (
    <>
      {mobileOpen && onCloseMobile && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={[
          'group fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-hidden border-r border-tera-border bg-tera-bg text-tera-primary transition-[width,transform] duration-150 ease-out',
          mobileOpen ? 'translate-x-0 w-[286px]' : '-translate-x-full md:translate-x-0',
          expanded ? 'md:w-[240px]' : 'md:w-[68px] md:hover:w-[240px]',
        ].join(' ')}
        onMouseEnter={() => {
          if (!pinned && !mobileOpen) {
            onHoverChange?.(true)
          }
        }}
        onMouseLeave={() => {
          if (!pinned && !mobileOpen) {
            onHoverChange?.(false)
          }
        }}
      >
        <div className="flex h-full flex-col px-3 py-4">
          {/* Logo */}
          <div className="flex items-center justify-center md:justify-start">
            <button
              type="button"
              onClick={onTogglePin}
              className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-tera-border bg-tera-panel/90 shadow-soft transition-all duration-200 hover:-translate-y-px hover:bg-tera-highlight"
              aria-label={pinned ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <div className="relative h-6 w-6">
                <Image src={theme === 'light' ? '/images/TERA_LOGO_ONLY1.png' : '/images/TERA_LOGO_ONLY.png'} alt="Tera" fill className="object-contain" priority />
              </div>
            </button>
          </div>

          {/* Nav */}
          <nav className="mt-6 flex flex-col gap-0.5">
            {navigation.map((item) => {
              const isNewChat = item.href.startsWith('/new')
              const isActive = isNewChat
                ? pathname?.startsWith('/new')
                : pathname === item.href || (item.href.startsWith('/search') && pathname?.startsWith('/search')) || (item.href.startsWith('/skills') && pathname?.startsWith('/skills')) || (item.href.startsWith('/lab') && pathname?.startsWith('/lab')) || (item.href.startsWith('/settings/usage') && pathname?.startsWith('/settings/usage'))

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                    if (item.label === 'New chat' && pathname?.startsWith('/new') && onNewChat) {
                      event.preventDefault()
                      onNewChat()
                    }
                    if (mobileOpen && onCloseMobile) {
                      onCloseMobile()
                    }
                  }}
                  title={item.label}
                  className={[
                    'flex h-[44px] items-center gap-3 rounded-[14px] px-3 text-[13px] font-medium tracking-[-0.01em] transition-all duration-150',
                    isActive
                      ? 'bg-tera-primary text-tera-bg shadow-soft'
                      : 'text-tera-secondary hover:bg-tera-panel/70 hover:text-tera-primary',
                  ].join(' ')}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">{getIcon(item.icon)}</span>
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className={[
                      'whitespace-nowrap text-[13px] transition-all duration-200',
                      expanded ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100',
                    ].join(' ')}
                    >
                      {item.label}
                    </span>
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* Chat History */}
          {user?.id && (
            <div className="mt-4 flex flex-1 flex-col min-h-0">
              <div className={[
                'flex items-center gap-2 px-3 mb-2 transition-all duration-200',
                expanded ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100',
              ].join(' ')}>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-tera-secondary/60">Recent Chats</span>
                {historyLoading && <div className="h-3 w-3 animate-spin rounded-full border border-tera-secondary border-t-transparent" />}
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-0.5 scrollbar-thin">
                {chatHistory.map((session) => {
                  const isActive = pathname === `/new/${session.session_id}`
                  const title = session.title || session.prompt?.slice(0, 40) || 'New chat'
                  return (
                    <Link
                      key={session.session_id}
                      href={`/new/${session.session_id}`}
                      onClick={() => { if (mobileOpen && onCloseMobile) onCloseMobile() }}
                      className={[
                        'flex items-center gap-2.5 rounded-[12px] px-3 py-2 text-[12.5px] transition-all duration-150 group/item',
                        isActive
                          ? 'bg-tera-panel text-tera-primary'
                          : 'text-tera-secondary hover:bg-tera-panel/50 hover:text-tera-primary',
                      ].join(' ')}
                      title={title}
                    >
                      <span className="shrink-0 text-tera-secondary/50 group-hover/item:text-tera-secondary">
                        <IconMessage />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{title}</span>
                      <span className="shrink-0 text-[10px] text-tera-secondary/40 tabular-nums">
                        {formatRelativeTime(session.created_at)}
                      </span>
                    </Link>
                  )
                })}
                {!historyLoading && chatHistory.length === 0 && (
                  <p className="px-3 py-2 text-[11.5px] text-tera-secondary/40 italic">No chats yet</p>
                )}
              </div>
            </div>
          )}

          {/* Bottom: User */}
          <div className="pt-3 border-t border-tera-border/50 mt-2">
            <UserMenu user={user || null} expanded={expanded} onSignOut={onSignOut || (() => {})} />
          </div>
        </div>
      </aside>
    </>
  )
}
