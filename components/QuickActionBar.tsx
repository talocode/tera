const quickActions = [
  { label: 'Lesson Plan Generator', note: 'Structure objectives, pacing, and checkpoints.' },
  { label: 'Worksheet and Quiz', note: 'Build assessments with keys and variations.' },
  { label: 'Concept Explainer', note: 'Turn difficult topics into stepwise explanations.' },
  { label: 'Rubric Builder', note: 'Create consistent evaluation criteria quickly.' },
]

export default function QuickActionBar() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {quickActions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="group flex items-start justify-between rounded-[24px] border border-tera-border bg-tera-panel/75 px-5 py-5 text-left transition hover:border-tera-primary hover:bg-tera-elevated/80"
        >
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.32em] text-tera-secondary">Quick action</p>
            <p className="mt-2 text-base font-semibold text-tera-primary">{action.label}</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-tera-secondary">{action.note}</p>
          </div>
          <svg className="mt-1 h-5 w-5 text-tera-secondary transition group-hover:text-tera-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      ))}
    </div>
  )
}
