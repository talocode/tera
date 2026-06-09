'use client'

import { useEffect, useState } from 'react'

type TeamMember = {
  id: string
  memberEmail: string
  role: string
  joinedAt: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [role, setRole] = useState('collaborator')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plus/team')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load team')
      setMembers(data.members || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchMembers()
  }, [])

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return

    try {
      const response = await fetch('/api/plus/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteeEmail: inviteEmail.trim(), role })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to invite member')
      setInviteEmail('')
      await fetchMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member')
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/plus/team?memberId=${memberId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to remove member')
      await fetchMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="tera-eyebrow">Team</p>
        <h2 className="mt-3 text-3xl font-semibold text-tera-primary">Collaborator access</h2>
        <p className="mt-3 text-sm text-tera-secondary">Invite collaborators to your Plus workspace and manage access roles.</p>
      </div>

      {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="tera-card space-y-3">
        <h3 className="text-lg font-semibold text-tera-primary">Invite a member</h3>
        <div className="flex flex-col gap-3 md:flex-row">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@school.edu" className="tera-input flex-1" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="tera-input md:w-48">
            <option value="collaborator">Collaborator</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button type="button" onClick={inviteMember} className="tera-button-upgrade justify-center">Send invite</button>
        </div>
      </div>

      <div className="tera-card">
        <h3 className="text-lg font-semibold text-tera-primary">Current members</h3>
        {loading ? <p className="mt-4 text-sm text-tera-secondary">Loading team...</p> : (
          <div className="mt-4 space-y-3">
            {members.length === 0 && <p className="text-sm text-tera-secondary">No members yet.</p>}
            {members.map((member) => (
              <div key={member.id} className="tera-card-subtle flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-tera-primary">{member.memberEmail}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-tera-secondary">{member.role} • Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                </div>
                <button type="button" onClick={() => removeMember(member.id)} className="tera-button-secondary justify-center">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
