import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addHoldCredits } from '@/lib/free-plan-credits';
import { supabaseServer } from '@/lib/supabase-server';
import { TcodeError } from '@/lib/tcode/crypto';
import { refillCredits } from '@/lib/tcode/store';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || body.rawBalance != null || body.redeemRaw != null || body.airdrop != null || body.credits != null) {
      return NextResponse.json(
        { ok: false, error: 'Client-supplied balances and airdrops are not accepted' },
        { status: 400 },
      );
    }

    const beforeBalance = (await getCreditBalance(session.user.id)) ?? null
    const result = await refillCredits(session.user.id)

    if (result.granted > 0) {
      const granted = await addHoldCredits(session.user.id, result.granted)
      if (!granted) {
        if (result.receiptId) {
          await supabaseServer.from('credit_usage_events').delete().eq('id', result.receiptId)
        }
        return NextResponse.json(
          { ok: false, error: 'Could not grant refill credits' },
          { status: 503 },
        )
      }
    }

    const afterBalance = (await getCreditBalance(session.user.id)) ?? null

    return NextResponse.json({
      ok: true,
      granted: result.granted,
      reason: result.reason,
      period: result.period,
      requiredTokens: result.requiredTokens,
      balanceAtRefill: result.balanceAtRefill,
      usedThisPeriod: result.usedThisPeriod,
      remainingThisPeriod: result.remainingThisPeriod,
      tcodeTokens: result.tcodeTokens,
      receiptId: result.receiptId ?? null,
      beforeBalance,
      afterBalance,
      balance: afterBalance,
    });
  } catch (error) {
    if (error instanceof TcodeError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Error refilling TCODE credits:', error);
    return NextResponse.json({ ok: false, error: 'Failed to refill credits' }, { status: 500 });
  }
}

async function getCreditBalance(userId: string): Promise<number | null> {
  try {
    const { data } = await supabaseServer
      .from('users')
      .select('promotional_credits')
      .eq('id', userId)
      .maybeSingle()
    if (!data) return null
    return Math.max(0, Number(data.promotional_credits || 0))
  } catch {
    return null
  }
}
