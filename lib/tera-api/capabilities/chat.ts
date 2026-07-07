import { callProviderChat, type ChatCompletionInput } from './provider.ts'
import type { z } from 'zod'
import type { chatCompletionSchema } from '../schemas.ts'

type ChatData = z.infer<typeof chatCompletionSchema>

export async function executeChatCompletion(data: ChatData) {
  const input: ChatCompletionInput = {
    model: data.model,
    messages: data.messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    })),
    max_tokens: data.max_tokens,
    temperature: data.temperature,
  }

  const result = await callProviderChat(input)

  return {
    choices: result.choices,
    usage: result.usage,
  }
}
