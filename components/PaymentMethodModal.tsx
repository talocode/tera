'use client'

import { useState } from 'react'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export default function PaymentMethodModal({ isOpen, onClose, userEmail }: PaymentMethodModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAddPaymentMethod = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/billing/create-payment-method-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          returnUrl: `${window.location.origin}/settings/usage`,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Failed to create checkout')
      }
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open payment setup')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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

        {error && (
          <div className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 dark:border-red-400/20 dark:bg-red-500/10">
            <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void handleAddPaymentMethod()}
            disabled={loading}
            className="tera-button-primary w-full justify-center disabled:opacity-60"
          >
            {loading ? 'Opening checkout...' : 'Add card via Lemon Squeezy'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="tera-button-secondary w-full justify-center"
          >
            Cancel
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-tera-secondary">
          A $1.00 credit top-up will be created to store your card. You&apos;ll receive 250 credits.
        </p>
      </div>
    </div>
  )
}
