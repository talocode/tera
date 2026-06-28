import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const DEEP_RESEARCH_PROMPT = 'Run a deep research brief on [TOPIC]. Include: objective, key questions, trustworthy sources with links, opposing viewpoints, evidence quality notes, and a final recommendation.'

export default async function DeepResearchEntryPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabaseServer
    .from('users')
    .select('subscription_plan')
    .eq('id', session.user.id)
    .single()

  const sessionPlan = (session.user as any)?.plan || (session.user as any)?.subscription_plan
  const plan = (profile?.subscription_plan || sessionPlan || 'free').toString().toLowerCase()
  const hasDeepResearchAccess = plan === 'pro' || plan === 'plus' || plan === 'lifetime'

  if (!hasDeepResearchAccess) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-tera-bg px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-tera-border bg-tera-elevated p-8 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-tera-secondary">Upgrade required</p>
          <h1 className="mt-3 text-2xl font-semibold text-tera-primary">Deep Research is for Pro and Plus</h1>
          <p className="mt-3 text-sm text-tera-secondary">
            You are currently on the Free plan. Upgrade to Pro or Plus to use Deep Research mode.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/pricing" className="tera-button-primary rounded-full px-5 py-2 text-sm">
              Upgrade now
            </Link>
            <Link href="/new" className="tera-button-secondary rounded-full px-5 py-2 text-sm">
              Back to chat
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const sessionId = crypto.randomUUID()
  redirect(`/new/${sessionId}?prompt=${encodeURIComponent(DEEP_RESEARCH_PROMPT)}`)
}
