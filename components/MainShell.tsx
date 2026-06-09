"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar, { navigation } from './Sidebar'
import PromptShell from './PromptShell'
import type { TeacherTool } from './ToolCard'
import { teacherTools, studentTools, learnerTools, UniversalTool, slugify } from '@/lib/tools-data'
import { signIn } from 'next-auth/react'
import { useAuth } from './AuthProvider'
import { useSearchParams, usePathname } from 'next/navigation'

function MainShellContent() {
  const router = useRouter()
  const [selectedTool, setSelectedTool] = useState<TeacherTool>(UniversalTool)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [authDialog, setAuthDialog] = useState<'signIn' | 'signUp' | null>(null)

  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlSessionId = searchParams?.get('sessionId')
  const urlTool = searchParams?.get('tool')
  const isToolsRoute = pathname?.startsWith('/tools')
  const { user, loading, signOut, userReady } = useAuth()

  const [sessionId, setSessionId] = useState<string | null>(urlSessionId || null)
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined)

  // Sync with URL
  useEffect(() => {
    if (urlSessionId) {
      setSessionId(urlSessionId)
    }
  }, [urlSessionId])

  // Handle Tool Selection from URL
  useEffect(() => {
    if (urlTool) {
      const toolSlug = urlTool.toLowerCase()
      const allTools = [...teacherTools, ...studentTools, ...learnerTools]
      const foundTool = allTools.find(t => slugify(t.name) === toolSlug)

      if (foundTool) {
        setSelectedTool(foundTool)
        setInitialPrompt(`Using ${foundTool.name}: `)
      }
    }
  }, [urlTool])

  const handleNewChat = () => {
    setSessionId(crypto.randomUUID())
    // Optional: Clear URL param
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('sessionId')
      window.history.pushState({}, '', url)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    try {
      const callbackUrl = `${window.location.origin}/new`; await signIn('google', { callbackUrl })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in with Google'
      setAuthMessage(message)
    } finally {
      setAuthLoading(false)
    }
  }

  return (

    <>
      <div className="relative flex w-full flex-col">

        <PromptShell
          key={sessionId}
          sessionId={sessionId}
          tool={selectedTool}
          onToolChange={setSelectedTool}
          user={user}
          userReady={userReady}
          onRequireSignIn={() => setAuthDialog('signIn')}
          initialPrompt={initialPrompt}
        />
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2 md:flex-row md:items-center">
          {user ? (
            <>
              <button
                type="button"
                className="rounded-full bg-tera-primary px-3 py-1 text-[0.5rem] font-semibold uppercase tracking-[0.4em] text-tera-bg transition hover:opacity-90 md:hidden"
                onClick={signOut}
              >
                Sign out
              </button>
              <button
                type="button"
                className="hidden rounded-full bg-tera-primary px-3 py-1 text-[0.5rem] font-semibold uppercase tracking-[0.4em] text-tera-bg transition hover:opacity-90 md:block md:px-4 md:py-2 md:text-xs"
                onClick={signOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="rounded-full bg-tera-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-tera-bg transition hover:opacity-90 md:hidden"
                onClick={() => router.push('/auth/signin')}
              >
                Log In
              </button>
              <div className="hidden md:flex md:items-center md:gap-2">
                <button
                  type="button"
                  className="rounded-full bg-tera-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-tera-bg transition hover:opacity-90"
                  onClick={() => router.push('/auth/signin')}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className="rounded-full bg-tera-primary px-3 py-1 text-[0.5rem] font-semibold uppercase tracking-[0.4em] text-tera-bg transition hover:opacity-90 md:px-4 md:py-2 md:text-xs"
                  onClick={() => router.push('/auth/signup')}
                >
                  Sign up
                </button>
              </div>
            </>
          )}
        </div>
        {authDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAuthDialog(null)} />
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-tera-border bg-tera-panel p-6 shadow-panel">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-tera-secondary">
                <span>{authDialog === 'signIn' ? 'Log In' : 'Sign Up'}</span>
                <button className="text-tera-secondary hover:text-tera-primary" onClick={() => setAuthDialog(null)}>
                  âœ•
                </button>
              </div>
              <p className="mt-4 text-sm text-tera-primary/80">
                {user
                  ? `Signed in as ${user.email}`
                  : authDialog === 'signIn'
                    ? 'Enter your email, you will receive an authentication link in your email'
                    : 'Enter your email to get started...'}
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  className="w-full rounded-full border border-tera-border bg-tera-muted px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-tera-primary transition hover:border-tera-primary"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                >
                  Continue with Google
                </button>
                <button
                  type="button"
                  className="w-full rounded-full border border-tera-border px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-tera-secondary transition hover:border-tera-primary hover:text-tera-primary"
                  onClick={() => setAuthDialog(null)}
                >
                  Cancel
                </button>
              </div>
              <p className="mt-4 text-center text-[0.6rem] text-tera-secondary">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-tera-primary" onClick={() => setAuthDialog(null)}>
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline hover:text-tera-primary" onClick={() => setAuthDialog(null)}>
                  Privacy Policy
                </Link>
                .
              </p>
              {authMessage && <p className="mt-3 text-[0.7rem] uppercase tracking-[0.3em] text-tera-neon">{authMessage}</p>}
              {user && (
                <p className="mt-4 text-xs text-tera-secondary">You are already signed in. Thank you!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function MainShell() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-tera-bg text-tera-primary">Loading...</div>}>
      <MainShellContent />
    </Suspense>
  )
}


