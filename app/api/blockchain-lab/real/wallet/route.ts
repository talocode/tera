import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TcodeError } from '@/lib/tcode/crypto';
import { getLiveWalletView, getParsedTransactionList } from '@/lib/blockchain-lab/real/wallet';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const view = await getLiveWalletView(session.user.id);
    const transactions = await getParsedTransactionList(session.user.id, 12);

    return NextResponse.json({ wallet: view, transactions });
  } catch (error) {
    if (error instanceof TcodeError && error.code === 'not_found') {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 404 });
    }
    console.error('Error fetching live wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch live wallet data' }, { status: 500 });
  }
}