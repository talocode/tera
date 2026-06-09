'use client'

import { useEffect, useState } from 'react'

type TrainingJob = {
  id: string
  name: string
  status: string
  progress: number
  createdAt: string
  completedAt?: string
}

export default function TrainingPage() {
  const [jobs, setJobs] = useState<TrainingJob[]>([])
  const [modelName, setModelName] = useState('')
  const [dataUrl, setDataUrl] = useState('')
  const [epochs, setEpochs] = useState(3)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plus/training')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load jobs')
      setJobs(data.jobs || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchJobs()
  }, [])

  const createJob = async () => {
    if (!modelName.trim() || !dataUrl.trim()) return

    try {
      const response = await fetch('/api/plus/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: modelName.trim(), dataUrl: dataUrl.trim(), epochs, description: description.trim() || undefined })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create training job')
      setModelName('')
      setDataUrl('')
      setDescription('')
      setEpochs(3)
      await fetchJobs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create training job')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="tera-eyebrow">Training</p>
        <h2 className="mt-3 text-3xl font-semibold text-tera-primary">Model training jobs</h2>
        <p className="mt-3 text-sm text-tera-secondary">Create private model training jobs from your own dataset URLs.</p>
      </div>

      {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="tera-card space-y-3">
        <h3 className="text-lg font-semibold text-tera-primary">Start new training job</h3>
        <input className="tera-input" value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="Model name" />
        <input className="tera-input" value={dataUrl} onChange={(e) => setDataUrl(e.target.value)} placeholder="Training data URL" />
        <div className="grid gap-3 md:grid-cols-2">
          <input className="tera-input" type="number" min={1} max={20} value={epochs} onChange={(e) => setEpochs(Number(e.target.value) || 3)} />
          <input className="tera-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
        </div>
        <button type="button" onClick={createJob} className="tera-button-upgrade justify-center">Create job</button>
      </div>

      <div className="tera-card">
        <h3 className="text-lg font-semibold text-tera-primary">Recent jobs</h3>
        {loading ? <p className="mt-4 text-sm text-tera-secondary">Loading jobs...</p> : (
          <div className="mt-4 space-y-3">
            {jobs.length === 0 && <p className="text-sm text-tera-secondary">No jobs yet.</p>}
            {jobs.map((job) => (
              <div key={job.id} className="tera-card-subtle p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-tera-primary">{job.name}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-tera-secondary">{job.status} • {job.progress}%</p>
                  </div>
                  <p className="text-xs text-tera-secondary">{new Date(job.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
