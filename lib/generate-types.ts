import type { ChatMode } from '@/lib/ai/chat-modes'
import type { AttachmentReference } from '@/lib/attachment'
import type { ChatMode } from '@/lib/chat-mode'
import type { ChatMode } from '@/lib/ai/chat-modes'
import type { ChatMode } from '@/lib/chat-modes'

export type ChatMode = 'ask' | 'learn' | 'research' | 'build'

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
  warning?: string
  error?: string
}
