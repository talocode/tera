import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({
        ok: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      }
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: 'Session check failed'
    }, { status: 500 });
  }
}
