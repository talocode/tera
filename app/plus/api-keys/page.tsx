'use client'

import { useEffect, useState } from 'react'

type ApiKey = {
  id: string
  maskedKey: string
  suffix: string
  createdAt: string
  lastUsedAt?: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [latestKey, setLatestKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plus/api-keys')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load API keys')
      setKeys(data.keys || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchKeys()
  }, [])

  const createKey = async () => {
    try {
      const response = await fetch('/api/plus/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create key')
      setLatestKey(data.fullKey)
      await fetchKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key')
    }
  }

  const deleteKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/plus/api-keys?keyId=${keyId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete key')
      await fetchKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete key')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="tera-eyebrow">API Keys</p>
        <h2 className="mt-3 text-3xl font-semibold text-tera-primary">Developer access</h2>
        <p className="mt-3 text-sm text-tera-secondary">Create and revoke private API keys for Plus workflows.</p>
      </div>

      {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      {latestKey && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-semibold">Save this key now — it is only shown once:</p>
          <code className="mt-2 block break-all text-xs">{latestKey}</code>
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={createKey} className="tera-button-upgrade justify-center">Generate key</button>
      </div>

      <div className="tera-card">
        <h3 className="text-lg font-semibold text-tera-primary">Active keys</h3>
        {loading ? <p className="mt-4 text-sm text-tera-secondary">Loading keys...</p> : (
          <div className="mt-4 space-y-3">
            {keys.length === 0 && <p className="text-sm text-tera-secondary">No keys yet.</p>}
            {keys.map((key) => (
              <div key={key.id} className="tera-card-subtle flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-tera-primary">{key.maskedKey}••••{key.suffix}</p>
                  <p className="text-xs text-tera-secondary">Created {new Date(key.createdAt).toLocaleString()}</p>
                </div>
                <button type="button" onClick={() => deleteKey(key.id)} className="tera-button-secondary justify-center">Revoke</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
