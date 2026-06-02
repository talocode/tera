import { NextRequest, NextResponse } from 'next/server'
import { getCheckoutUrlForPlan, getCheckoutUrlForCreditPack, getCustomerPortalUrl } from '@/lib/lemon-squeezy'
import { supabaseServer } from '@/lib/supabase-server'
import { auth } from '@/lib/auth'
import { calculateCreditsFromTopup, isValidTopupAmount } from '@/lib/credit-topup'

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params
    const action = slug[0]

    console.log(`[Billing API] Received request for action: ${action}`)

    try {
        const body = await request.json()

        if (action === 'create-session') {
            console.log(`[Billing API] Request body:`, { action, plan: body.plan, email: body.email })
        } else {
            console.log(`[Billing API] Processing action: ${action}`)
        }

        if (action === 'create-credit-session') {
            const { amountUsd, email, returnUrl } = body
            const session = await auth()
            if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            const userId = session.user.id

            const parsedAmount = Number(amountUsd)
            if (!email || !isValidTopupAmount(parsedAmount)) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
            }

            const credits = calculateCreditsFromTopup(parsedAmount)
            const checkoutUrl = await getCheckoutUrlForCreditPack(parsedAmount, credits, email, userId, returnUrl)
            return NextResponse.json({ success: true, checkoutUrl, credits })
        }

        if (action === 'create-session') {
            const { plan, email, returnUrl, currencyCode } = body

            const session = await auth()
            if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            const userId = session.user.id

            if (!plan || !['pro', 'plus'].includes(plan) || !email) {
                console.log(`[Billing API] Missing required fields`, { plan, email, userId })
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
            }
            console.log(`[Billing API] Creating checkout for plan: ${plan}`)
            const checkoutUrl = await getCheckoutUrlForPlan(plan, email, userId, returnUrl, currencyCode)
            console.log(`[Billing API] Checkout URL created successfully`)
            return NextResponse.json({ success: true, checkoutUrl, currency: currencyCode })
        }

        if (action === 'create-portal-session') {
            const session = await auth()
            if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            const userId = session.user.id

            // Get customer ID from database
            const { data: user, error } = await supabaseServer
                .from('users')
                .select('lemon_squeezy_customer_id')
                .eq('id', userId)
                .single()

            if (error || !user?.lemon_squeezy_customer_id) {
                return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
            }

            const portalUrl = await getCustomerPortalUrl(user.lemon_squeezy_customer_id)
            return NextResponse.json({ success: true, portalUrl })
        }

        if (action === 'status') {
            const session = await auth()
            if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            const userId = session.user.id
            const { data, error } = await supabaseServer
                .from('users')
                .select('subscription_plan, subscription_status, subscription_renewal_date, subscription_cancelled_at')
                .eq('id', userId)
                .single()
            if (error) throw error
            return NextResponse.json({
                success: true,
                plan: data?.subscription_plan || 'free',
                status: data?.subscription_status,
                renewalDate: data?.subscription_renewal_date,
                cancelledAt: data?.subscription_cancelled_at
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : ''
        console.error(`[Billing API] Error (${action}):`, errorMessage)
        console.error(`[Billing API] Stack:`, errorStack)
        return NextResponse.json({
            error: 'Failed',
            details: errorMessage,
            action: action
        }, { status: 500 })
    }
}
