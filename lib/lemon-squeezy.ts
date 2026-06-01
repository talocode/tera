/**
 * Lemon Squeezy API Integration
 * Handles payment processing, subscription management, and webhooks
 */

export interface LemonSqueezyCheckoutData {
  email?: string
  custom?: {
    user_id?: string
    return_url?: string
    [key: string]: string | undefined
  }
}

export interface LemonSqueezyWebhookData {
  id: string
  type: string
  attributes: {
    status: 'pending' | 'completed' | 'failed' | 'refunded'
    refunded: boolean
    failed: boolean
    product_id: number
    variant_id: number
    customer_id: number
    subscription_id?: number
    order_number: string
    user_name: string
    user_email: string
    created_at: string
    updated_at: string
    test_mode: boolean
    custom_data?: {
      user_id?: string
    }
  }
}

export interface LemonSqueezySubscriptionWebhook {
  id: string
  type: string
  attributes: {
    store_id: number
    customer_id: number
    order_id: number
    product_id: number
    variant_id: number
    product_name: string
    variant_name: string
    user_name: string
    user_email: string
    status: 'on_trial' | 'active' | 'paused' | 'past_due' | 'unpaid' | 'cancelled' | 'expired'
    status_formatted: string
    card_brand: string
    card_last_four: string
    pause_at: string | null
    cancelled_at: string | null
    trial_ends_at: string | null
    billing_anchor: number
    urls: {
      update_payment_method: string
      customer_portal: string
    }
    renews_at: string
    ends_at: string | null
    created_at: string
    updated_at: string
    test_mode: boolean
    custom_data?: {
      user_id?: string
    }
  }
}

interface CheckoutOptions {
  email?: string
  userId?: string
  returnUrl?: string
  customData?: Record<string, string>
  customPriceUsd?: number
}

/**
 * Create a Lemon Squeezy checkout URL using the API
 */
export async function createCheckout(variantId: string, options: CheckoutOptions = {}): Promise<string> {
  try {
    const storeId = process.env.NEXT_PUBLIC_LEMON_STORE_ID
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY

    if (!storeId || !apiKey) {
      throw new Error('Missing Lemon Squeezy configuration: Store ID or API Key')
    }

    // Use Lemon Squeezy API to create checkout
    const customData: Record<string, string | undefined> = {
      user_id: options.userId,
      ...(options.customData || {}),
    }
    
    if (options.returnUrl) {
      customData.return_url = options.returnUrl
    }

    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          custom_price: options.customPriceUsd ? Math.round(options.customPriceUsd * 100) : undefined,
          checkout_data: {
            email: options.email,
            custom: customData
          },
          preview: false,
          expires_at: null
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: storeId
            }
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId
            }
          }
        }
      }
    }

    console.log('[Lemon Squeezy] Request payload:', JSON.stringify(checkoutData, null, 2))
    console.log('[Lemon Squeezy] Store ID:', storeId)
    console.log('[Lemon Squeezy] Variant ID:', variantId)
    console.log('[Lemon Squeezy] Email:', options.email)
    console.log('[Lemon Squeezy] User ID:', options.userId)

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(checkoutData)
    })

    if (!response.ok) {
      let errorDetails = ''
      try {
        const error = await response.json()
        errorDetails = JSON.stringify(error)
      } catch (e) {
        errorDetails = await response.text()
      }
      console.error(`[Lemon Squeezy] API error (${response.status}):`, errorDetails)
      throw new Error(`Lemon Squeezy API error (${response.status}): ${errorDetails}`)
    }

    const data = await response.json()
    console.log('[Lemon Squeezy] Checkout response:', JSON.stringify(data))
    
    const checkoutUrl = data.data?.attributes?.url

    if (!checkoutUrl) {
      console.error('[Lemon Squeezy] No URL in response:', JSON.stringify(data))
      throw new Error(`No checkout URL in Lemon Squeezy response`)
    }

    console.log('[Lemon Squeezy] Checkout URL created:', checkoutUrl)
    return checkoutUrl
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[Lemon Squeezy] Checkout creation failed:', msg)
    throw error
  }
}

