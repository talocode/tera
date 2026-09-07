import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TcodeError } from '@/lib/tcode/crypto';
import { resolveLinkedWallet } from '@/lib/blockchain-lab/real/wallet';
import { getBalanceLamports, getLatestBlockhash } from '@/lib/blockchain-lab/real/rpc';
import { buildSolTransferMessage, serializeUnsignedTransaction } from '@/lib/blockchain-lab/real/tx';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.to || !body.amount) {
      return NextResponse.json({ error: 'to and amount are required' }, { status: 400 });
    }

    const to = String(body.to).trim();
    if (to.length !== 44 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(to)) {
      return NextResponse.json({ error: 'Invalid recipient address' }, { status: 400 });
    }

    const amountSol = Number(body.amount);
    if (!Number.isFinite(amountSol) || amountSol <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const { walletAddress: from } = await resolveLinkedWallet(session.user.id);
    if (from === to) {
      return NextResponse.json({ error: 'Cannot send to your own wallet' }, { status: 400 });
    }

    const lamports = BigInt(Math.floor(amountSol * 1e9));
    const balanceLamports = await getBalanceLamports(from);
    const rentExempt = 890880n;
    if (BigInt(balanceLamports) <= lamports + rentExempt) {
      return NextResponse.json(
        { error: `Insufficient SOL. Need at least ${lamports + rentExempt - BigInt(balanceLamports)} more lamports.` },
        { status: 400 },
      );
    }

    const blockhash = await getLatestBlockhash();
    const message = buildSolTransferMessage({ feePayer: from, to, lamports, blockhash });
    const unsignedTx = serializeUnsignedTransaction(message);
    const transactionBase64 = Buffer.from(unsignedTx).toString('base64');

    return NextResponse.json({
      from,
      to,
      amountSol,
      lamports: lamports.toString(),
      blockhash,
      transactionBase64,
    });
  } catch (error) {
    if (error instanceof TcodeError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Error preparing transfer:', error);
    return NextResponse.json({ error: 'Failed to prepare transfer' }, { status: 500 });
  }
}