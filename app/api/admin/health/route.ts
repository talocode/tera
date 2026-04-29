import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { supabaseServer as supabase } from '@/lib/supabase-server'

type HealthCheck = {
  name: string
  ok: boolean
  message?: string
}

async function runColumnCheck(name: string, table: string, columns: string): Promise<HealthCheck> {
  const { error } = await supabase
    .from(table)
    .select(columns, { head: true })
    .limit(1)

  if (error) {
    return {
      name,
      ok: false,
      message: error.message,
    }
  }

  return { name, ok: true }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email || !isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const checks = await Promise.all([
      runColumnCheck(
        'users usage columns',
        'users',
        'id, subscription_plan, daily_chats, daily_file_uploads, chat_reset_date, free_plan_credits_used, free_plan_credits_reset_date, limit_hit_chat_at, limit_hit_upload_at',
      ),
      runColumnCheck(
        'chat session analytics columns',
        'chat_sessions',
        'id, user_id, session_id, title, prompt, response, token_usage, created_at',
      ),
    ])

    const ok = checks.every((check) => check.ok)

    return NextResponse.json(
      {
        ok,
        checkedAt: new Date().toISOString(),
        checks,
      },
      { status: ok ? 200 : 503 },
    )
  } catch (error) {
    console.error('[admin_health_failed]', error)
    return NextResponse.json({ error: 'Failed to run admin health checks' }, { status: 500 })
  }
}
