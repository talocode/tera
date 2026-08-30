import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TcodeError } from '@/lib/tcode/crypto';
import { linkWallet } from '@/lib/tcode/store';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.walletAddress || !body.signature || !body.nonce) {
      return NextResponse.json(
        { ok: false, error: 'walletAddress, signature, and nonce are required' },
        { status: 400 },
      );
    }

    const linked = await linkWallet({
      userId: session.user.id,
      walletAddress: String(body.walletAddress).trim(),
      signature: String(body.signature),
      nonce: String(body.nonce),
    });
    return NextResponse.json({ ok: true, ...linked });
  } catch (error) {
    if (error instanceof TcodeError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Error linking TCODE wallet:', error);
    return NextResponse.json({ ok: false, error: 'Failed to link wallet' }, { status: 500 });
  }
}