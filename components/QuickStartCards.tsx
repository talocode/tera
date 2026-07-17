'use client'

import { QUICK_START_CATEGORIES, type QuickStartCategory } from '@/lib/activation'

interface QuickStartCardsProps {
  category: QuickStartCategory
  onSelect: (prompt: string) => void
}

export default function QuickStartCards({ category, onSelect }: QuickStartCardsProps) {
  const cat = QUICK_START_CATEGORIES[category]

  const handleClick = async (prompt: string) => {
    // Track quickstart click (non-blocking)
    try {
      await fetch('/api/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'quickstart_clicked',
          metadata: { category, prompt: prompt.substring(0, 100) },
        }),
      })
    } catch {}

    onSelect(prompt)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <div className="mb-6 text-center">
        <span className="text-3xl">{cat.icon}</span>
        <h2 className="mt-2 text-lg font-semibold text-tera-primary">{cat.label}</h2>
        <p className="mt-1 text-sm text-tera-secondary">{cat.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cat.prompts.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(item.prompt)}
            className="group rounded-[20px] border border-tera-border bg-white/[0.02] px-5 py-4 text-left transition hover:border-tera-muted hover:bg-white/[0.06]"
          >
            <p className="text-sm font-medium text-tera-primary group-hover:text-tera-neon transition">{item.title}</p>
            <p className="mt-2 text-xs leading-5 text-tera-secondary line-clamp-3">{item.prompt}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-tera-secondary">Or type anything below to start from scratch</p>
      </div>
    </div>
  )
}
