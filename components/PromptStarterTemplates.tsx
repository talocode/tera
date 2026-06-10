'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { loadSavedWorkflows, type SavedWorkflow } from '@/lib/saved-workflows'

type PromptStarterTemplatesProps = {
  onSelectPrompt?: (prompt: string) => void
  launchPathPrefix?: string
  compact?: boolean
  layout?: 'grid' | 'inline'
}

type StarterTemplate = {
  title: string
  description: string
  prompt: string
  badge: string
}

const starterTemplates: StarterTemplate[] = [
  {
    title: 'Study a topic',
    description: 'Get a clear explanation, examples, and a quick check for understanding.',
    prompt: 'Explain this topic clearly from first principles, then give me one example and three things I should remember:',
    badge: 'Study',
  },
  {
    title: 'Research with sources',
    description: 'Use current web sources, summarize the evidence, and show citations.',
    prompt: 'Research this for me with current sources and citations. Summarize what is most important, what is uncertain, and link the best references:',
    badge: 'Research',
  },
  {
    title: 'Turn notes into action',
    description: 'Convert rough notes into tasks, a plan, and a clean next step.',
    prompt: 'Turn these notes into a clear action plan with tasks, deadlines, and next steps:',
    badge: 'Plan',
  },
  {
    title: 'Summarize something long',
    description: 'Compress long material into a short, useful summary.',
    prompt: 'Summarize this in a concise format with the key points, risks, and next actions:',
    badge: 'Summarize',
  },
  {
    title: 'Draft a message',
    description: 'Write a polished email, message, or response in a natural tone.',
    prompt: 'Draft a professional message for me based on this context:',
    badge: 'Draft',
  },
  {
    title: 'Compare options',
    description: 'See a practical side-by-side breakdown before choosing.',
    prompt: 'Compare these options and recommend the best one based on tradeoffs, cost, and ease of use:',
    badge: 'Decide',
  },
]

function buildPromptHref(basePath: string, prompt: string) {
  const query = new URLSearchParams({ prompt }).toString()
  return `${basePath}?${query}`
}

function StarterTile({
  title,
  description,
  prompt,
  badge,
  onSelectPrompt,
  launchPathPrefix,
}: StarterTemplate & {
  key?: string
  onSelectPrompt?: (prompt: string) => void
  launchPathPrefix?: string
}) {
  const content = (
    <div className="group flex h-full flex-col rounded-[22px] border border-tera-border bg-tera-muted p-4 text-left transition hover:-translate-y-px hover:bg-tera-highlight">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">{badge}</p>
          <h3 className="mt-2 text-sm font-semibold text-tera-primary">{title}</h3>
        </div>
        <span className="rounded-full border border-tera-border bg-black/10 px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-tera-secondary">
          Use
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-tera-secondary">{description}</p>
      <p className="mt-4 line-clamp-3 text-xs leading-6 text-tera-primary/80">{prompt}</p>
    </div>
  )

  if (onSelectPrompt) {
    return (
      <button type="button" onClick={() => onSelectPrompt(prompt)} className="text-left">
        {content}
      </button>
    )
  }

  if (launchPathPrefix) {
    return (
      <Link href={buildPromptHref(launchPathPrefix, prompt)} className="block">
        {content}
      </Link>
    )
  }

  return content
}

