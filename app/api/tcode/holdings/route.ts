import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TcodeError } from '@/lib/tcode/crypto';
import { getHoldings } from '@/lib/tcode/store';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rawBalance = request.nextUrl?.searchParams?.get('rawBalance')
    if (rawBalance != null) {
      return NextResponse.json(
        { ok: false, error: 'rawBalance is not accepted; holdings are read on-chain' },
        { status: 400 },
      );
    }

    const holdings = await getHoldings(session.user.id);
    return NextResponse.json({ ok: true, ...holdings });
  } catch (error) {
    if (error instanceof TcodeError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Error fetching TCODE holdings:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch holdings' }, { status: 500 });
  }
}