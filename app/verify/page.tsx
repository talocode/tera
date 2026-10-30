'use client'

import { useState, type FormEvent } from 'react'

type Receipt = {
  id?: string
  loaded?: boolean
  answer?: string | null
  source?: string
  creditsCharged?: number
  error?: string
}

export default function VerifyPage() {
  const [question, setQuestion] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [pending, setPending] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setReceipt(null)
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sourceUrl }),
      })
      const data = await response.json()
      setReceipt(data)
    } catch {
      setReceipt({ error: 'The verified call did not run.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 20px', fontFamily: 'Georgia, serif', color: '#161616' }}>
      <h1 style={{ fontSize: 32, lineHeight: 1.2 }}>Verified call</h1>
      <p style={{ fontSize: 18, lineHeight: 1.5 }}>
        One question and one public source. One paid credit is spent only if that source loads and the answer is taken from it. A source that fails returns an id and costs nothing. A hold does not run it. The minimum top-up is $5. The limit is 10 calls a minute.
      </p>
      <form onSubmit={onSubmit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={5}
          required
          minLength={8}
          maxLength={2000}
          placeholder="Ask one question."
          style={{ width: '100%', fontSize: 16, padding: 12 }}
        />
        <input
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          required
          type="url"
          placeholder="https:// source URL"
          style={{ width: '100%', fontSize: 16, padding: 12, marginTop: 12 }}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button type="submit" disabled={pending} style={{ fontSize: 16, padding: '10px 16px' }}>
            {pending ? 'Checking…' : 'Run verified call'}
          </button>
          <a href="/pricing" style={{ fontSize: 16, padding: '10px 0' }}>Buy a $5 top-up</a>
        </div>
      </form>
      {receipt?.error ? <p style={{ fontSize: 18 }}>{receipt.error}</p> : null}
      {receipt?.id ? (
        <div style={{ fontSize: 18, lineHeight: 1.5 }}>
          <p>Receipt {receipt.id}</p>
          <p>{receipt.loaded ? 'Source loaded.' : 'Source did not load.'} Credits spent: {receipt.creditsCharged ?? 0}.</p>
          {receipt.answer ? <p style={{ whiteSpace: 'pre-wrap' }}>{receipt.answer}</p> : null}
          {receipt.source ? <p><a href={receipt.source}>{receipt.source}</a></p> : null}
          <p><a href={`/api/verify/${receipt.id}`}>Open the receipt</a></p>
        </div>
      ) : null}
    </main>
  )
}
