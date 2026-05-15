import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchExplorer, getRecentExplorerActivity, getWalletExplorerView, getTransactionExplorerView, getBlockExplorerView } from '@/lib/blockchain-lab/explorer';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const walletId = searchParams.get('walletId');
    const txId = searchParams.get('txId');
    const blockId = searchParams.get('blockId');

    if (walletId) {
      const walletView = await getWalletExplorerView(session.user.id, walletId);
      if (!walletView) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }
      return NextResponse.json({ wallet: walletView });
    }

    if (txId) {
      const txView = await getTransactionExplorerView(session.user.id, txId);
      if (!txView) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      return NextResponse.json({ transaction: txView });
    }

    if (blockId) {
      const blockView = await getBlockExplorerView(session.user.id, blockId);
      if (!blockView) {
        return NextResponse.json({ error: 'Block not found' }, { status: 404 });
      }
      return NextResponse.json({ block: blockView });
    }

    if (query) {
      const result = await searchExplorer(session.user.id, query);
      if (!result) {
        return NextResponse.json({ error: 'No results found' }, { status: 404 });
      }
      return NextResponse.json({ result });
    }

    const activity = await getRecentExplorerActivity(session.user.id);
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error in explorer:', error);
    return NextResponse.json({ error: 'Explorer error' }, { status: 500 });
  }
}