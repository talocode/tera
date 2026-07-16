import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendGmailEmail } from '@/lib/gmail'
import { getUserCreditsRemaining, incrementUserCredits } from '@/lib/free-plan-credits'
import { canAffordAction } from '@/lib/credit-pricing'
import { recordUsageLedgerEvent } from '@/lib/usage-ledger'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { to, subject, body: emailBody, cc, bcc, isHtml } = body

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 })
    }

    // Check credits
    const creditState = await getUserCreditsRemaining(session.user.id)
    if (!creditState) {
      return NextResponse.json({ error: 'Unable to check credits' }, { status: 500 })
    }

    if (!canAffordAction('chat_generation', creditState.remaining)) {
      return NextResponse.json({ error: 'Insufficient credits to send email' }, { status: 402 })
    }

    // Send the email
    const result = await sendGmailEmail(session.user.id, to, subject, emailBody, {
      cc,
      bcc,
      isHtml,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 })
    }

    // Charge credits (3 credits for email)
    await incrementUserCredits(session.user.id, 3)

    // Log to usage ledger
    await recordUsageLedgerEvent({
      userId: session.user.id,
      eventType: 'chat_generation',
      status: 'succeeded',
      plan: creditState.plan,
      creditsCharged: 3,
      metadata: {
        action: 'gmail_send',
        to,
        subject,
        messageId: result.messageId,
      },
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      creditsCharged: 3,
      creditsRemaining: creditState.remaining - 3,
    })
  } catch (error) {
    console.error('[gmail_send_error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
