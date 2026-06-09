'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import Image from 'next/image'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  let errorMessage = 'An unidentified error occurred during authentication.'
  if (error === 'Configuration') errorMessage = 'There is a problem with the server configuration.'
  if (error === 'AccessDenied') errorMessage = 'Access was denied. You may not be allowed to sign in.'
  if (error === 'Verification') errorMessage = 'The verification token has expired or has been used.'
  if (error === 'OAuthSignin') errorMessage = 'Error in constructing an authorization URL.'
  if (error === 'OAuthCallback') errorMessage = 'Error in handling the response from an OAuth provider.'
  if (error === 'OAuthCreateAccount') errorMessage = 'Could not create OAuth provider user in the database.'
  if (error === 'EmailCreateAccount') errorMessage = 'Could not create email provider user in the database.'
  if (error === 'Callback') errorMessage = 'Error in the OAuth callback handler route.'
  if (error === 'OAuthAccountNotLinked') errorMessage = 'To confirm your identity, sign in with the same account you used originally.'
  if (error === 'SessionRequired') errorMessage = 'Please sign in to access this page.'

  return (
    <div className="w-full max-w-lg rounded-[30px] border border-tera-border bg-tera-panel/82 px-8 py-8 text-center shadow-soft-lg backdrop-blur-2xl">
      <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-[24px] border border-tera-border bg-white/[0.04]">
        <div className="relative h-12 w-12">
          <Image src="/images/TERA_LOGO_ONLY.png" alt="Tera" fill className="hidden object-contain dark:block" />
          <Image src="/images/TERA_LOGO_ONLY1.png" alt="Tera" fill className="object-contain dark:hidden" />
        </div>
      </div>

      <p className="tera-eyebrow">Authentication</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-tera-primary">Sign-in error</h1>

      <div className="mt-6 rounded-[22px] border border-red-500/30 bg-red-500/10 px-5 py-4 text-left">
        <p className="text-xs uppercase tracking-[0.22em] text-red-200">Code: {error || 'Unknown'}</p>
        <p className="mt-2 text-sm leading-7 text-red-100">{errorMessage}</p>
      </div>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/auth/signin" className="tera-button-primary">Try again</Link>
        <Link href="/new" className="tera-button-secondary">Go to chat</Link>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <div className="tera-page flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<div className="text-sm text-tera-secondary">Loading error details...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  )
}
