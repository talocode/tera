'use client'

import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import { useAuth } from './AuthProvider'
import { useTheme } from './ThemeProvider'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { user, signOut, userReady } = useAuth()
  const { theme } = useTheme()
  const sidebarVisible = sidebarPinned || sidebarHovered

  const handleNewChat = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/new'
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full bg-transparent text-tera-primary">
      {!sidebarPinned && (
        <div
          className="fixed inset-y-0 left-0 z-40 hidden w-2 md:block"
          onMouseEnter={() => setSidebarHovered(true)}
        />
      )}
      <Sidebar
        pinned={sidebarPinned}
        visible={sidebarVisible}
        mobileOpen={mobileNavOpen}
        onTogglePin={() => setSidebarPinned((current) => !current)}
        onHoverChange={setSidebarHovered}
        onCloseMobile={() => setMobileNavOpen(false)}
        onNewChat={handleNewChat}
        user={user}
        userReady={userReady}
        onSignOut={signOut}
      />

      <main className={`relative flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out ${sidebarPinned ? 'md:pl-[240px]' : 'md:pl-0'}`}>
        <div className="pointer-events-none sticky top-0 z-[70] bg-tera-bg/70 backdrop-blur-xl">
          <div className="flex items-center justify-between px-3 py-2.5">
            <button
              type="button"
              className={`pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-tera-border text-tera-secondary transition-colors hover:bg-tera-highlight hover:text-tera-primary ${sidebarPinned ? 'bg-tera-highlight text-tera-primary' : ''}`}
              onClick={() => {
                if (window.matchMedia('(max-width: 767px)').matches) {
                  setMobileNavOpen(true)
                  return
                }
                setSidebarPinned((current) => !current)
                setSidebarHovered(false)
              }}
              aria-pressed={sidebarPinned}
              aria-label={sidebarPinned ? 'Hide menu' : 'Show menu'}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {sidebarPinned ? (
                  <>
                    <path d="M6 6l12 12" />
                    <path d="M18 6 6 18" />
                  </>
                ) : (
                  <>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h10" />
                  </>
                )}
              </svg>
            </button>
            <a href="/" className={`pointer-events-auto grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-tera-border md:hidden ${theme === 'light' ? 'bg-white' : 'bg-[#0a0a0a]'}`} aria-label="Tera home">
              <img src="/images/TERA_LOGO_ONLY.png" alt="" className={`h-5 w-5 object-contain ${theme === 'light' ? '' : 'invert'}`} />
            </a>
            <button
              type="button"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-tera-secondary transition-colors hover:bg-tera-highlight hover:text-tera-primary md:hidden"
              onClick={handleNewChat}
              title="Start new chat"
              aria-label="Start new chat"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-[100dvh]">{children}</div>
      </main>
    </div>
  )
}
