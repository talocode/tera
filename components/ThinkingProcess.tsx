'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type ProcessStage = {
  id: string
  label: string
  icon: React.ReactNode
  duration: number
}

const STAGES: ProcessStage[] = [
  { id: 'understand', label: 'Understanding your question', icon: <IconBrain />, duration: 1800 },
  { id: 'search', label: 'Searching the web', icon: <IconSearch />, duration: 3200 },
  { id: 'analyze', label: 'Analyzing sources', icon: <IconAnalyze />, duration: 2400 },
  { id: 'compose', label: 'Composing response', icon: <IconCompose />, duration: 1600 },
]

const IMAGE_STAGES: ProcessStage[] = [
  { id: 'receive', label: 'Receiving your image', icon: <IconImage />, duration: 1200 },
  { id: 'analyze', label: 'Analyzing visual content', icon: <IconAnalyze />, duration: 3500 },
  { id: 'extract', label: 'Extracting details', icon: <IconExtract />, duration: 2200 },
  { id: 'compose', label: 'Writing response', icon: <IconCompose />, duration: 1600 },
]

const RESEARCH_STAGES: ProcessStage[] = [
  { id: 'understand', label: 'Understanding your question', icon: <IconBrain />, duration: 1200 },
  { id: 'search', label: 'Searching the web', icon: <IconSearch />, duration: 4000 },
  { id: 'scrape', label: 'Reading source pages', icon: <IconRead />, duration: 3500 },
  { id: 'analyze', label: 'Analyzing findings', icon: <IconAnalyze />, duration: 2800 },
  { id: 'compose', label: 'Composing response', icon: <IconCompose />, duration: 1600 },
]

interface ThinkingProcessProps {
  message: string
  hasImages: boolean
  isResearch: boolean
  isStreaming: boolean
}

