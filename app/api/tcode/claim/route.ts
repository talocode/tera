import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addPurchasedCredits } from '@/lib/free-plan-credits';
import { supabaseServer } from '@/lib/supabase-server';
import { TcodeError } from '@/lib/tcode/crypto';
import { claimForPeriod, getHoldings } from '@/lib/tcode/store';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || body.rawBalance != null || body.redeemRaw != null || body.airdrop != null) {
      return NextResponse.json(
        { ok: false, error: 'Client-supplied balances and airdrops are not accepted' },
        { status: 400 },
      );
    }

    const holdings = await getHoldings(session.user.id);

    const beforeBalance = (await getCreditBalance(session.user.id)) ?? null

    const result = await claimForPeriod(session.user.id, holdings.period)

    if (result.granted > 0) {
      const granted = await addPurchasedCredits(session.user.id, result.granted)
      if (!granted) {
        return NextResponse.json(
          { ok: false, error: 'Could not grant monthly credits' },
          { status: 503 },
        )
      }
    }

    const afterBalance = (await getCreditBalance(session.user.id)) ?? null

    return NextResponse.json({
      ok: true,
      granted: result.granted,
      alreadyClaimed: result.alreadyClaimed,
      reason: result.reason,
      period: result.period,
      tier: result.tier,
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
    console.error('Error claiming TCODE credits:', error);
    return NextResponse.json({ ok: false, error: 'Failed to claim credits' }, { status: 500 });
  }
}

async function getCreditBalance(userId: string): Promise<number | null> {
  try {
    const { data } = await supabaseServer
      .from('users')
      .select('purchased_credits_balance')
      .eq('id', userId)
      .maybeSingle()
    if (!data) return null
    return Math.max(0, Number(data.purchased_credits_balance || 0))
  } catch {
    return null
  }
}