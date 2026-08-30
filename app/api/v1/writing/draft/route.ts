import { proxyToTalocode } from '@/lib/tera-api/proxy'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return proxyToTalocode(request, { path: '/v1/tera/writing/draft' })
}
