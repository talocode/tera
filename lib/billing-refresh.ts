export type BillingRefreshReason = 'payment-method' | 'credit-topup' | 'portal'

type BillingRefreshState = {
  reason: BillingRefreshReason
  startedAt: number
}

const BILLING_REFRESH_STORAGE_KEY = 'tera:billing-refresh'

export const BILLING_REFRESH_INTERVAL_MS = 2000
export const BILLING_REFRESH_MAX_ATTEMPTS = 8

export function markBillingRefreshPending(reason: BillingRefreshReason) {
  if (typeof window === 'undefined') return

  const payload: BillingRefreshState = {
    reason,
    startedAt: Date.now(),
  }

  window.sessionStorage.setItem(BILLING_REFRESH_STORAGE_KEY, JSON.stringify(payload))
}

export function readBillingRefreshPending(): BillingRefreshState | null {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(BILLING_REFRESH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<BillingRefreshState>
    if (
      (parsed.reason === 'payment-method' || parsed.reason === 'credit-topup' || parsed.reason === 'portal') &&
      typeof parsed.startedAt === 'number'
    ) {
      return {
        reason: parsed.reason,
        startedAt: parsed.startedAt,
      }
    }
  } catch (error) {
    console.error('Failed to read billing refresh state:', error)
  }

  return null
}

export function clearBillingRefreshPending() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(BILLING_REFRESH_STORAGE_KEY)
}
