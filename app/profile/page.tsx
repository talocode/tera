'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import UsageMetricCard from '@/components/UsageMetricCard'
import UsageHistoryChart from '@/components/UsageHistoryChart'
import {
  addUserMemory,
  fetchCreditUsage,
  fetchUserMemories,
  fetchUserProfile,
  fetchUserSessions,
  fetchUserUsageSummary,
  fetchWeeklyUsageHistory,
  deleteUserMemory,
  updateUserProfile,
} from '@/app/actions/user'
import { CREDITS_PER_USD } from '@/lib/credit-topup'
import { createSavedWorkflow, loadSavedWorkflows, persistSavedWorkflows, type SavedWorkflow } from '@/lib/saved-workflows'
import { buildUsageMetricSummary, type ProfileUsageSummary } from '@/lib/profile-usage'
import { TERA_USAGE_REFRESH_EVENT } from '@/lib/usage-events'
import type { UserProfile } from '@/lib/usage-tracking'

type CreditUsageState = {
  used: number
  remaining: number
  total: number
  resetDate: string | null
} | null

type UsageHistoryData = {
  date: string
  used: number
}

type TopupCheckoutNotice = {
  amountUsd: number
  credits: number
  rate: number
}

type UserMemory = {
  id: string
  memory_text: string
  created_at: string
}

