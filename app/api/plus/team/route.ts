import { supabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendTeamInviteEmail } from '@/lib/transactional-emails'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify user is Plus plan
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('subscription_plan')
      .eq('id', userId)
      .single()

    if (userError || user?.subscription_plan !== 'plus') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch team members
    const { data: members, error } = await supabaseServer
      .from('team_members')
      .select('id, member_email, role, joined_at')
      .eq('owner_id', userId)
      .order('joined_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      members: members?.map(m => ({
        id: m.id,
        memberEmail: m.member_email,
        role: m.role || 'collaborator',
        joinedAt: m.joined_at
      })) || []
    })
  } catch (error) {
    console.error('Team fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const ownerUserId = session?.user?.id
    if (!ownerUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { inviteeEmail, role } = await request.json()

    if (!ownerUserId || !inviteeEmail) {
      return NextResponse.json(
        { error: 'Owner ID and email required' },
        { status: 400 }
      )
    }

    // Verify owner is Plus plan
    const { data: owner, error: ownerError } = await supabaseServer
      .from('users')
      .select('subscription_plan')
      .eq('id', ownerUserId)
      .single()

    if (ownerError || owner?.subscription_plan !== 'plus') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if member already exists
    const { data: existing } = await supabaseServer
      .from('team_members')
      .select('id')
      .eq('owner_id', ownerUserId)
      .eq('member_email', inviteeEmail.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Member already in team' },
        { status: 409 }
      )
    }

    // Add team member
    const { data: member, error } = await supabaseServer
      .from('team_members')
      .insert({
        owner_id: ownerUserId,
        member_email: inviteeEmail.toLowerCase(),
        role: role || 'collaborator'
      })
      .select()
      .single()

    if (error) throw error

    sendTeamInviteEmail({
      ownerUserId,
      ownerEmail: session.user?.email,
      inviteeEmail: member.member_email,
      role: member.role || 'collaborator',
    }).catch((error) => console.error('[team_invite_email_failed]', { ownerUserId, inviteeEmail: member.member_email, error }))

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        memberEmail: member.member_email,
        role: member.role
      }
    })
  } catch (error) {
    console.error('Team invite error:', error)
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const ownerUserId = session?.user?.id
    if (!ownerUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const memberId = request.nextUrl.searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
    }

    // Delete team member
    const { error } = await supabaseServer
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('owner_id', ownerUserId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Team delete error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