export default function ThinkingProcess({ message, hasImages, isResearch, isStreaming }: ThinkingProcessProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeStage, setActiveStage] = useState(0)
  const [completedStages, setCompletedStages] = useState<number[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [showSources, setShowSources] = useState(false)
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const stages = hasImages ? IMAGE_STAGES : isResearch ? RESEARCH_STAGES : STAGES
  const totalDuration = stages.reduce((sum, s) => sum + s.duration, 0)

  useEffect(() => {
    startTimeRef.current = Date.now()
    setActiveStage(0)
    setCompletedStages([])
    setElapsed(0)
    setShowSources(false)

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current)
    }, 100)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [message, hasImages, isResearch])

  useEffect(() => {
    let stageTimer: NodeJS.Timeout
    let cumulative = 0

    stages.forEach((stage, index) => {
      cumulative += stage.duration
      if (index < stages.length) {
        setTimeout(() => {
          setCompletedStages((prev) => [...prev, index])
          setActiveStage(index + 1)
          if (stage.id === 'search') {
            setTimeout(() => setShowSources(true), 400)
          }
        }, cumulative)
      }
    })

    return () => clearTimeout(stageTimer)
  }, [stages])

  const progress = Math.min((elapsed / totalDuration) * 100, 98)
  const currentStage = stages[Math.min(activeStage, stages.length - 1)]

  if (isStreaming) return null

  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="w-full max-w-[92%] md:max-w-[85%]">
        <div className="rounded-[28px] border border-tera-border/60 bg-gradient-to-br from-tera-panel/90 to-tera-panel/60 backdrop-blur-xl shadow-soft-lg overflow-hidden">

          {/* Header */}
          <div className="px-5 py-4 md:px-6">
            <div className="flex items-center gap-4">
              {/* Orbital loader */}
              <div className="relative h-12 w-12 shrink-0">
                <div className="absolute inset-0 rounded-full border border-tera-neon/10 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-1 rounded-full border border-tera-neon/20 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
                <div className="absolute inset-2 rounded-full border-2 border-tera-neon/30 border-t-tera-neon animate-spin" style={{ animationDuration: '1.2s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-6 w-6">
                    <Image src="/images/TERA_LOGO_ONLY.png" alt="Tera" fill className="object-contain" />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-tera-primary truncate">{message}</p>
                  <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="shrink-0 text-[0.65rem] uppercase tracking-[0.15em] text-tera-secondary/60 hover:text-tera-secondary transition-colors"
                  >
                    {expanded ? 'Less' : 'Details'}
                  </button>
                </div>
                <p className="mt-0.5 text-xs text-tera-secondary/70 animate-pulse">{currentStage.label}...</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-tera-neon/40 via-tera-neon to-tera-neon/60 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.15em] text-tera-secondary/40">
              <span>{(elapsed / 1000).toFixed(1)}s</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Expandable details */}
          {expanded && (
            <div className="border-t border-tera-border/40 px-5 py-4 md:px-6 animate-in slide-in-from-top-2 duration-300">

              {/* Stage timeline */}
              <div className="space-y-1">
                {stages.map((stage, index) => {
                  const isDone = completedStages.includes(index)
                  const isActive = activeStage === index && !isDone
                  const isPending = !isDone && !isActive

                  return (
                    <div
                      key={stage.id}
                      className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-all duration-500 ${
                        isActive
                          ? 'bg-tera-neon/[0.06]'
                          : isDone
                            ? 'bg-transparent'
                            : 'bg-transparent'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border transition-all duration-500 ${
                        isActive
                          ? 'border-tera-neon/40 bg-tera-neon/10 text-tera-neon shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                          : isDone
                            ? 'border-tera-neon/20 bg-tera-neon/[0.06] text-tera-neon/70'
                            : 'border-tera-border bg-tera-muted/50 text-tera-secondary/30'
                      }`}>
                        {isDone ? (
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : isActive ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-tera-neon/40 border-t-tera-neon" />
                        ) : (
                          <span className="text-[0.6rem] font-medium">{index + 1}</span>
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[0.78rem] transition-colors duration-300 ${
                          isActive ? 'text-tera-primary font-medium' : isDone ? 'text-tera-secondary/70' : 'text-tera-secondary/30'
                        }`}>
                          {stage.label}
                        </p>
                        {isActive && (
                          <p className="mt-0.5 text-[0.65rem] text-tera-secondary/50 animate-pulse">
                            {stage.id === 'search' && 'Querying Context.dev + Tavily...'}
                            {stage.id === 'scrape' && 'Reading page content...'}
                            {stage.id === 'analyze' && 'Synthesizing information...'}
                            {stage.id === 'compose' && 'Building response...'}
                            {stage.id === 'understand' && 'Processing intent...'}
                            {stage.id === 'receive' && 'Uploading image...'}
                            {stage.id === 'extract' && 'Reading visual data...'}
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      {isDone && (
                        <span className="text-[0.6rem] text-tera-secondary/30 tabular-nums">
                          {(stage.duration / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Source indicators */}
              {showSources && isResearch && (
                <div className="mt-4 border-t border-tera-border/30 pt-3">
                  <p className="text-[0.6rem] uppercase tracking-[0.15em] text-tera-secondary/40 mb-2">Sources found</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Context.dev', 'Tavily', 'Web'].map((source, i) => (
                      <span
                        key={source}
                        className="inline-flex items-center gap-1 rounded-full border border-tera-neon/15 bg-tera-neon/[0.04] px-2 py-0.5 text-[0.6rem] text-tera-neon/60 animate-in fade-in duration-300"
                        style={{ animationDelay: `${i * 200}ms` }}
                      >
                        <span className="h-1 w-1 rounded-full bg-tera-neon/40" />
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function IconBrain() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 0-4 4c0 1.1.45 2.1 1.17 2.83L12 12l2.83-3.17A4 4 0 0 0 16 6a4 4 0 0 0-4-4z" />
      <path d="M12 12v6" />
      <path d="M8 18h8" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function IconAnalyze() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m7 16 4-8 4 4 4-6" />
    </svg>
  )
}

function IconCompose() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
    </svg>
  )
}

function IconImage() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

function IconExtract() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  )
}

function IconRead() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
