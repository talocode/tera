import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TcodeError } from '@/lib/tcode/crypto';
import { createChallenge } from '@/lib/tcode/store';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const challenge = await createChallenge(session.user.id);
    return NextResponse.json({ ok: true, ...challenge });
  } catch (error) {
    if (error instanceof TcodeError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Error creating TCODE challenge:', error);
    return NextResponse.json({ ok: false, error: 'Failed to create challenge' }, { status: 500 });
  }
}