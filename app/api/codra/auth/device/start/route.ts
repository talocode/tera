import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

function generateDeviceCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cli_version, platform } = body;

    const deviceCode = generateDeviceCode();
    const userCode = generateUserCode();
    const expiresIn = 5 * 60 * 1000; // 5 minutes
    const expiresAt = new Date(Date.now() + expiresIn).toISOString();

    // Store device session in database
    const { error: insertError } = await supabaseServer
      .from('codra_device_auth_sessions')
      .insert({
        device_code: deviceCode,
        user_code: userCode,
        status: 'pending',
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating device session:', insertError);
      return NextResponse.json(
        { error: 'Failed to create device session' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://teraai.chat';
    const verificationUrl = `${baseUrl}/auth/signin?source=codra-code&device_code=${deviceCode}&redirect_to=${encodeURIComponent('/codra-code/auth/success?device_code=' + deviceCode)}`;

    return NextResponse.json({
      success: true,
      device_code: deviceCode,
      user_code: userCode,
      verification_url: verificationUrl,
      expires_at: expiresAt,
      interval: 2
    });

  } catch (error) {
    console.error('Device auth start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
