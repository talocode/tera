import { NextResponse } from 'next/server'
import { normalizeChatMode } from '@/lib/ai/chat-modes'
import { generateAnswerForPrompt } from '@/lib/generate-answer'
import type { GenerateProps } from '@/lib/generate-types'
import { isChatMode } from '@/lib/chat-modes'

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
    && (body.chatMode === undefined || ['ask', 'learn', 'research', 'build'].includes(body.chatMode))
    && (body.chatMode === undefined || typeof body.chatMode === 'string')
    && (body.chatMode === undefined || body.chatMode === null || typeof body.chatMode === 'string')
    && (body.chatMode === undefined || isChatMode(body.chatMode))
    && (body.attachments === undefined || Array.isArray(body.attachments))
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

  if (!chatMode) {
    return NextResponse.json<GenerateErrorResponse>({
      answer: 'Invalid message request.',
      sessionId: body.sessionId ?? null,
      chatId: body.chatId,
      error: 'Invalid message request.',
    }, { status: 400 })
  }

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
    return NextResponse.json(await generateAnswerForPrompt({ ...body, chatMode }))
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
