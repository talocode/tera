import { handleTeraApiRequest } from '@/lib/tera-api/handler'
import { rewriteSchema } from '@/lib/tera-api/schemas'
import { executeRewrite } from '@/lib/tera-api/capabilities/writing'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleTeraApiRequest(request, {
    action: 'writing.rewrite',
    capability: 'writing',
    credits: 5,
    validate: (body) => {
      const result = rewriteSchema.safeParse(body)
      return result.success
        ? { success: true as const, data: result.data }
        : { success: false as const, error: result.error }
    },
    execute: (data) => executeRewrite(data),
  })
}
