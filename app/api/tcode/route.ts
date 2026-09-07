import { NextResponse } from 'next/server';
import { tcodePublicConfig } from '@/lib/tcode/config';

export async function GET() {
  return NextResponse.json({ ok: true, ...tcodePublicConfig() });
}