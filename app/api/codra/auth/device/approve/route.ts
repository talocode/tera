import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { auth } from '@/lib/auth';

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

    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the device session
    const { data: deviceSession, error: fetchError } = await supabaseServer
      .from('codra_device_auth_sessions')
      .select('*')
      .eq('device_code', device_code)
      .eq('status', 'pending')
      .single();

    if (fetchError || !deviceSession) {
      return NextResponse.json(
        { error: 'Invalid or expired device code' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(deviceSession.expires_at) < new Date()) {
      await supabaseServer
        .from('codra_device_auth_sessions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('device_code', device_code);

      return NextResponse.json(
        { error: 'Device code expired' },
        { status: 410 }
      );
    }

    // Approve the device session
    const { error: updateError } = await supabaseServer
      .from('codra_device_auth_sessions')
      .update({
        status: 'approved',
        user_id: session.user.id,
        email: session.user.email,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('device_code', device_code);

    if (updateError) {
      console.error('Error approving device session:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve device session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Device session approved'
    });

  } catch (error) {
    console.error('Device auth approve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