function formatMemberSince(createdAt: Date) {
  return createdAt.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [usageSummary, setUsageSummary] = useState<ProfileUsageSummary | null>(null)
  const [creditUsage, setCreditUsage] = useState<CreditUsageState>(null)
  const [usageHistory, setUsageHistory] = useState<UsageHistoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [usageLoading, setUsageLoading] = useState(true)
  const [creditsLoading, setCreditsLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [usageError, setUsageError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ fullName: '', school: '', gradeLevels: [] as string[] })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [topupAmountUsd, setTopupAmountUsd] = useState('1')
  const [creditPackLoading, setCreditPackLoading] = useState(false)
  const [topupCheckoutNotice, setTopupCheckoutNotice] = useState<TopupCheckoutNotice | null>(null)
  const [memories, setMemories] = useState<UserMemory[]>([])
  const [memoriesLoading, setMemoriesLoading] = useState(true)
  const [memoryDraft, setMemoryDraft] = useState('')
  const [memorySaving, setMemorySaving] = useState(false)
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([])
  const [workflowName, setWorkflowName] = useState('')
  const [workflowPrompt, setWorkflowPrompt] = useState('')
  const [memorySearch, setMemorySearch] = useState('')
  const [workflowSearch, setWorkflowSearch] = useState('')
  const [savedWorkflowsLoaded, setSavedWorkflowsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedNotice = window.sessionStorage.getItem('tera_credit_topup_checkout')
    if (!storedNotice) return

    try {
      const parsed = JSON.parse(storedNotice) as TopupCheckoutNotice
      if (Number.isFinite(parsed.amountUsd) && Number.isFinite(parsed.credits) && Number.isFinite(parsed.rate)) {
        setTopupCheckoutNotice(parsed)
      }
    } catch (error) {
      console.error('Error reading top-up checkout notice:', error)
    } finally {
      window.sessionStorage.removeItem('tera_credit_topup_checkout')
    }
  }, [])

  useEffect(() => {
    setSavedWorkflows(loadSavedWorkflows())
    setSavedWorkflowsLoaded(true)
  }, [])

  useEffect(() => {
    if (!savedWorkflowsLoaded) return
    persistSavedWorkflows(savedWorkflows)
  }, [savedWorkflows, savedWorkflowsLoaded])

  const loadUsageSummary = useCallback(async () => {
    if (!user) return

    setUsageLoading(true)
    try {
      const summary = await fetchUserUsageSummary(user.id)
      if (!summary) throw new Error('Usage summary unavailable')
      setUsageSummary(summary)
      setUsageError(null)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading usage summary:', error)
      setUsageSummary(null)
      setUsageError('Usage counters could not be loaded. Try refreshing in a moment.')
    } finally {
      setUsageLoading(false)
    }
  }, [user])

  const loadCreditUsage = useCallback(async () => {
    if (!user) return

    setCreditsLoading(true)
    try {
      const usage = await fetchCreditUsage(user.id)
      if (!usage) throw new Error('Credit usage unavailable')
      setCreditUsage(usage)
      setUsageError(null)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading credit usage:', error)
      setCreditUsage(null)
      setUsageError('AI credit usage could not be loaded. Try refreshing in a moment.')
    } finally {
      setCreditsLoading(false)
    }
  }, [user])

  const loadUsageHistory = useCallback(async () => {
    if (!user) return

    setHistoryLoading(true)
    try {
      const history = await fetchWeeklyUsageHistory(user.id)
      setUsageHistory(history)
    } catch (error) {
      console.error('Error loading usage history:', error)
      setUsageHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [user])

  const loadRecentSessions = useCallback(async () => {
    if (!user) return

    setSessionsLoading(true)
    try {
      const sessions = await fetchUserSessions(user.id)
      setRecentSessions(sessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
      setRecentSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }, [user])

  const loadMemories = useCallback(async () => {
    if (!user) return

    setMemoriesLoading(true)
    try {
      const items = await fetchUserMemories(user.id)
      setMemories(items as UserMemory[])
    } catch (error) {
      console.error('Error loading memories:', error)
      setMemories([])
    } finally {
      setMemoriesLoading(false)
    }
  }, [user])

  const loadProfile = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await fetchUserProfile(user.id)
      if (data) {
        setProfile(data)
        setFormData({
          fullName: data.fullName || '',
          school: data.school || '',
          gradeLevels: data.gradeLevels || [],
        })
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  const refreshUsage = useCallback(() => {
    void Promise.all([loadUsageSummary(), loadCreditUsage(), loadUsageHistory()])
  }, [loadCreditUsage, loadUsageHistory, loadUsageSummary])

  useEffect(() => {
    if (!user) return

    void Promise.all([
      loadProfile(),
      loadUsageSummary(),
      loadCreditUsage(),
      loadUsageHistory(),
      loadRecentSessions(),
      loadMemories(),
    ])
  }, [loadCreditUsage, loadMemories, loadProfile, loadRecentSessions, loadUsageSummary, loadUsageHistory, user])

  useEffect(() => {
    window.addEventListener(TERA_USAGE_REFRESH_EVENT, refreshUsage)
    return () => window.removeEventListener(TERA_USAGE_REFRESH_EVENT, refreshUsage)
  }, [refreshUsage])

  const handleSave = async () => {
    if (!user || !profile) return

    setSaving(true)
    try {
      await updateUserProfile(user.id, { ...profile, ...formData })
      setProfile({ ...profile, ...formData })
      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!user) return

    setPortalLoading(true)
    try {
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      if (!response.ok) throw new Error('Failed to create portal session')
      const { portalUrl } = await response.json()
      if (portalUrl) window.location.href = portalUrl
    } catch (error) {
      console.error('Error opening portal:', error)
      alert('Failed to load billing portal. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleAddCredits = async () => {
    if (!user?.email) return
    setCreditPackLoading(true)
    try {
      const amountUsd = Number(topupAmountUsd)
      if (!Number.isFinite(amountUsd) || amountUsd < 1) {
        alert('Minimum top-up is $1.')
        return
      }

      const response = await fetch('/api/billing/create-credit-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUsd,
          email: user.email,
          returnUrl: `${window.location.origin}/profile`,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || 'Failed to create checkout session')
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'tera_credit_topup_checkout',
          JSON.stringify({
            amountUsd,
            credits: Number(data.credits || 0),
            rate: CREDITS_PER_USD,
          }),
        )
      }
      window.location.href = data.checkoutUrl
    } catch (error) {
      console.error('Error opening credit pack checkout:', error)
      alert('Failed to load credit checkout. Please try again.')
    } finally {
      setCreditPackLoading(false)
    }
  }

  const handleSaveMemory = async () => {
    if (!user?.id) return

    const cleaned = memoryDraft.trim()
    if (!cleaned) return

    setMemorySaving(true)
    try {
      const created = await addUserMemory(user.id, cleaned)
      if (created) {
        setMemories((current) => [{ id: created.id, memory_text: created.memory_text, created_at: created.created_at }, ...current])
        setMemoryDraft('')
      }
    } catch (error) {
      console.error('Error saving memory:', error)
    } finally {
      setMemorySaving(false)
    }
  }

  const handleDeleteMemory = async (memoryId: string) => {
    if (!user?.id) return

    const removed = await deleteUserMemory(user.id, memoryId)
    if (removed) {
      setMemories((current) => current.filter((memory) => memory.id !== memoryId))
    }
  }

  const handleSaveWorkflow = () => {
    const name = workflowName.trim()
    const prompt = workflowPrompt.trim()

    if (!name || !prompt) return

    setSavedWorkflows((current) => [createSavedWorkflow(name, prompt), ...current])
    setWorkflowName('')
    setWorkflowPrompt('')
  }

  const handleDeleteWorkflow = (workflowId: string) => {
    setSavedWorkflows((current) => current.filter((workflow) => workflow.id !== workflowId))
  }

  const exportJson = (filename: string, payload: unknown) => {
    if (typeof window === 'undefined') return

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const filteredMemories = useMemo(
    () => memories.filter((memory) => memory.memory_text.toLowerCase().includes(memorySearch.toLowerCase())),
    [memorySearch, memories],
  )

  const filteredWorkflows = useMemo(
    () => savedWorkflows.filter((workflow) => `${workflow.name} ${workflow.prompt}`.toLowerCase().includes(workflowSearch.toLowerCase())),
    [savedWorkflows, workflowSearch],
  )

  const topupAmount = Number(topupAmountUsd)
  const estimatedTopupCredits =
    Number.isFinite(topupAmount) && topupAmount >= 1 ? Math.max(1, Math.floor(topupAmount * CREDITS_PER_USD)) : null

  if (loading) {
    return <div className="tera-page flex items-center justify-center text-sm text-tera-secondary">Loading profile...</div>
  }

  if (!profile || !user) {
    return <div className="tera-page flex items-center justify-center text-sm text-tera-secondary">Unable to load profile.</div>
  }

  const email = user.email || ''
  const displayName = formData.fullName || profile.fullName || (email ? email.split('@')[0] : '') || 'User'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const creditMetric = creditUsage
    ? buildUsageMetricSummary(
        creditUsage.used,
        creditUsage.total,
        creditUsage.resetDate ? new Date(creditUsage.resetDate) : null,
      )
    : null

  const usageCardsLoading = usageLoading || creditsLoading
  const usageCardsUnavailable = !usageCardsLoading && (!usageSummary || !creditMetric)
  const weeklyTotal = usageHistory.reduce((sum, day) => sum + day.used, 0)
  const sessionCount = Math.max(1, recentSessions.length)

  const activeLimitNotice = (() => {
    if (!usageSummary || !creditUsage) return null

    if (creditUsage.remaining <= 0) {
      return {
        title: 'Computational credits reached',
        message: 'Tera blocks new prompts when AI computational credits are exhausted.',
      }
    }

    if (!usageSummary.uploads.isUnlimited && usageSummary.uploads.remaining === 0) {
      return {
        title: 'File upload limit reached',
        message: 'Tera can still chat, but new file uploads are blocked until your upload allowance resets or you upgrade.',
      }
    }

    return null
  })()

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        {topupCheckoutNotice && (
          <section className="tera-surface mb-8 border border-emerald-400/20 bg-emerald-500/10 px-6 py-4">
            <p className="tera-eyebrow">Checkout confirmation</p>
            <p className="mt-2 text-sm leading-7 text-tera-primary">
              Your top-up checkout was created for ${topupCheckoutNotice.amountUsd.toFixed(2)} and will add {topupCheckoutNotice.credits.toLocaleString()} credits at {topupCheckoutNotice.rate.toLocaleString()} credits per $1 once payment completes.
            </p>
          </section>
        )}
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Workspace</p>
            <h1 className="tera-title mt-3">Profile</h1>
            <p className="tera-subtitle mt-4">Manage your identity, review live usage across Tera, and keep subscription details close to the main workspace.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {editing ? (
              <>
                <button type="button" onClick={() => setEditing(false)} className="tera-button-secondary" disabled={saving}>Cancel</button>
                <button type="button" onClick={handleSave} className="tera-button-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
              </>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="tera-button-secondary">Edit profile</button>
            )}
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/history" className="tera-surface block p-5 transition hover:border-white/16 hover:bg-white/[0.05]">
            <p className="tera-eyebrow">Search</p>
            <h2 className="mt-3 text-lg font-semibold text-tera-primary">Chat history</h2>
            <p className="mt-2 text-sm leading-7 text-tera-secondary">Search past sessions and reopen them instantly.</p>
          </Link>
          <Link href="/notes" className="tera-surface block p-5 transition hover:border-white/16 hover:bg-white/[0.05]">
            <p className="tera-eyebrow">Notes</p>
            <h2 className="mt-3 text-lg font-semibold text-tera-primary">Saved notes</h2>
            <p className="mt-2 text-sm leading-7 text-tera-secondary">Review extracted ideas and working context.</p>
          </Link>
          <Link href="/images" className="tera-surface block p-5 transition hover:border-white/16 hover:bg-white/[0.05]">
            <p className="tera-eyebrow">Uploads</p>
            <h2 className="mt-3 text-lg font-semibold text-tera-primary">File and image archive</h2>
            <p className="mt-2 text-sm leading-7 text-tera-secondary">Review uploaded assets in one place.</p>
          </Link>
          <button
            type="button"
            onClick={() => exportJson('tera-profile-data.json', { memories, workflows: savedWorkflows, profile, usageSummary, creditUsage })}
            className="tera-surface p-5 text-left transition hover:border-white/16 hover:bg-white/[0.05]"
          >
            <p className="tera-eyebrow">Export</p>
            <h2 className="mt-3 text-lg font-semibold text-tera-primary">Profile data</h2>
            <p className="mt-2 text-sm leading-7 text-tera-secondary">Download memories, workflows, and profile data as JSON.</p>
          </button>
        </section>

        <section className="tera-surface mt-8 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="tera-eyebrow">Project memory</p>
              <h2 className="mt-3 text-2xl font-semibold text-tera-primary">What Tera should remember about you</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-tera-secondary">
                Add persistent facts, preferences, or project context. Tera already learns from conversations automatically, and these entries give you direct control over the most important memory signals.
              </p>
            </div>
            <div className="w-full max-w-2xl">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={memoryDraft}
                  onChange={(event) => setMemoryDraft(event.target.value)}
                  className="tera-input flex-1"
                  placeholder="Example: Prefer concise answers with code examples."
                />
                <button type="button" onClick={handleSaveMemory} disabled={memorySaving || !memoryDraft.trim()} className="tera-button-secondary justify-center disabled:opacity-60">
                  {memorySaving ? 'Saving...' : 'Save memory'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  value={memorySearch}
                  onChange={(event) => setMemorySearch(event.target.value)}
                  className="tera-input h-11 flex-1 min-w-[14rem]"
                  placeholder="Search memories"
                />
                <button
                  type="button"
                  onClick={() => exportJson('tera-memories.json', memories)}
                  className="tera-button-secondary justify-center"
                >
                  Export memories
                </button>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-tera-secondary">
                {filteredMemories.length.toLocaleString()} visible memory{filteredMemories.length === 1 ? '' : 'ies'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {memoriesLoading ? (
              <p className="text-sm text-tera-secondary">Loading memories...</p>
            ) : filteredMemories.length === 0 ? (
              <p className="text-sm text-tera-secondary">{memories.length === 0 ? 'No saved memories yet.' : 'No memories match that search.'}</p>
            ) : (
              filteredMemories.map((memory) => (
                <div key={memory.id} className="rounded-[22px] border border-tera-border bg-white/[0.03] px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-7 text-tera-primary">{memory.memory_text}</p>
                    <button type="button" onClick={() => void handleDeleteMemory(memory.id)} className="text-xs uppercase tracking-[0.22em] text-tera-secondary transition hover:text-tera-primary">
                      Remove
                    </button>
                  </div>
                  <p className="mt-3 text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">
                    {new Date(memory.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="tera-surface mt-8 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="tera-eyebrow">Saved workflows</p>
              <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Reusable prompts you can launch again</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-tera-secondary">
                Save a prompt once, then open it back in chat with one click. This uses the existing `initialPrompt` path and keeps repetitive work out of your head.
              </p>
            </div>
            <div className="w-full max-w-2xl space-y-3">
              <input
                value={workflowName}
                onChange={(event) => setWorkflowName(event.target.value)}
                className="tera-input w-full"
                placeholder="Workflow name"
              />
              <textarea
                value={workflowPrompt}
                onChange={(event) => setWorkflowPrompt(event.target.value)}
                className="tera-input min-h-[120px] w-full resize-y"
                placeholder="Prompt text to reuse"
              />
              <div className="flex justify-end">
                <button type="button" onClick={handleSaveWorkflow} disabled={!workflowName.trim() || !workflowPrompt.trim()} className="tera-button-secondary justify-center disabled:opacity-60">
                  Save workflow
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={workflowSearch}
                  onChange={(event) => setWorkflowSearch(event.target.value)}
                  className="tera-input h-11 flex-1 min-w-[14rem]"
                  placeholder="Search workflows"
                />
                <button
                  type="button"
                  onClick={() => exportJson('tera-workflows.json', savedWorkflows)}
                  className="tera-button-secondary justify-center"
                >
                  Export workflows
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredWorkflows.length === 0 ? (
              <p className="text-sm text-tera-secondary">{savedWorkflows.length === 0 ? 'No saved workflows yet.' : 'No workflows match that search.'}</p>
            ) : (
              filteredWorkflows.map((workflow) => (
                <div key={workflow.id} className="rounded-[22px] border border-tera-border bg-white/[0.03] px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-tera-primary">{workflow.name}</p>
                      <p className="mt-2 text-sm leading-7 text-tera-secondary line-clamp-3">{workflow.prompt}</p>
                    </div>
                    <button type="button" onClick={() => handleDeleteWorkflow(workflow.id)} className="text-xs uppercase tracking-[0.22em] text-tera-secondary transition hover:text-tera-primary">
                      Remove
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={`/new?prompt=${encodeURIComponent(workflow.prompt)}`} className="tera-button-primary">
                      Launch in chat
                    </Link>
                    <p className="self-center text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">
                      {new Date(workflow.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="tera-surface p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-gradient-to-br from-tera-neon/20 to-white/[0.04] text-3xl font-semibold text-tera-primary">
                  {initials}
                </div>
                <div className="min-w-0">
                  {editing ? (
                    <div className="space-y-4">
                      <input value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} className="tera-input w-full" placeholder="Full name" />
                      <input value={formData.school} onChange={(event) => setFormData({ ...formData, school: event.target.value })} className="tera-input w-full" placeholder="Organization or company" />
                      <input value={formData.gradeLevels.join(', ')} onChange={(event) => setFormData({ ...formData, gradeLevels: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} className="tera-input w-full" placeholder="Interests, comma separated" />
                    </div>
                  ) : (
                    <>
                      <p className="tera-eyebrow">Identity</p>
                      <h2 className="mt-3 text-3xl font-semibold text-tera-primary">{displayName}</h2>
                      <p className="mt-2 text-sm text-tera-secondary">{email}</p>
                      {formData.school && <p className="mt-2 text-sm text-tera-primary/90">{formData.school}</p>}
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-tera-border bg-white/[0.03] px-5 py-4 text-left md:min-w-[220px]">
                <p className="tera-eyebrow">Member since</p>
                <p className="mt-3 text-xl font-semibold text-tera-primary">{formatMemberSince(profile.createdAt)}</p>
                <p className="mt-2 text-sm text-tera-secondary">Usage cards refresh from the same tracked counters Tera updates while you work.</p>
              </div>
            </div>
          </div>

          <div className="tera-surface p-6 md:p-8">
            <p className="tera-eyebrow">Subscription</p>
            <h2 className="mt-3 text-3xl font-semibold text-tera-primary">{usageSummary?.planDisplayName || profile.subscriptionPlan}</h2>
            <p className="mt-3 text-sm leading-7 text-tera-secondary">Manage billing details and review your computational credits.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {profile.subscriptionPlan === 'free' ? (
                <Link href="/pricing" className="tera-button-primary">Upgrade</Link>
              ) : (
                <button type="button" onClick={handleManageSubscription} disabled={portalLoading} className="tera-button-secondary disabled:opacity-60">
                  {portalLoading ? 'Loading...' : 'Manage'}
                </button>
              )}
              <button type="button" onClick={refreshUsage} disabled={usageCardsLoading} className="tera-button-secondary disabled:opacity-60">
                {usageCardsLoading ? 'Refreshing...' : 'Refresh usage'}
              </button>
            </div>
            <div id="credit-packs" className="mt-4 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                step={1}
                value={topupAmountUsd}
                onChange={(event) => setTopupAmountUsd(event.target.value)}
                className="tera-input h-11 w-[150px]"
                aria-label="Top-up amount in USD"
              />
              <button type="button" onClick={() => void handleAddCredits()} disabled={creditPackLoading} className="tera-button-secondary justify-center disabled:opacity-60">
                {creditPackLoading ? 'Loading...' : 'Add credits ($1+)'}
              </button>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-tera-secondary">
              {CREDITS_PER_USD.toLocaleString()} credits per $1
              {estimatedTopupCredits ? ` · ${estimatedTopupCredits.toLocaleString()} credits for $${topupAmount.toFixed(2)}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="tera-eyebrow">Balance</p>
              <h2 className="mt-3 text-3xl font-semibold text-tera-primary">Usage dashboard</h2>
              <p className="mt-3 text-sm leading-7 text-tera-secondary">A live view of uploads and computational credits. AI conversations are not capped by message count.</p>
            </div>
            {lastUpdated && (
              <p className="pb-1 text-[10px] uppercase tracking-widest text-tera-secondary">
                Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {usageError && (
            <div className="mt-6 rounded-[22px] border border-red-400/30 bg-red-500/10 px-5 py-4">
              <p className="text-sm font-semibold text-red-100">Usage unavailable</p>
              <p className="mt-2 text-sm leading-7 text-red-50/90">{usageError}</p>
            </div>
          )}

          {activeLimitNotice && (
            <div className="mt-6 rounded-[22px] border border-amber-400/30 bg-amber-500/10 px-5 py-4">
              <p className="text-sm font-semibold text-amber-100">{activeLimitNotice.title}</p>
              <p className="mt-2 text-sm leading-7 text-amber-50/90">{activeLimitNotice.message}</p>
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {usageCardsLoading ? (
              <div className="tera-card lg:col-span-2">
                <p className="text-sm text-tera-secondary">Loading usage summary...</p>
              </div>
            ) : usageCardsUnavailable ? (
              <div className="tera-card lg:col-span-2">
                <p className="text-sm font-medium text-tera-primary">Usage data is temporarily unavailable.</p>
                <p className="mt-2 text-sm text-tera-secondary">Refresh again after a moment. If this persists, the server logs will show the failed usage read.</p>
              </div>
            ) : (
              <>
                <div className="tera-card h-full">
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div>
                      <p className="text-sm font-medium text-tera-secondary">AI conversations</p>
                      <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-tera-primary">Unlimited</p>
                      <p className="mt-3 text-sm text-tera-secondary">Tera does not block you based on a message-count quota. Computational credits are the active AI usage meter.</p>
                    </div>
                    <div>
                      <div className="h-4 overflow-hidden rounded-full bg-white/[0.08]">
                        <div className="h-full w-full rounded-full bg-tera-neon" />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-tera-secondary">
                        <span>Unlimited access</span>
                        <span>Always available</span>
                      </div>
                    </div>
                  </div>
                </div>
                <UsageMetricCard
                  title="AI computational credits"
                  metric={creditMetric!}
                  description="Credits are usage units. Roughly 5,000 AI tokens consume 1 credit."
                />
                <UsageMetricCard title="File uploads" metric={usageSummary!.uploads} />
                <UsageMetricCard
                  title="Web searches"
                  metric={usageSummary!.webSearches}
                  description="Deep Research uses Tavily and is capped monthly by plan."
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="tera-card">
            <p className="tera-eyebrow">Weekly trend</p>
            <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Usage history</h2>
            <p className="mt-3 text-sm leading-7 text-tera-secondary">Track credit consumption over the last 7 days.</p>
            <div className="mt-8">
              {historyLoading ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-tera-secondary">Loading history...</div>
              ) : usageHistory.length > 0 ? (
                <div className="space-y-6">
                  <UsageHistoryChart data={usageHistory} />
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-tera-secondary">Avg. intensity</p>
                      <p className="mt-1 text-xl font-semibold text-tera-primary">
                        {Math.round(weeklyTotal / sessionCount)}
                        <span className="ml-1 text-xs font-normal text-tera-secondary">pts/session</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-tera-secondary">7D total</p>
                      <p className="mt-1 text-xl font-semibold text-tera-primary">
                        {weeklyTotal.toLocaleString()}
                        <span className="ml-1 text-xs font-normal text-tera-secondary">credits</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-tera-secondary">No history data yet.</div>
              )}
            </div>
          </div>

          <div className="tera-card">
            <p className="tera-eyebrow">Recent sessions</p>
            <div className="mt-6 space-y-3">
              {sessionsLoading ? (
                <p className="text-sm text-tera-secondary">Loading recent sessions...</p>
              ) : recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <Link key={session.session_id} href={`/new/${session.session_id}`} className="block rounded-[20px] border border-tera-border bg-white/[0.03] px-4 py-4 transition hover:border-white/16 hover:bg-white/[0.05]">
                    <p className="truncate text-sm font-medium text-tera-primary">{session.title || 'Untitled session'}</p>
                    <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">{session.tool || 'Universal'} Â· {new Date(session.created_at).toLocaleDateString()}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-tera-secondary">No recent sessions yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
