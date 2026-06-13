'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useTheme } from '@/components/ThemeProvider'
import { fetchUserProfile } from '@/app/actions/user'
import { type UserProfile } from '@/lib/usage-tracking'

type UserSettings = {
  notifications_enabled: boolean
  reminder_alerts_enabled: boolean
  dark_mode: boolean
  email_notifications: boolean
  marketing_emails: boolean
  data_retention_days: number
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="tera-card-subtle px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 pr-2">
          <p className="text-sm font-medium text-tera-primary">{label}</p>
          <p className="mt-1 text-sm leading-6 text-tera-secondary">{description}</p>
        </div>
        <button
          type="button"
          onClick={onChange}
          className={`relative mt-1 h-7 w-12 shrink-0 rounded-full border transition ${checked ? 'border-tera-border bg-tera-highlight' : 'border-tera-border bg-tera-muted'}`}
          aria-pressed={checked}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { setTheme } = useTheme()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'preferences' | 'privacy' | 'account'>('preferences')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    reminder_alerts_enabled: true,
    dark_mode: true,
    email_notifications: true,
    marketing_emails: false,
    data_retention_days: 90,
  })
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)

  useEffect(() => {
    if (user) {
      void fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/settings', {
        method: 'GET',
      })

      if (user) {
        const profile = await fetchUserProfile(user.id)
        setUserProfile(profile)
      }

      if (!response.ok) return

      const data = await response.json()
      setSettings({
        notifications_enabled: data.notifications_enabled ?? true,
        reminder_alerts_enabled: data.reminder_alerts_enabled ?? true,
        dark_mode: data.dark_mode ?? true,
        email_notifications: data.email_notifications ?? true,
        marketing_emails: data.marketing_emails ?? false,
        data_retention_days: data.data_retention_days ?? 90,
      })

      if (data.dark_mode !== undefined) {
        setTheme(data.dark_mode ? 'dark' : 'light')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettingsAsync = async (settingsToSave: UserSettings) => {
    if (!user) return

    try {
      setAutoSaving(true)
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave),
      })

      if (!response.ok) {
        console.warn('Failed to auto-save settings')
      }
    } catch (error) {
      console.error('Error auto-saving settings:', error)
    } finally {
      setAutoSaving(false)
    }
  }

  const toggleSetting = (key: keyof UserSettings) => {
    setSettings((current) => {
      const nextValue = !current[key]
      const updated = { ...current, [key]: nextValue }

      if (key === 'dark_mode') {
        setTheme(nextValue ? 'dark' : 'light')
      }

      void saveSettingsAsync(updated).then(() => {
        setMessageType('success')
        setMessage('Settings saved.')
        setTimeout(() => setMessage(''), 2000)
      })
      return updated
    })
  }

  const handleTabClick = (tabId: string) => {
    if (tabId === 'usage') {
      router.push('/settings/usage')
      return
    }
    setActiveTab(tabId as typeof activeTab)
  }

  const updateSetting = (key: keyof UserSettings, value: number) => {
    setSettings((current) => {
      const updated = { ...current, [key]: value }
      void saveSettingsAsync(updated).then(() => {
        setMessageType('success')
        setMessage('Settings saved.')
        setTimeout(() => setMessage(''), 2000)
      })
      return updated
    })
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
      setMessageType('error')
      setMessage('Failed to load billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  const tabs = [
    { id: 'preferences', label: 'Preferences' },
    { id: 'usage', label: 'Usage & Credits' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'account', label: 'Account' },
  ] as const

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-6 md:pt-10">
        <div className="tera-page-header gap-5">
          <div>
            <p className="tera-eyebrow">Workspace</p>
            <h1 className="tera-title mt-3">Settings</h1>
            <p className="tera-subtitle mt-4">Control your workspace preferences, privacy defaults, billing, and theme without losing clarity on mobile.</p>
          </div>
          <div className="tera-card flex items-center gap-3 px-4 py-3 sm:w-auto">
            <span className={`h-2.5 w-2.5 rounded-full ${autoSaving ? 'animate-pulse bg-tera-accent' : 'bg-tera-secondary/40'}`} />
            <span className="text-sm text-tera-secondary">{autoSaving ? 'Saving changes...' : 'Changes save automatically'}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="tera-card h-fit p-3">
            <p className="px-2 text-[0.68rem] uppercase tracking-[0.28em] text-tera-secondary">Sections</p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible custom-scrollbar">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`min-w-fit rounded-full px-4 py-2.5 text-sm transition xl:flex xl:w-full xl:items-center xl:justify-between xl:rounded-[18px] xl:px-4 xl:py-3 xl:text-left ${activeTab === item.id ? 'bg-white/[0.08] text-tera-primary dark:bg-white/[0.08] light:bg-black/[0.04]' : 'text-tera-secondary hover:bg-white/[0.04] hover:text-tera-primary dark:hover:bg-white/[0.04] light:hover:bg-black/[0.02]'}`}
                >
                  <span>{item.label}</span>
                  <span className={`hidden h-2.5 w-2.5 rounded-full xl:block ${activeTab === item.id ? 'bg-tera-accent' : 'bg-transparent'}`} />
                </button>
              ))}
            </div>
          </aside>

          <section className="tera-surface p-5 sm:p-6 lg:p-8">
            {message && (
              <div className={`mb-6 rounded-[20px] border px-4 py-3 text-sm ${messageType === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-tera-border dark:bg-tera-highlight dark:text-tera-primary' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200'}`}>
                {message}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-tera-secondary">Loading settings...</p>
            ) : (
              <div className="space-y-6">
                {activeTab === 'preferences' && (
                  <>
                    <div className="space-y-3">
                      <p className="tera-eyebrow">Preferences</p>
                      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-tera-primary">Notifications and appearance</h2>
                      <p className="max-w-2xl text-sm leading-7 text-tera-secondary">Keep the essentials visible, simplify the signal, and switch the whole app between light and dark themes instantly.</p>
                    </div>
                    <div className="grid gap-4">
                      <SettingToggle label="Push notifications" description="Receive updates about your activities and account events." checked={settings.notifications_enabled} onChange={() => toggleSetting('notifications_enabled')} />
                      <SettingToggle label="Reminder alerts" description="Show reminder banners and browser alerts when follow-ups are due." checked={settings.reminder_alerts_enabled} onChange={() => toggleSetting('reminder_alerts_enabled')} />
                      <SettingToggle label="Email notifications" description="Receive important product and account updates by email." checked={settings.email_notifications} onChange={() => toggleSetting('email_notifications')} />
                      <SettingToggle label="Marketing emails" description="Allow occasional feature announcements and product tips." checked={settings.marketing_emails} onChange={() => toggleSetting('marketing_emails')} />
                      <SettingToggle label="Dark mode" description="Use the calmer dark workspace across the entire app." checked={settings.dark_mode} onChange={() => toggleSetting('dark_mode')} />
                    </div>
                  </>
                )}

                {activeTab === 'privacy' && (
                  <>
                    <div className="space-y-3">
                      <p className="tera-eyebrow">Privacy</p>
                      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-tera-primary">Retention and policy controls</h2>
                      <p className="max-w-2xl text-sm leading-7 text-tera-secondary">Choose the cleanup window for removed data and keep policy links easy to review from any device.</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="tera-card-subtle px-4 py-4 sm:px-5">
                        <p className="text-sm font-medium text-tera-primary">Data retention</p>
                        <p className="mt-1 text-sm leading-6 text-tera-secondary">Choose how long deleted data remains in our systems before cleanup.</p>
                        <select
                          value={settings.data_retention_days}
                          onChange={(event) => updateSetting('data_retention_days', Number(event.target.value))}
                          className="tera-input mt-4 w-full"
                        >
                          <option value={7}>7 days</option>
                          <option value={30}>30 days</option>
                          <option value={90}>90 days</option>
                          <option value={180}>6 months</option>
                          <option value={365}>1 year</option>
                        </select>
                      </div>

                      <div className="tera-card-subtle px-4 py-4 sm:px-5">
                        <p className="text-sm font-medium text-tera-primary">Privacy policy</p>
                        <p className="mt-1 text-sm leading-6 text-tera-secondary">Review how Tera handles account data, uploads, and third-party providers.</p>
                        <Link href="/privacy" className="tera-button-secondary mt-4 w-full justify-center sm:w-auto">
                          Open privacy policy
                        </Link>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'account' && (
                  <>
                    <div className="space-y-3">
                      <p className="tera-eyebrow">Account</p>
                      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-tera-primary">Profile and subscription</h2>
                      <p className="max-w-2xl text-sm leading-7 text-tera-secondary">See your current plan, open billing actions, and manage the active session without extra clutter.</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="tera-card-subtle px-4 py-4 sm:px-5">
                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">Email</p>
                        <p className="mt-2 break-all text-sm font-medium text-tera-primary">{user?.email || 'Unavailable'}</p>
                      </div>

                      <div className="tera-card-subtle px-4 py-4 sm:px-5">
                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">Plan</p>
                        <p className="mt-2 text-sm font-medium text-tera-primary">
                          {userProfile?.subscriptionPlan === 'free' ? 'Free plan' : userProfile?.subscriptionPlan ?? 'Unknown'}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-tera-secondary">
                          {userProfile?.subscriptionPlan === 'free' ? 'You are currently on the free plan.' : 'Billing and subscription controls are available below.'}
                        </p>
                      </div>
                    </div>

                    <div className="tera-card-subtle px-4 py-4 sm:px-5">
                      <p className="text-sm font-medium text-tera-primary">Billing and access</p>
                      <p className="mt-1 text-sm leading-6 text-tera-secondary">Open upgrade or billing management without leaving the settings flow.</p>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        {userProfile?.subscriptionPlan === 'free' ? (
                          <Link href="/pricing" className="tera-button-upgrade w-full justify-center sm:w-auto">
                            Upgrade plan
                          </Link>
                        ) : (
                          <button type="button" onClick={handleManageSubscription} disabled={portalLoading} className="tera-button-secondary w-full justify-center disabled:opacity-60 sm:w-auto">
                            {portalLoading ? 'Loading...' : 'Manage subscription'}
                          </button>
                        )}
                        <button type="button" onClick={signOut} className="tera-button-secondary w-full justify-center sm:w-auto">
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
