import type { AttachmentReference } from '@/lib/attachment'

export type TeraChatMode = 'general' | 'learn' | 'research' | 'build'

export type GenerateProps = {
  prompt: string
  tool: string
  authorId: string
  authorEmail?: string
  attachments?: AttachmentReference[]
  sessionId?: string | null
  chatId?: string
  researchMode?: boolean
  chatMode?: TeraChatMode
}

export type GenerateAnswerResult = {
  answer: string
  sessionId: string | null
  chatId?: string
  warning?: string
  error?: string
}
