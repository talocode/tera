import { handleTeraApiRequest } from '@/lib/tera-api/handler'
import { reviewSchema } from '@/lib/tera-api/schemas'
import { executeReview } from '@/lib/tera-api/capabilities/coding'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleTeraApiRequest(request, {
    action: 'coding.review',
    capability: 'coding',
    credits: 20,
    validate: (body) => {
      const result = reviewSchema.safeParse(body)
      return result.success
        ? { success: true as const, data: result.data }
        : { success: false as const, error: result.error }
    },
    execute: (data) => executeReview(data),
  })
}
