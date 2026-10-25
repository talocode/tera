'use client'

import { useState, type FormEvent } from 'react'

export default function VerifyPage() {
  const [prompt, setPrompt] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [source, setSource] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    setSource(null)
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await response.json()
      if (response.status === 402) {
        setMessage(data.error || 'A paid top-up is required.')
        return
      }
      if (!response.ok) {
        setMessage(data.error || 'The verified call did not run.')
        return
      }
      setMessage(data.answer || '')
      setSource(data.source || null)
    } catch {
      setMessage('The verified call did not run.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 20px', fontFamily: 'Georgia, serif', color: '#161616' }}>
      <h1 style={{ fontSize: 32, lineHeight: 1.2 }}>Verified call</h1>
      <p style={{ fontSize: 18, lineHeight: 1.5 }}>
        One question. Tera answers only if a source loads. This is the only call a paid top-up runs. A hold does not run it. The minimum top-up is $5.
      </p>
      <form onSubmit={onSubmit}>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={6}
          required
          minLength={8}
          maxLength={2000}
          placeholder="Ask one question you want checked against a source."
          style={{ width: '100%', fontSize: 16, padding: 12 }}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button type="submit" disabled={pending} style={{ fontSize: 16, padding: '10px 16px' }}>
            {pending ? 'Checking…' : 'Run verified call'}
          </button>
          <a href="/pricing" style={{ fontSize: 16, padding: '10px 0' }}>Buy a $5 top-up</a>
        </div>
      </form>
      {message ? <p style={{ fontSize: 18, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{message}</p> : null}
      {source ? <p><a href={source}>{source}</a></p> : null}
    </main>
  )
}
