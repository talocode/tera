import { handleTeraApiRequest } from '@/lib/tera-api/handler'
import { draftSchema } from '@/lib/tera-api/schemas'
import { executeDraft } from '@/lib/tera-api/capabilities/writing'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleTeraApiRequest(request, {
    action: 'writing.draft',
    capability: 'writing',
    credits: 10,
    validate: (body) => {
      const result = draftSchema.safeParse(body)
      return result.success
        ? { success: true as const, data: result.data }
        : { success: false as const, error: result.error }
    },
    execute: (data) => executeDraft(data),
  })
}
