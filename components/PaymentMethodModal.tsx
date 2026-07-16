'use client'

import { useEffect, useState } from 'react'
import { markBillingRefreshPending } from '@/lib/billing-refresh'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export default function PaymentMethodModal({ isOpen, onClose, userEmail }: PaymentMethodModalProps) {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/create-payment-method-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          returnUrl: `${window.location.origin}/settings/usage`,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || 'Failed to create checkout')
      markBillingRefreshPending('payment-method')
      const url = new URL(data.checkoutUrl)
      url.searchParams.set('embed', '1')
      setCheckoutUrl(url.toString())
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open payment setup')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && userEmail) void openCheckout()
  }, [isOpen, userEmail])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {checkoutUrl ? (
        <div className="relative w-full max-w-2xl h-[90vh] rounded-[28px] border border-tera-border bg-tera-panel shadow-panel overflow-hidden">
          <button
            type="button"
            onClick={() => { setCheckoutUrl(null); onClose() }}
            className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <iframe src={checkoutUrl} className="h-full w-full" allow="payment" />
        </div>
      ) : (
        <div className="relative w-full max-w-md rounded-[28px] border border-tera-border bg-tera-panel p-6 shadow-panel">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-tera-secondary transition-colors hover:bg-tera-highlight hover:text-tera-primary"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-tera-border bg-tera-muted">
            <svg className="h-6 w-6 text-tera-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>

          <h2 className="mt-4 text-xl font-semibold text-tera-primary">Add payment method</h2>
          <p className="mt-2 text-sm leading-relaxed text-tera-secondary">
            Add a card to enable auto top-up and purchase additional credits. Your card will be stored securely via Lemon Squeezy.
          </p>

          {error ? (
            <>
              <div className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 dark:border-red-400/20 dark:bg-red-500/10">
                <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <button type="button" onClick={() => void openCheckout()} className="tera-button-primary w-full justify-center">Try again</button>
                <button type="button" onClick={onClose} className="tera-button-secondary w-full justify-center">Cancel</button>
              </div>
            </>
          ) : (
            <div className="mt-6 flex items-center justify-center py-4">
              <p className="text-sm text-tera-secondary">Opening checkout...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
