import { NextResponse } from 'next/server'
import { generateAnswerForPrompt } from '@/lib/generate-answer'
import type { GenerateProps } from '@/lib/generate-types'

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

  try {
    return NextResponse.json(await generateAnswerForPrompt(body))
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
