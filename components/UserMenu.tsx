'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

interface UserMenuProps {
  user: User | null
  expanded: boolean
  onSignOut: () => void
}

const menuItems = [
  { label: 'Profile', href: '/profile', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
  { label: 'Pricing', href: '/pricing', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  { label: 'Settings', href: '/settings', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg> },
  { label: 'About', href: '/about', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> },
]

function UserAvatar({ src, name, size = 'md' }: { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs rounded-[12px]',
    md: 'h-10 w-10 text-sm rounded-[14px]',
    lg: 'h-11 w-11 text-sm rounded-[16px]',
  }

  if (src) {
    return (
      <div className={`${sizeClasses[size]} relative shrink-0 overflow-hidden border border-tera-border shadow-soft`}>
        <Image src={src} alt={name} fill className="object-cover" sizes="44px" />
      </div>
    )
  }

  return (
    <div className={`flex ${sizeClasses[size]} shrink-0 items-center justify-center border border-tera-border bg-gradient-to-br from-tera-neon/20 to-tera-primary/20 font-semibold text-tera-primary shadow-soft`}>
      {initials}
    </div>
  )
}

export default function UserMenu({ user, expanded, onSignOut }: UserMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  if (!user) {
    return expanded ? (
      <div className="grid grid-cols-2 gap-2">
        <Link href="/auth/signin" className="tera-button-secondary justify-center rounded-[16px] px-3 py-2.5 text-[13px] font-medium">
          Log in
        </Link>
        <Link href="/auth/signup" className="tera-button-primary justify-center rounded-[16px] px-3 py-2.5 text-[13px] font-medium">
          Sign up
        </Link>
      </div>
    ) : (
      <div className="flex justify-center">
        <Link href="/auth/signin" className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-tera-border bg-tera-muted text-tera-secondary transition hover:bg-tera-highlight hover:text-tera-primary" title="Log in">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 7h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3" />
            <path d="M10 17 15 12 10 7" />
            <path d="M15 12H4" />
          </svg>
        </Link>
      </div>
    )
  }

  const email = user.email || ''
  const name = user.user_metadata?.full_name || (email ? email.split('@')[0] : '') || user.name || 'User'
  const plan = user.user_metadata?.plan || user.user_metadata?.subscription_plan || 'free'
  const profileImage = user.image || null

  return (
    <div className="relative" ref={dropdownRef}>
      {dropdownOpen && (
        <div className="absolute bottom-full mb-2 w-full overflow-hidden rounded-[20px] border border-tera-border bg-tera-elevated/98 shadow-panel backdrop-blur-xl z-50">
          <div className="px-3 py-3">
            <div className="flex items-center gap-3">
              <UserAvatar src={profileImage} name={name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-tera-primary">{name}</p>
                <p className="truncate text-[11px] text-tera-secondary">{email}</p>
              </div>
            </div>
          </div>

          <div className="mx-3 mb-1 rounded-[14px] border border-tera-border/50 bg-tera-muted/50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-tera-secondary/60">Plan</p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[13px] font-medium capitalize text-tera-primary">{plan}</span>
              <Link href="/pricing" className="rounded-full bg-tera-neon/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-tera-neon transition hover:bg-tera-neon/20">
                Upgrade
              </Link>
            </div>
          </div>

          <div className="px-2 py-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-[13px] text-tera-primary transition hover:bg-tera-highlight"
                onClick={() => setDropdownOpen(false)}
              >
                <span className="text-tera-secondary">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="mx-2 mb-2 mt-1 border-t border-tera-border/40 pt-1">
            <button
              type="button"
              onClick={() => {
                onSignOut()
                setDropdownOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left text-[13px] text-red-400 transition hover:bg-red-500/10"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setDropdownOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-[16px] border border-tera-border bg-tera-muted/60 text-left transition hover:bg-tera-highlight ${expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'}`}
      >
        <UserAvatar src={profileImage} name={name} size="md" />

        {expanded && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-tera-primary">{name}</p>
              <p className="truncate text-[11px] text-tera-secondary capitalize">{plan} plan</p>
            </div>
            <svg className={`h-4 w-4 shrink-0 text-tera-secondary transition duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}
