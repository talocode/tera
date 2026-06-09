'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      const callbackUrl = `${window.location.origin}/new`; await signIn('google', { callbackUrl, redirect: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
      setLoading(false)
    }
  }

  return (
    <div className="tera-page flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-tera-border bg-tera-panel/82 p-8 shadow-panel backdrop-blur-2xl md:p-10">
        <div className="flex justify-center">
          <div className="relative h-16 w-16 rounded-[24px] border border-tera-border bg-white/[0.04] p-3">
            <Image src="/images/TERA_LOGO_ONLY.png" alt="Tera" fill className="hidden object-contain p-3 dark:block" />
            <Image src="/images/TERA_LOGO_ONLY1.png" alt="Tera" fill className="object-contain p-3 dark:hidden" />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="tera-eyebrow">Welcome back</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-tera-primary">Sign in to Tera</h1>
          <p className="mt-4 text-sm leading-7 text-tera-secondary">
            Continue into the unified dark workspace for chat, tools, research, and notes.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-[20px] border border-tera-border bg-white px-4 py-3 font-medium text-[#111827] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-tera-muted dark:text-white dark:hover:bg-tera-panel"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

          <div className="tera-card-subtle mt-8 space-y-3 p-5">
          <div className="flex items-start gap-3 text-sm leading-7 text-tera-secondary">
            <span className="mt-2 h-2.5 w-2.5 rounded-full bg-tera-neon" />
            <span>Unlimited AI conversations on the free plan.</span>
          </div>
          <div className="flex items-start gap-3 text-sm leading-7 text-tera-secondary">
            <span className="mt-2 h-2.5 w-2.5 rounded-full bg-tera-neon" />
            <span>One account for chat, tools, notes, and history.</span>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-tera-secondary">
          Do not have an account?{' '}
          <Link href="/auth/signup" className="text-tera-neon underline decoration-tera-neon/30 underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

