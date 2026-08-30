import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { TcodeError } from '@/lib/tcode/crypto';
import { getLink } from '@/lib/tcode/store';
import { getTransaction } from '@/lib/blockchain-lab/real/rpc';
import { getLiveWalletView } from '@/lib/blockchain-lab/real/wallet';
import { checkAndAwardBadges } from '@/lib/blockchain-lab/progress';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.signature) {
      return NextResponse.json({ error: 'signature is required' }, { status: 400 });
    }

    let signature = String(body.signature).trim();
    if (!/^[a-zA-Z0-9]{80,90}$/.test(signature)) {
      return NextResponse.json({ error: 'Invalid transaction signature' }, { status: 400 });
    }

    const link = await getLink(session.user.id);
    let credited = false;
    let tx;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      tx = await getTransaction(signature).catch(() => null);
      if (tx && tx.transaction?.signatures?.[0] === signature) break;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    if (!tx || tx.transaction?.signatures?.[0] !== signature) {
      throw new TcodeError(404, 'not_found', 'Transaction not found on chain yet');
    }

    const { error: insertError } = await supabaseServer
      .from('credit_usage_events')
      .insert({
        user_id: session.user.id,
        event_type: 'solana_lab_send',
        credits_charged: 0,
        token_usage: 0,
        metadata: {
          kind: 'solana_lab_send',
          signature,
          slot: tx.slot ?? 0,
          blockTime: tx.blockTime ?? null,
          success: tx.meta?.err == null,
          feeLamports: tx.meta?.fee ?? 0,
          from: link?.walletAddress || null,
          recordedAt: new Date().toISOString(),
        },
      })

    if (insertError) {
      console.error('[solana_lab_send_record_failed]', { userId: session.user.id, signature, error: insertError })
    }

    const awarded = await checkAndAwardBadges(session.user.id);
    const live = await getLiveWalletView(session.user.id);

    return NextResponse.json({
      ok: true,
      signature,
      success: tx.meta?.err == null,
      slot: tx.slot ?? 0,
      credited,
      badges: awarded,
      wallet: live,
    });
  } catch (error) {
    if (error instanceof TcodeError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Error confirming transfer:', error);
    return NextResponse.json({ error: 'Failed to confirm transfer' }, { status: 500 });
  }
}