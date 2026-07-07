import { handleTeraApiRequest } from '@/lib/tera-api/handler'
import { writeSchema } from '@/lib/tera-api/schemas'
import { executeWrite } from '@/lib/tera-api/capabilities/coding'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleTeraApiRequest(request, {
    action: 'coding.write',
    capability: 'coding',
    credits: 20,
    validate: (body) => {
      const result = writeSchema.safeParse(body)
      return result.success
        ? { success: true as const, data: result.data }
        : { success: false as const, error: result.error }
    },
    execute: (data) => executeWrite(data),
  })
}
