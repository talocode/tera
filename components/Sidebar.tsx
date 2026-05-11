'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import UserMenu from './UserMenu'

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
  group?: string
}

export const navigation: NavItem[] = [
  { label: 'New chat', icon: 'chat', href: '/new' },
  { label: 'Search chats', icon: 'search', href: '/history' },
  { label: 'Images', icon: 'images', href: '/images' },
  { label: 'Tools', icon: 'apps', href: '/tools' },
  { label: 'Deep research', icon: 'research', href: '/deep-research' },
  { label: 'Notes', icon: 'notes', href: '/notes' },
  { label: 'Blockchain Lab', icon: 'lab', href: '/lab/blockchain', group: 'Labs' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
]

interface SidebarProps {
  expanded: boolean
  onToggle: () => void
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

const getIcon = (iconName: string): React.ReactNode => {
  const icons: Record<string, () => React.ReactNode> = {
    chat: IconChat,
    search: IconSearch,
    images: IconImages,
    apps: IconApps,
    research: IconResearch,
    notes: IconNotes,
    settings: IconSettings,
    lab: IconLab,
  }
  const Icon = icons[iconName]
  return Icon ? <Icon /> : null
}

export default function Sidebar({ expanded, onToggle, onNewChat, user, onSignOut }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ${expanded ? 'w-[310px] translate-x-0' : '-translate-x-full md:w-[90px] md:translate-x-0'}`}>
      <div className="flex h-full flex-col border-r border-tera-border bg-tera-panel px-3 py-4 text-tera-primary backdrop-blur-xl">
        <div className={`flex items-center ${expanded ? 'justify-between px-1' : 'justify-center'}`}>
          <Link href="/new" className={`flex items-center ${expanded ? 'gap-2' : ''}`} aria-label="Tera home">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]">
              <Image src="/images/TERA_LOGO_ONLY.png" alt="Tera" fill className="hidden object-contain p-2 dark:block" priority />
              <Image src="/images/TERA_LOGO_ONLY1.png" alt="Tera" fill className="object-contain p-2 dark:hidden" priority />
            </div>
          </Link>

          {expanded && (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-tera-secondary transition hover:bg-tera-highlight hover:text-tera-primary"
              aria-label="Collapse sidebar"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 6 12 12" />
                <path d="M18 6 6 18" />
              </svg>
            </button>
          )}

          {!expanded && (
            <button
              type="button"
              onClick={onToggle}
              className="hidden md:inline-flex md:h-10 md:w-10 md:items-center md:justify-center md:rounded-xl md:text-tera-secondary md:transition md:hover:bg-tera-highlight md:hover:text-tera-primary"
              aria-label="Expand sidebar"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-6 flex-1 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1">
            {navigation.map((item, index) => {
              const isNewChat = item.href.startsWith('/new')
              const isActive = isNewChat ? pathname?.startsWith('/new') : pathname === item.href || (item.href.startsWith('/history') && pathname?.startsWith('/history')) || (item.href.startsWith('/tools') && pathname?.startsWith('/tools')) || (item.href.startsWith('/lab') && pathname?.startsWith('/lab'))

              const showGroupLabel = item.group && expanded && (index === 0 || navigation[index - 1].group !== item.group)

              return (
                <React.Fragment key={item.label}>
                  {showGroupLabel && expanded && (
                    <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-tera-secondary">
                      {item.group}
                    </div>
                  )}
                  <Link
                    href={item.href}
                    onClick={(event) => {
                      if (item.label === 'New chat' && pathname?.startsWith('/new') && onNewChat) {
                        event.preventDefault()
                        onNewChat()
                      }
                    }}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? 'bg-tera-highlight text-tera-primary' : 'text-tera-secondary hover:bg-tera-highlight hover:text-tera-primary'} ${expanded ? '' : 'justify-center md:px-2'}`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">{getIcon(item.icon)}</span>
                    {expanded && <span className="font-medium">{item.label}</span>}
                  </Link>
                </React.Fragment>
              )
            })}
          </nav>
        </div>

        <div className="mt-3 border-t border-tera-border pt-3">
          <UserMenu user={user || null} expanded={expanded} onSignOut={onSignOut || (() => {})} />
        </div>
      </div>
    </aside>
  )
}