/**
 * Verify Lemon Squeezy webhook signature
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!process.env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
    console.error('LEMON_SQUEEZY_WEBHOOK_SECRET not configured')
    return false
  }

  try {
    const crypto = require('crypto')
    const hash = crypto
      .createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    return hash === signature
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return false
  }
}

/**
 * Map Lemon Squeezy variant ID to plan type
 */
export function mapVariantToPlan(variantId: string): 'pro' | 'plus' | null {
  const proVariantId = process.env.LEMON_SQUEEZY_PRO_VARIANT_ID
  const plusVariantId = process.env.LEMON_SQUEEZY_PLUS_VARIANT_ID

  if (variantId === proVariantId) {
    return 'pro'
  } else if (variantId === plusVariantId) {
    return 'plus'
  }

  return null
}

/**
 * Get checkout URL for a specific plan
 */
export async function getCheckoutUrlForPlan(
  plan: 'pro' | 'plus',
  email: string,
  userId: string,
  returnUrl?: string,
  currencyCode?: string
): Promise<string> {
  // Validate environment variables
  const storeId = process.env.NEXT_PUBLIC_LEMON_STORE_ID
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY
  
  console.log('[Lemon Squeezy] Validating config for plan:', plan)
  console.log('[Lemon Squeezy] Store ID:', storeId ? 'present' : 'MISSING')
  console.log('[Lemon Squeezy] API Key:', apiKey ? 'present' : 'MISSING')
  
  if (!storeId) {
    throw new Error('NEXT_PUBLIC_LEMON_STORE_ID not configured')
  }
  if (!apiKey) {
    throw new Error('LEMON_SQUEEZY_API_KEY not configured')
  }

  const variantId = plan === 'pro'
    ? process.env.LEMON_SQUEEZY_PRO_VARIANT_ID
    : process.env.LEMON_SQUEEZY_PLUS_VARIANT_ID

  console.log('[Lemon Squeezy] Variant ID for', plan, ':', variantId ? 'present' : 'MISSING')

  if (!variantId) {
    throw new Error(`LEMON_SQUEEZY_${plan.toUpperCase()}_VARIANT_ID not configured`)
  }

  console.log('[Lemon Squeezy] Creating checkout for plan:', plan, 'email:', email, 'userId:', userId)
  return createCheckout(variantId, {
    email,
    userId,
    returnUrl
  })
}

export async function getCheckoutUrlForCreditPack(
  amountUsd: number,
  credits: number,
  email: string,
  userId: string,
  returnUrl?: string
): Promise<string> {
  const variantId = process.env.LEMON_SQUEEZY_CREDIT_TOPUP_VARIANT_ID
  if (!variantId) {
    throw new Error('Missing Lemon Squeezy top-up variant: LEMON_SQUEEZY_CREDIT_TOPUP_VARIANT_ID')
  }

  return createCheckout(variantId, {
    email,
    userId,
    returnUrl,
    customPriceUsd: amountUsd,
    customData: {
      topup_credits: String(credits),
      topup_amount_usd: String(amountUsd),
      topup_type: 'credit_topup',
    },
  })
}

/**
 * Get customer portal URL
 */
export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  try {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY
    if (!apiKey) throw new Error('Missing Lemon Squeezy API Key')

    // List 'customers' to find the one with this ID, referencing its 'link' to customer portal?
    // Actually, creating a signed URL is better. But simplest way per LS docs is:
    // GET https://api.lemonsqueezy.com/v1/customers/:id
    // response.data.attributes.urls.customer_portal

    const response = await fetch(`https://api.lemonsqueezy.com/v1/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch customer: ${response.status}`)
    }

    const data = await response.json()
    const portalUrl = data.data?.attributes?.urls?.customer_portal

    if (!portalUrl) {
      throw new Error('No customer portal URL returned')
    }

    return portalUrl
  } catch (error) {
    console.error('Failed to get customer portal URL:', error)
    throw error
  }
}
