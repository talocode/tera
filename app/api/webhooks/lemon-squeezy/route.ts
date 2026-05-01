import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyWebhookSignature, mapVariantToPlan, type LemonSqueezyWebhookData, type LemonSqueezySubscriptionWebhook } from '@/lib/lemon-squeezy'
import { sendSubscriptionEndedEmail, sendSubscriptionStartedEmail } from '@/lib/transactional-emails'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-Signature') || ''
    const body = await request.text()

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    const eventType = event.meta?.event_name

    console.log(`Processing webhook event: ${eventType}`)

    switch (eventType) {
      case 'order_completed':
        await handleOrderCompleted(event.data as LemonSqueezyWebhookData)
        break

      case 'subscription_created':
        await handleSubscriptionCreated(event.data as LemonSqueezySubscriptionWebhook)
        break

      case 'subscription_updated':
        await handleSubscriptionUpdated(event.data as LemonSqueezySubscriptionWebhook)
        break

      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event.data as LemonSqueezySubscriptionWebhook)
        break

      case 'subscription_expired':
        await handleSubscriptionExpired(event.data as LemonSqueezySubscriptionWebhook)
        break

      default:
        console.log(`Unhandled webhook event: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleOrderCompleted(data: LemonSqueezyWebhookData) {
  try {
    const customData = data.attributes.custom_data
    const userId = customData?.user_id

    if (!userId) {
      console.warn('Order completed but no user_id in custom_data')
      return
    }

    const plan = mapVariantToPlan(data.attributes.variant_id.toString())
    if (!plan) {
      console.warn(`Unknown variant ID: ${data.attributes.variant_id}`)
      return
    }

    // Update user subscription
    const { error } = await supabaseServer
      .from('users')
      .update({
        subscription_plan: plan,
        lemon_squeezy_customer_id: data.attributes.customer_id,
        lemon_squeezy_order_id: data.attributes.order_number,
        subscription_updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update user subscription:', error)
      return
    }

    console.log(`✅ User ${userId} upgraded to ${plan} plan`)
  } catch (error) {
    console.error('Error handling order completed:', error)
  }
}

async function handleSubscriptionCreated(data: LemonSqueezySubscriptionWebhook) {
  try {
    const customData = data.attributes.custom_data
    const userId = customData?.user_id

    if (!userId) {
      console.warn('Subscription created but no user_id in custom_data')
      return
    }

    const plan = mapVariantToPlan(data.attributes.variant_id.toString())
    if (!plan) {
      console.warn(`Unknown variant ID: ${data.attributes.variant_id}`)
      return
    }

    // Update user with subscription info
    const { error } = await supabaseServer
      .from('users')
      .update({
        subscription_plan: plan,
        lemon_squeezy_customer_id: data.attributes.customer_id,
        lemon_squeezy_subscription_id: data.id,
        subscription_status: data.attributes.status,
        subscription_renewal_date: data.attributes.renews_at,
        subscription_updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to create subscription record:', error)
      return
    }

    sendSubscriptionStartedEmail({
      userId,
      email: data.attributes.user_email,
      plan,
      renewalDate: data.attributes.renews_at,
      sourceId: data.id,
    }).catch((error) => console.error('[subscription_started_email_failed]', { userId, subscriptionId: data.id, error }))

    console.log(`✅ Subscription created for user ${userId}`)
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(data: LemonSqueezySubscriptionWebhook) {
  try {
    const customData = data.attributes.custom_data
    const userId = customData?.user_id

    if (!userId) {
      console.warn('Subscription updated but no user_id in custom_data')
      return
    }

    // Update subscription status
    const { error } = await supabaseServer
      .from('users')
      .update({
        subscription_status: data.attributes.status,
        subscription_renewal_date: data.attributes.renews_at,
        subscription_updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update subscription:', error)
      return
    }

    console.log(`✅ Subscription updated for user ${userId}: ${data.attributes.status}`)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionCancelled(data: LemonSqueezySubscriptionWebhook) {
  try {
    const customData = data.attributes.custom_data
    const userId = customData?.user_id

    if (!userId) {
      console.warn('Subscription cancelled but no user_id in custom_data')
      return
    }

    // Downgrade user to free plan
    const { error } = await supabaseServer
      .from('users')
      .update({
        subscription_plan: 'free',
        subscription_status: 'cancelled',
        subscription_cancelled_at: new Date().toISOString(),
        subscription_updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to cancel subscription:', error)
      return
    }

    sendSubscriptionEndedEmail({
      userId,
      email: data.attributes.user_email,
      status: 'cancelled',
      sourceId: data.id,
    }).catch((error) => console.error('[subscription_cancelled_email_failed]', { userId, subscriptionId: data.id, error }))

    console.log(`✅ Subscription cancelled for user ${userId}`)
  } catch (error) {
    console.error('Error handling subscription cancelled:', error)
  }
}

async function handleSubscriptionExpired(data: LemonSqueezySubscriptionWebhook) {
  try {
    const customData = data.attributes.custom_data
    const userId = customData?.user_id

    if (!userId) {
      console.warn('Subscription expired but no user_id in custom_data')
      return
    }

    // Downgrade user to free plan
    const { error } = await supabaseServer
      .from('users')
      .update({
        subscription_plan: 'free',
        subscription_status: 'expired',
        subscription_updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to expire subscription:', error)
      return
    }

    sendSubscriptionEndedEmail({
      userId,
      email: data.attributes.user_email,
      status: 'expired',
      sourceId: data.id,
    }).catch((error) => console.error('[subscription_expired_email_failed]', { userId, subscriptionId: data.id, error }))

    console.log(`✅ Subscription expired for user ${userId}`)
  } catch (error) {
    console.error('Error handling subscription expired:', error)
  }
}
