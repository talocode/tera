'use client'

import { useEffect } from 'react'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

export default function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const utm: Record<string, string> = {}
    for (const key of UTM_KEYS) {
      const value = params.get(key)
      if (value) utm[key] = value
    }

    if (!utm.utm_source) return

    const attribution = {
      ...utm,
      referrer: document.referrer || undefined,
      lp: window.location.pathname,
    }
    document.cookie = `tera_utm=${encodeURIComponent(JSON.stringify(attribution))}; path=/; max-age=2592000; SameSite=Lax`
  }, [])

  return null
}
