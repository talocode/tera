import { handleTeraApiRequest } from '@/lib/tera-api/handler'
import { explainSchema } from '@/lib/tera-api/schemas'
import { executeExplain } from '@/lib/tera-api/capabilities/coding'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleTeraApiRequest(request, {
    action: 'coding.explain',
    capability: 'coding',
    credits: 10,
    validate: (body) => {
      const result = explainSchema.safeParse(body)
      return result.success
        ? { success: true as const, data: result.data }
        : { success: false as const, error: result.error }
    },
    execute: (data) => executeExplain(data),
  })
}
