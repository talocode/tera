import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPendingTransaction, confirmTransaction, getUserTransactions } from '@/lib/blockchain-lab/transactions';
import { createDemoWallet } from '@/lib/blockchain-lab/wallet';
import { createBlock } from '@/lib/blockchain-lab/blocks';
import { checkAndAwardBadges } from '@/lib/blockchain-lab/progress';
import { explainBlockchainEvent } from '@/lib/ai/blockchain-lab-tutor';
import { CreateTransactionInputSchema } from '@/lib/blockchain-lab/schemas';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await getUserTransactions(session.user.id);
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateTransactionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 });
    }

    const { fromWalletId, toWalletId, createDemoReceiver, amount, token } = parsed.data;

    let receiverWalletId = toWalletId;
    if (createDemoReceiver && !toWalletId) {
      const demoWallet = await createDemoWallet(session.user.id);
      receiverWalletId = demoWallet.id;
    }

    if (!receiverWalletId) {
      return NextResponse.json({ error: 'No receiver wallet specified' }, { status: 400 });
    }

    const pendingTx = await createPendingTransaction(
      session.user.id,
      fromWalletId,
      receiverWalletId,
      token,
      amount
    );

    const block = await createBlock(session.user.id, [pendingTx.id]);
    const confirmedTx = await confirmTransaction(pendingTx.id, block.id);

    await checkAndAwardBadges(session.user.id);

    const explanation = await explainBlockchainEvent('transaction', {
      token,
      amount,
      gasFee: confirmedTx.gasFee,
      status: confirmedTx.status,
    });

    return NextResponse.json({
      transaction: confirmedTx,
      block,
      explanation,
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    const message = error instanceof Error ? error.message : 'Failed to create transaction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}