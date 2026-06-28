import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createSimulatedWallet, createDemoWallet, getUserWalletsWithBalances } from '@/lib/blockchain-lab/wallet';
import { CreateWalletInputSchema } from '@/lib/blockchain-lab/schemas';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallets = await getUserWalletsWithBalances(session.user.id);
    return NextResponse.json({ wallets });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateWalletInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 });
    }

    const { label, createDemo } = parsed.data;

    if (createDemo) {
      const { wallet, balances } = await createDemoWallet(session.user.id);
      return NextResponse.json({ wallet: { ...wallet, balances } });
    }

    const { wallet, balances } = await createSimulatedWallet(session.user.id, label);
    return NextResponse.json({ wallet: { ...wallet, balances } });
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
  }
}
