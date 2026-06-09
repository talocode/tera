'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

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
  { label: 'Profile', href: '/profile' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Settings', href: '/settings' },
  { label: 'About', href: '/about' },
]

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
        <Link href="/auth/signin" className="tera-button-secondary justify-center rounded-[20px] px-3 py-3 text-sm">
          Log in
        </Link>
        <Link href="/auth/signup" className="tera-button-primary justify-center rounded-[20px] px-3 py-3 text-sm">
          Sign up
        </Link>
      </div>
    ) : (
      <div className="flex justify-center">
        <Link href="/auth/signin" className="tera-icon-button h-12 w-12 rounded-[18px]" title="Log in">
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
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const plan = user.user_metadata?.plan || user.user_metadata?.subscription_plan || 'Free'

  return (
    <div className="relative" ref={dropdownRef}>
      {dropdownOpen && (
        <div className={`absolute bottom-full mb-3 w-[292px] overflow-hidden rounded-[26px] border border-tera-border bg-tera-elevated/96 shadow-panel backdrop-blur-xl ${expanded ? 'left-0' : 'left-1/2 -translate-x-1/2'}`}>
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-tera-border bg-tera-highlight text-sm font-semibold text-tera-primary shadow-soft">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-tera-primary">{name}</p>
                <p className="truncate text-xs text-tera-secondary">{email}</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="tera-card-subtle px-4 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">Current plan</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-tera-primary">{plan}</p>
                <Link href="/pricing" className="tera-button-upgrade rounded-full px-3 py-2 text-xs">
                  Upgrade
                </Link>
              </div>
            </div>
          </div>

          <div className="px-2 py-2">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-[18px] px-3 py-3 text-sm text-tera-primary transition hover:bg-tera-highlight"
                onClick={() => setDropdownOpen(false)}
              >
                <span>{item.label}</span>
                <svg className="h-4 w-4 text-tera-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>

          <div className="px-2 py-2">
            <button
              type="button"
              onClick={() => {
                onSignOut()
                setDropdownOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/10"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 7h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3" />
                <path d="M10 17 15 12 10 7" />
                <path d="M15 12H4" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setDropdownOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-[22px] border border-tera-border bg-tera-muted px-3 py-3 text-left transition hover:bg-tera-highlight ${expanded ? '' : 'justify-center'}`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-tera-border bg-tera-highlight text-sm font-semibold text-tera-primary shadow-soft">
          {initials}
        </div>

        {expanded && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-tera-primary">{name}</p>
              <p className="truncate text-xs text-tera-secondary">{plan} plan</p>
            </div>
            <svg className={`h-4 w-4 shrink-0 text-tera-secondary transition ${dropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}
