import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserBlocks, createBlock } from '@/lib/blockchain-lab/blocks';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blocks = await getUserBlocks(session.user.id);
    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const transactionIds = body.transactionIds || [];

    const block = await createBlock(session.user.id, transactionIds);
    return NextResponse.json({ block });
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json({ error: 'Failed to create block' }, { status: 500 });
  }
}