import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createSimulatedWallet, getUserWalletsWithBalances, createDemoWallet } from '@/lib/blockchain-lab/wallet';
import { CreateWalletInputSchema } from '@/lib/blockchain-lab/schemas';

export async function GET() {
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
      const wallet = await createDemoWallet(session.user.id);
      const balances = await getUserWalletsWithBalances(session.user.id);
      const createdWallet = balances.find((w) => w.id === wallet.id);
      return NextResponse.json({ wallet: createdWallet });
    }

    const { wallet, balances } = await createSimulatedWallet(session.user.id, label);
    return NextResponse.json({ wallet: { ...wallet, balances } });
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
  }
}