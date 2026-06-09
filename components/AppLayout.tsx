'use client'

import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import { useAuth } from './AuthProvider'
import QuickSwitcher from './QuickSwitcher'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { user, signOut } = useAuth()
  const sidebarExpanded = sidebarPinned || sidebarHovered

  const handleNewChat = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/new'
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full bg-transparent text-tera-primary">
      <Sidebar
        pinned={sidebarPinned}
        mobileOpen={mobileNavOpen}
        onTogglePin={() => setSidebarPinned((current) => !current)}
        onHoverChange={setSidebarHovered}
        onCloseMobile={() => setMobileNavOpen(false)}
        onNewChat={handleNewChat}
        user={user}
        onSignOut={signOut}
      />

      <main className={`relative flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ${sidebarExpanded ? 'md:pl-[240px]' : 'md:pl-[68px]'}`}>
        <div className="pointer-events-none sticky top-0 z-30 border-b border-tera-border bg-[#050505]/88 shadow-[0_1px_0_rgba(255,255,255,0.05),0_14px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <button
              type="button"
            className="tera-icon-button pointer-events-auto h-11 w-11 rounded-2xl border-0 bg-transparent"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h10" />
              </svg>
            </button>
            <div className="pointer-events-none" />
            <button
              type="button"
            className="tera-icon-button pointer-events-auto h-11 w-11 rounded-2xl border-0 bg-transparent text-tera-primary"
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
      <QuickSwitcher />
    </div>
  )
}
