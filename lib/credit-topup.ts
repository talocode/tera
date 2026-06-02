export const MIN_TOPUP_USD = 1
export const MAX_TOPUP_USD = 500
export const CREDITS_PER_USD = 250

export function isValidTopupAmount(amountUsd: number) {
  return Number.isFinite(amountUsd) && amountUsd >= MIN_TOPUP_USD && amountUsd <= MAX_TOPUP_USD
}

export function calculateCreditsFromTopup(amountUsd: number) {
  return Math.max(1, Math.floor(amountUsd * CREDITS_PER_USD))
}
