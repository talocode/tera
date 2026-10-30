'use client'

import { useState, type FormEvent } from 'react'

type Receipt = {
  id?: string
  state?: string
  task?: string
  source?: string | null
  loaded?: boolean
  answer?: string | null
  creditsCharged?: number
  error?: string
}

export default function TeammatePage() {
  const [task, setTask] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [pending, setPending] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setReceipt(null)
    try {
      const response = await fetch('/api/teammate/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, sourceUrl }),
      })
      setReceipt(await response.json())
    } catch {
      setReceipt({ error: 'The run did not start.' })
    } finally {
      setPending(false)
    }
  }

  async function decide(approved: boolean) {
    if (!receipt?.id) return
    setPending(true)
    try {
      const response = await fetch(`/api/teammate/runs/${receipt.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      })
      setReceipt(await response.json())
    } catch {
      setReceipt({ ...receipt, error: 'The decision did not save.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 20px', fontFamily: 'Georgia, serif', color: '#161616' }}>
      <h1 style={{ fontSize: 32, lineHeight: 1.2 }}>Tera</h1>
      <p style={{ fontSize: 18, lineHeight: 1.5 }}>
        One coworker. You give it a job. The run waits until you approve it. The only tool is one public source. One paid credit is spent only if that source loads and the answer is taken from it. A hold does not run it.
      </p>
      <form onSubmit={onSubmit}>
        <textarea
          value={task}
          onChange={(event) => setTask(event.target.value)}
          rows={5}
          required
          minLength={8}
          maxLength={2000}
          placeholder="Give Tera the job."
          style={{ width: '100%', fontSize: 16, padding: 12 }}
        />
        <input
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          type="url"
          placeholder="https:// source URL"
          style={{ width: '100%', fontSize: 16, padding: 12, marginTop: 12 }}
        />
        <button type="submit" disabled={pending} style={{ fontSize: 16, padding: '10px 16px', marginTop: 12 }}>
          {pending ? 'Working…' : 'Give Tera the job'}
        </button>
      </form>
      {receipt?.error ? <p style={{ fontSize: 18 }}>{receipt.error}</p> : null}
      {receipt?.id ? (
        <div style={{ fontSize: 18, lineHeight: 1.5 }}>
          <p>Run {receipt.id}</p>
          <p>State: {receipt.state}. Credits spent: {receipt.creditsCharged ?? 0}.</p>
          {receipt.state === 'pending_approval' ? (
            <p>
              <button type="button" disabled={pending} onClick={() => decide(true)} style={{ fontSize: 16, padding: '8px 12px' }}>Approve</button>
              <button type="button" disabled={pending} onClick={() => decide(false)} style={{ fontSize: 16, padding: '8px 12px', marginLeft: 8 }}>Reject</button>
            </p>
          ) : null}
          {receipt.answer ? <p style={{ whiteSpace: 'pre-wrap' }}>{receipt.answer}</p> : null}
          {receipt.source ? <p><a href={receipt.source}>{receipt.source}</a></p> : null}
        </div>
      ) : null}
    </main>
  )
}
