import { handleTeraApiRequest } from '@/lib/tera-api/handler'
import { chatCompletionSchema } from '@/lib/tera-api/schemas'
import { executeChatCompletion } from '@/lib/tera-api/capabilities/chat'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleTeraApiRequest(request, {
    action: 'chat.completions',
    capability: 'chat',
    credits: 3,
    validate: (body) => {
      const result = chatCompletionSchema.safeParse(body)
      return result.success
        ? { success: true as const, data: result.data }
        : { success: false as const, error: result.error }
    },
    execute: (data) => executeChatCompletion(data),
  })
}
