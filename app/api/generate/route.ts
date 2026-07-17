import { NextResponse } from 'next/server'
import { isChatMode, normalizeChatMode } from '@/lib/ai/chat-modes'
import { generateAnswerForPrompt } from '@/lib/generate-answer'
import type { GenerateProps } from '@/lib/generate-types'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

type GenerateErrorResponse = {
  answer: string
  sessionId: string | null
  chatId?: string
  error: string
}

function isGenerateProps(value: unknown): value is GenerateProps {
  if (!value || typeof value !== 'object') return false

  const body = value as Partial<GenerateProps>

  return typeof body.prompt === 'string'
    && typeof body.tool === 'string'
    && typeof body.authorId === 'string'
    && (body.authorEmail === undefined || typeof body.authorEmail === 'string')
    && (body.sessionId === undefined || body.sessionId === null || typeof body.sessionId === 'string')
    && (body.chatId === undefined || typeof body.chatId === 'string')
    && (body.researchMode === undefined || typeof body.researchMode === 'boolean')
    && (body.chatMode === undefined || isChatMode(body.chatMode))
    && (body.attachments === undefined || Array.isArray(body.attachments))
}

async function trackActivationIfNeeded(userId: string) {
  try {
    // Check if this is the user's first message
    const { count } = await supabaseServer
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (count === 1) {
      // First message ever — track it
      await supabaseServer.from('activation_events').insert({
        user_id: userId,
        event_type: 'first_message_sent',
        metadata: {},
      })
    }

    // Check if this is the user's first credit usage
    const { data: userData } = await supabaseServer
      .from('users')
      .select('free_plan_credits_used')
      .eq('id', userId)
      .maybeSingle()

    if (userData && userData.free_plan_credits_used <= 1) {
      // First credit usage — track it
      await supabaseServer.from('activation_events').insert({
        user_id: userId,
        event_type: 'first_credit_used',
        metadata: { credits_used: userData.free_plan_credits_used },
      })
    }
  } catch (error) {
    console.error('[activation_track_failed]', { userId, error })
  }
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<GenerateErrorResponse>({
      answer: 'Invalid message request.',
      sessionId: null,
      error: 'Invalid message request.',
    }, { status: 400 })
  }

  if (!isGenerateProps(body)) {
    return NextResponse.json<GenerateErrorResponse>({
      answer: 'Invalid message request.',
      sessionId: null,
      error: 'Invalid message request.',
    }, { status: 400 })
  }

  const chatMode = normalizeChatMode(body.chatMode)

  if (chatMode === 'image') {
    const message = 'Image creation is coming soon.'
    return NextResponse.json<GenerateErrorResponse>({
      answer: message,
      sessionId: body.sessionId ?? null,
      chatId: body.chatId,
      error: message,
    })
  }

  try {
    const result = await generateAnswerForPrompt({ ...body, chatMode })

    // Track activation events (non-blocking)
    trackActivationIfNeeded(body.authorId).catch(() => {})

    return NextResponse.json(result)
  } catch (error) {
    console.error('[generate_api_failed]', error)
    const message = error instanceof Error ? error.message : 'Unable to generate a reply'
    return NextResponse.json<GenerateErrorResponse>({
      answer: message,
      sessionId: body.sessionId ?? null,
      chatId: body.chatId,
      error: message,
    }, { status: 500 })
  }
}
