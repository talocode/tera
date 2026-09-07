import { llmsIndex } from '@/lib/agent-readable-content'

export function GET() {
  return new Response(llmsIndex(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
