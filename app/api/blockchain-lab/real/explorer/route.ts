import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TcodeError } from '@/lib/tcode/crypto';
import {
  getLatestBlocks,
  getLiveAddressView,
  getLiveBlockView,
  getLiveTxView,
  searchLiveExplorer,
} from '@/lib/blockchain-lab/real/explorer';

function isSolanaAddress(value: string): boolean {
  return value.length === 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(value)
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;

    if (params.get('recent') === '1') {
      const blocks = await getLatestBlocks(8);
      return NextResponse.json({ blocks });
    }

    const q = (params.get('q') || '').trim();
    if (!q) {
      const blocks = await getLatestBlocks(8);
      return NextResponse.json({ blocks });
    }

    if (params.get('type') === 'block' || /^\d{1,12}$/.test(q)) {
      const block = await getLiveBlockView(Number(q))
        .catch(() => null);
      if (block) return NextResponse.json({ kind: 'block', block });
      return NextResponse.json({ kind: 'notfound' }, { status: 404 });
    }

    if (params.get('type') === 'transaction' || /^[a-zA-Z0-9]{80,90}$/.test(q)) {
      const tx = await getLiveTxView(q).catch(() => null);
      if (tx) return NextResponse.json({ kind: 'transaction', transaction: tx });
      return NextResponse.json({ kind: 'notfound' }, { status: 404 });
    }

    if (params.get('type') === 'address' || isSolanaAddress(q)) {
      const address = await getLiveAddressView(q).catch(() => null);
      if (address) return NextResponse.json({ kind: 'address', address });
      return NextResponse.json({ kind: 'notfound' }, { status: 404 });
    }

    return NextResponse.json({ kind: 'incomplete' }, { status: 400 });
  } catch (error) {
    if (error instanceof TcodeError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Error in live explorer:', error);
    return NextResponse.json({ error: 'Failed to query the live explorer' }, { status: 500 });
  }
}