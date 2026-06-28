import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateCliToken(): string {
  return `codra_${crypto.randomBytes(32).toString('hex')}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_code } = body;

    if (!device_code) {
      return NextResponse.json(
        { error: 'device_code is required' },
        { status: 400 }
      );
    }

    // Find the device session
    const { data: session, error: fetchError } = await supabaseServer
      .from('codra_device_auth_sessions')
      .select('*')
      .eq('device_code', device_code)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({
        success: true,
        status: 'pending'
      });
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      await supabaseServer
        .from('codra_device_auth_sessions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('device_code', device_code);

      return NextResponse.json({
        success: true,
        status: 'expired'
      });
    }

    // Check if denied
    if (session.status === 'denied') {
      return NextResponse.json({
        success: true,
        status: 'denied'
      });
    }

    // Check if approved
    if (session.status === 'approved' && session.user_id) {
      // Generate CLI token
      const cliToken = generateCliToken();
      const tokenHash = hashToken(cliToken);

      // Store token hash (for future verification)
      await supabaseServer
        .from('codra_device_auth_sessions')
        .update({ 
          cli_token_hash: tokenHash,
          cli_token_prefix: cliToken.substring(0, 10),
          updated_at: new Date().toISOString() 
        })
        .eq('device_code', device_code);

      // Get user info
      const { data: user } = await supabaseServer
        .from('users')
        .select('email')
        .eq('id', session.user_id)
        .single();

      return NextResponse.json({
        success: true,
        status: 'approved',
        token: cliToken,
        email: user?.email || session.email,
        user_id: session.user_id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      });
    }

    // Still pending
    return NextResponse.json({
      success: true,
      status: 'pending'
    });

  } catch (error) {
    console.error('Device auth poll error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
