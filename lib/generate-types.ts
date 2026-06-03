import type { AttachmentReference } from '@/lib/attachment'
import type { ChatMode } from '@/lib/ai/chat-modes'

export type GenerateProps = {
  prompt: string
  tool: string
  authorId: string
  authorEmail?: string
  attachments?: AttachmentReference[]
  sessionId?: string | null
  chatId?: string
  researchMode?: boolean
  chatMode?: ChatMode
}

export type GenerateAnswerResult = {
  answer: string
  sessionId: string | null
  chatId?: string
  citations?: Array<{
    title: string
    url: string
    snippet?: string | null
    publishedDate?: string | null
  }>
  warning?: string
  error?: string
}
