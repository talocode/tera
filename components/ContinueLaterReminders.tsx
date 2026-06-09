'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import {
  CONTINUE_LATER_CHANGE_EVENT,
  loadContinueLaterReminders,
  removeContinueLaterReminder,
  type ContinueLaterReminder,
} from '@/lib/continue-later'

export default function ContinueLaterReminders() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<ContinueLaterReminder[]>([])
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported' | 'default'>('default')
  const [clockTick, setClockTick] = useState(() => Date.now())

  useEffect(() => {
    setReminders(loadContinueLaterReminders())
  }, [])

  useEffect(() => {
    const refresh = () => setReminders(loadContinueLaterReminders())
    window.addEventListener(CONTINUE_LATER_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)

    return () => {
      window.removeEventListener(CONTINUE_LATER_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setAlertsEnabled(false)
        return
      }

      try {
        const response = await fetch('/api/user/settings', { method: 'GET' })
        if (!response.ok) return
        const data = await response.json()
        setAlertsEnabled(Boolean(data.reminder_alerts_enabled ?? true))
      } catch (error) {
        console.error('Failed to load reminder alert settings:', error)
      }
    }

    void loadSettings()
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported')
      return
    }

    setNotificationPermission(Notification.permission)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockTick(Date.now())
    }, 60_000)

    return () => window.clearInterval(interval)
  }, [])

  const handleRemoveReminder = (kind: ContinueLaterReminder['kind'], id: string) => {
    const next = removeContinueLaterReminder(kind, id)
    setReminders(next)
  }

  const handleEnableBrowserAlerts = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
  }

  const upcoming = useMemo(
    () => [...reminders].sort((left, right) => new Date(left.remindAt).getTime() - new Date(right.remindAt).getTime()).slice(0, 5),
    [reminders],
  )
  const dueSoon = useMemo(() => {
    const soon = clockTick + 24 * 60 * 60 * 1000
    return reminders
      .filter((reminder) => {
        const remindAt = new Date(reminder.remindAt).getTime()
        return remindAt <= soon
      })
      .sort((left, right) => new Date(left.remindAt).getTime() - new Date(right.remindAt).getTime())
      .slice(0, 3)
  }, [clockTick, reminders])

  useEffect(() => {
    if (!alertsEnabled || notificationPermission !== 'granted' || typeof window === 'undefined') return

    const notifiedKey = 'tera_reminder_notifications_seen'
    let seen = new Set<string>()
    try {
      seen = new Set<string>(JSON.parse(window.localStorage.getItem(notifiedKey) || '[]') as string[])
    } catch (error) {
      console.error('Failed to parse reminder notification cache:', error)
    }

    const dueNow = [...dueSoon].filter((reminder) => new Date(reminder.remindAt).getTime() <= clockTick + 60 * 60 * 1000)

    if (dueNow.length === 0) return

    const nextSeen = new Set(seen)
    for (const reminder of dueNow) {
      const key = `${reminder.kind}:${reminder.id}:${reminder.remindAt}`
      if (nextSeen.has(key)) continue

      nextSeen.add(key)
      new Notification('Tera reminder', {
        body: `${reminder.title} is due now.`,
      })
    }

    window.localStorage.setItem(notifiedKey, JSON.stringify([...nextSeen]))
  }, [alertsEnabled, clockTick, dueSoon, notificationPermission])

  return (
    <section className="tera-surface mt-8 p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="tera-eyebrow">Reminders</p>
          <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Come back on purpose</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-tera-secondary">
            Schedule a follow-up so unfinished work shows up when you need it again.
          </p>
        </div>
        {alertsEnabled && notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
          <button type="button" onClick={handleEnableBrowserAlerts} className="tera-button-secondary self-start">
            Enable browser alerts
          </button>
        )}
      </div>

      {alertsEnabled && notificationPermission === 'denied' && (
        <div className="mt-6 rounded-[22px] border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm leading-7 text-amber-50">
          Browser alerts are blocked. Allow notifications in your browser settings if you want reminder popups.
        </div>
      )}

      {notificationPermission === 'unsupported' && (
        <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4 text-sm leading-7 text-tera-secondary">
          Your browser does not support notifications. The reminder queue still works inside Tera.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {dueSoon.length > 0 && (
          <div className="rounded-[22px] border border-amber-400/20 bg-amber-500/10 px-5 py-4">
            <p className="text-[0.62rem] uppercase tracking-[0.3em] text-amber-100/90">Due soon</p>
            <div className="mt-3 space-y-3">
              {dueSoon.map((reminder) => (
                <div key={`${reminder.kind}-${reminder.id}`} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-amber-50">{reminder.title}</p>
                    <p className="mt-1 text-sm text-amber-50/80">
                      {new Date(reminder.remindAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={reminder.href} className="tera-button-secondary">
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemoveReminder(reminder.kind, reminder.id)}
                      className="tera-button-secondary"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcoming.length === 0 ? (
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm text-tera-secondary">
            No reminders yet. Add one from search or history to make a return path explicit.
          </div>
        ) : (
          upcoming.map((reminder) => (
            <div
              key={`${reminder.kind}-${reminder.id}`}
              className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:border-white/16 hover:bg-white/[0.06]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">{reminder.kind}</p>
                  <p className="mt-2 truncate text-sm font-medium text-tera-primary">{reminder.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-tera-secondary">{reminder.excerpt}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-tera-secondary">
                    {new Date(reminder.remindAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <Link href={reminder.href} className="tera-button-secondary px-3 py-1 text-[0.58rem] uppercase tracking-[0.22em]">
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemoveReminder(reminder.kind, reminder.id)}
                    className="tera-button-secondary px-3 py-1 text-[0.58rem] uppercase tracking-[0.22em]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
