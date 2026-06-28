import { NextResponse } from 'next/server';

export function browserApiOk(data: Record<string, unknown>, status: number = 200) {
  return NextResponse.json(
    { ok: true, ...data },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
}

export function browserApiError(error: string, status: number = 500, details?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, error, ...details },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
}

export function browserApiUnauthorized() {
  return NextResponse.json(
    { ok: false, error: 'Unauthorized' },
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
}

export function browserApiValidationError(message: string) {
  return NextResponse.json(
    { ok: false, error: message },
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
}
