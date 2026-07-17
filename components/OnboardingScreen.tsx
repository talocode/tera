'use client'

import { useState } from 'react'
import { QUICK_START_CATEGORIES, type QuickStartCategory } from '@/lib/activation'

interface OnboardingScreenProps {
  userName?: string | null
  onComplete: (choice: QuickStartCategory) => void
}

export default function OnboardingScreen({ userName, onComplete }: OnboardingScreenProps) {
  const [selected, setSelected] = useState<QuickStartCategory | null>(null)
  const [step, setStep] = useState<'welcome' | 'choose'>('welcome')

  const handleComplete = () => {
    if (selected) {
      onComplete(selected)
    }
  }

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
        <div className="w-full max-w-lg rounded-[32px] border border-tera-border bg-tera-panel/95 p-8 shadow-soft-lg backdrop-blur-2xl md:p-10">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] border border-tera-border bg-white/[0.04]">
              <span className="text-3xl">🚀</span>
            </div>
            <p className="tera-eyebrow">Welcome to Tera</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-tera-primary md:text-3xl">
              {userName ? `Hi ${userName.split(' ')[0]},` : 'Hi there,'}
            </h1>
            <p className="mt-4 text-sm leading-7 text-tera-secondary">
              You have <span className="font-semibold text-tera-neon">150 free credits</span> to explore.
              Each conversation uses just a few credits — enough to try everything.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStep('choose')}
            className="tera-button mt-8 w-full"
          >
            Get started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-[32px] border border-tera-border bg-tera-panel/95 p-8 shadow-soft-lg backdrop-blur-2xl md:p-10">
        <div className="text-center">
          <p className="tera-eyebrow">First, what brings you here?</p>
          <h1 className="mt-3 text-xl font-semibold text-tera-primary">Choose what you want to do first</h1>
          <p className="mt-2 text-sm text-tera-secondary">We&apos;ll set up your workspace with the right tools.</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {(Object.entries(QUICK_START_CATEGORIES) as [QuickStartCategory, typeof QUICK_START_CATEGORIES[QuickStartCategory]][]).map(([key, cat]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`group relative rounded-[20px] border px-4 py-5 text-left transition ${
                selected === key
                  ? 'border-tera-neon bg-tera-neon/10'
                  : 'border-tera-border bg-white/[0.02] hover:border-tera-muted hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <p className="mt-2 text-sm font-medium text-tera-primary">{cat.label}</p>
              <p className="mt-1 text-xs leading-5 text-tera-secondary">{cat.description}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleComplete}
          disabled={!selected}
          className="tera-button mt-8 w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          {selected ? 'Continue' : 'Select an option'}
        </button>

        <button
          type="button"
          onClick={() => onComplete('unsure')}
          className="mt-3 w-full text-center text-xs text-tera-secondary hover:text-tera-primary transition"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
