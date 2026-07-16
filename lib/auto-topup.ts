import { supabaseServer } from './supabase-server'

/**
 * Auto-topup configuration and logic.
 * When credits drop below the threshold, automatically purchase more.
 */

export type AutoTopupConfig = {
  enabled: boolean
  thresholdCredits: number
  topupAmountUsd: number
  topupCredits: number
  lastTriggeredAt: string | null
}

const DEFAULT_THRESHOLD_PERCENT = 10

/**
 * Get the user's auto-topup settings from the database.
 */
export async function getAutoTopupConfig(userId: string): Promise<AutoTopupConfig | null> {
  try {
    const { data, error } = await supabaseServer
      .from('users')
      .select('auto_topup_enabled, auto_topup_amount, auto_topup_threshold, auto_topup_last_triggered')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // Columns may not exist yet — graceful fallback
      if (error.message?.includes('column') || error.code === '42703') {
        return null
      }
      console.error('[auto_topup_config_read_failed]', { userId, error })
      return null
    }

    if (!data) return null

    const amount = Number(data.auto_topup_amount || 5)
    const credits = Math.max(1, Math.floor(amount * 250))

    return {
      enabled: !!data.auto_topup_enabled,
      thresholdCredits: Number(data.auto_topup_threshold || 0),
      topupAmountUsd: amount,
      topupCredits: credits,
      lastTriggeredAt: data.auto_topup_last_triggered || null,
    }
  } catch (error) {
    console.error('[auto_topup_config_read_failed]', { userId, error })
    return null
  }
}

/**
 * Save the user's auto-topup settings.
 */
export async function saveAutoTopupConfig(
  userId: string,
  enabled: boolean,
  amountUsd: number,
): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from('users')
      .update({
        auto_topup_enabled: enabled,
        auto_topup_amount: Math.max(1, Math.floor(amountUsd)),
      })
      .eq('id', userId)

    if (error) {
      // Columns may not exist yet
      if (error.message?.includes('column') || error.code === '42703') {
        console.warn('[auto_topup_columns_missing]', { userId })
        return false
      }
      console.error('[auto_topup_config_save_failed]', { userId, error })
      return false
    }

    return true
  } catch (error) {
    console.error('[auto_topup_config_save_exception]', { userId, error })
    return false
  }
}

/**
 * Check if auto-topup should trigger.
 * Returns true if credits are below threshold AND auto-topup is enabled AND user has payment method.
 */
export async function shouldTriggerAutoTopup(
  userId: string,
  currentCredits: number,
  creditCap: number,
): Promise<{ shouldTrigger: boolean; config: AutoTopupConfig | null }> {
  const config = await getAutoTopupConfig(userId)
  if (!config || !config.enabled) {
    return { shouldTrigger: false, config }
  }

  const threshold = config.thresholdCredits > 0
    ? config.thresholdCredits
    : Math.ceil(creditCap * DEFAULT_THRESHOLD_PERCENT / 100)

  return {
    shouldTrigger: currentCredits <= threshold,
    config,
  }
}

/**
 * Record that auto-topup was triggered (for audit trail).
 */
export async function recordAutoTopupTrigger(userId: string): Promise<void> {
  try {
    await supabaseServer
      .from('users')
      .update({ auto_topup_last_triggered: new Date().toISOString() })
      .eq('id', userId)
  } catch (error) {
    console.error('[auto_topup_record_failed]', { userId, error })
  }
}

/**
 * Create a LemonSqueezy checkout session for auto-topup.
 * Returns the checkout URL to redirect the user to.
 */
export async function createAutoTopupCheckout(
  userId: string,
  email: string,
  amountUsd: number,
): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://teraai.chat'}/api/billing/create-credit-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountUsd,
        email,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://teraai.chat'}/settings/usage`,
        autoTopup: true,
      }),
    })

    const data = await response.json()
    if (!response.ok || !data.checkoutUrl) {
      console.error('[auto_topup_checkout_failed]', { userId, data })
      return null
    }

    await recordAutoTopupTrigger(userId)
    return data.checkoutUrl
  } catch (error) {
    console.error('[auto_topup_checkout_exception]', { userId, error })
    return null
  }
}