function StarterChip({
  title,
  description,
  prompt,
  badge,
  onSelectPrompt,
  launchPathPrefix,
}: StarterTemplate & {
  key?: string
  onSelectPrompt?: (prompt: string) => void
  launchPathPrefix?: string
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-[18px] border border-tera-border bg-tera-muted px-4 py-3 text-left transition hover:-translate-y-px hover:bg-tera-highlight">
      <div className="min-w-0 flex-1">
        <p className="text-[0.58rem] uppercase tracking-[0.24em] text-tera-secondary">{badge}</p>
        <p className="mt-1 text-sm font-semibold text-tera-primary">{title}</p>
        <p className="mt-1 line-clamp-1 text-xs leading-5 text-tera-secondary">{description}</p>
      </div>
      <span className="shrink-0 rounded-full border border-tera-border bg-black/10 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-tera-secondary">
        Use
      </span>
    </div>
  )

  if (onSelectPrompt) {
    return (
      <button type="button" onClick={() => onSelectPrompt(prompt)} className="text-left">
        {content}
      </button>
    )
  }

  if (launchPathPrefix) {
    return (
      <Link href={buildPromptHref(launchPathPrefix, prompt)} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export default function PromptStarterTemplates({
  onSelectPrompt,
  launchPathPrefix,
  compact = false,
  layout = 'grid',
}: PromptStarterTemplatesProps) {
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([])
  const visibleStarterTemplates = useMemo<StarterTemplate[]>(
    () => starterTemplates.slice(0, compact ? 4 : starterTemplates.length),
    [compact],
  )

  useEffect(() => {
    setSavedWorkflows(loadSavedWorkflows())
  }, [])

  const recentWorkflows = useMemo<SavedWorkflow[]>(
    () => savedWorkflows.slice(0, compact ? 3 : 4),
    [compact, savedWorkflows],
  )

  if (layout === 'inline') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 rounded-[22px] border border-tera-border bg-tera-muted/80 p-4 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="tera-eyebrow">Quick starts</p>
              <h2 className="mt-2 text-sm font-semibold text-tera-primary sm:text-base">Pick a mode or prompt starter</h2>
              <p className="mt-2 text-xs leading-6 text-tera-secondary sm:text-sm">
                Study, research, plan, and summarize all live here without blocking the composer.
              </p>
            </div>
            {savedWorkflows.length > 0 && (
              <Link href="/profile#saved-workflows" className="text-xs uppercase tracking-[0.2em] text-tera-secondary transition hover:text-tera-primary sm:text-sm sm:normal-case sm:tracking-normal">
                Manage workflows
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleStarterTemplates.map((template: StarterTemplate) => (
              <StarterChip
                key={template.title}
                {...template}
                onSelectPrompt={onSelectPrompt}
                launchPathPrefix={launchPathPrefix}
              />
            ))}
          </div>

          {recentWorkflows.length > 0 && (
            <div className="pt-2">
              <p className="text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">Saved workflows</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recentWorkflows.map((workflow: SavedWorkflow) => (
                  <StarterChip
                    key={workflow.id}
                    title={workflow.name}
                    description="Saved workflow"
                    prompt={workflow.prompt}
                    badge="Workflow"
                    onSelectPrompt={onSelectPrompt}
                    launchPathPrefix={launchPathPrefix}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="tera-surface mt-8 p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="tera-eyebrow">Quick starts</p>
          <h2 className="mt-3 text-xl font-semibold text-tera-primary">Start with a useful prompt</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-tera-secondary">
            Pick a starter, or reopen one of your saved workflows. Tera keeps the prompt in the composer so you can edit it before sending.
          </p>
        </div>
        {savedWorkflows.length > 0 && (
          <Link href="/profile#saved-workflows" className="text-sm text-tera-secondary transition hover:text-tera-primary">
            Manage workflows
          </Link>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleStarterTemplates.map((template: StarterTemplate) => (
          <StarterTile
            key={template.title}
            {...template}
            onSelectPrompt={onSelectPrompt}
            launchPathPrefix={launchPathPrefix}
          />
        ))}
      </div>

      {recentWorkflows.length > 0 && (
        <div className="mt-6 border-t border-tera-border pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">Saved workflows</p>
              <p className="mt-1 text-sm text-tera-secondary">Recent prompts you already trust.</p>
            </div>
            {savedWorkflows.length > recentWorkflows.length && (
              <span className="text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">
                {savedWorkflows.length - recentWorkflows.length} more
              </span>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recentWorkflows.map((workflow: SavedWorkflow) => (
              <StarterTile
                key={workflow.id}
                title={workflow.name}
                description="Saved workflow"
                prompt={workflow.prompt}
                badge="Workflow"
                onSelectPrompt={onSelectPrompt}
                launchPathPrefix={launchPathPrefix}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
