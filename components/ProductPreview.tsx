import type { ReactNode } from 'react'

type PreviewVariant = 'chat' | 'explain' | 'research' | 'upload' | 'quiz'

const navItems = [
  { label: 'New chat', icon: 'plus' },
  { label: 'Search', icon: 'search' },
  { label: 'Skills', icon: 'grid' },
  { label: 'Usage', icon: 'chart' },
  { label: 'Settings', icon: 'gear' },
]

const iconMap: Record<string, ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  search: <path d="M10.5 19a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM21 21l-4.35-4.35" />,
  grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  chart: <path d="M4 20h16M6 16l4-5 3 3 5-6" />,
  gear: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />,
}

function Bout({ icon, active, label }: { icon: string; active?: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs ${active ? 'bg-tera-highlight text-tera-primary' : 'text-tera-secondary'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
        {iconMap[icon]}
      </svg>
      <span>{label}</span>
    </div>
  )
}

function AppSidebar() {
  return (
    <aside className="hidden w-44 shrink-0 border-r border-tera-border bg-tera-muted/40 p-3 md:block">
      <div className="mb-4 flex items-center gap-2 px-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-tera-border bg-tera-highlight text-[0.6rem] font-bold text-tera-accent">T</span>
        <span className="text-sm font-semibold text-tera-primary">TeraAI</span>
      </div>
      <div className="space-y-1">
        {navItems.map((item, i) => (
          <Bout key={item.label} icon={item.icon} label={item.label} active={i === 0} />
        ))}
      </div>
    </aside>
  )
}

function WindowFrame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-tera-border bg-tera-panel shadow-panel">
      <div className="flex items-center gap-1.5 border-b border-tera-border bg-tera-muted/50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <div className="ml-3 flex-1 truncate rounded-full border border-tera-border bg-tera-input px-3 py-1 text-[0.68rem] text-tera-secondary">
          {url}
        </div>
      </div>
      <div className="flex">{children}</div>
    </div>
  )
}

function SourceChips({ chips }: { chips: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span key={chip} className="rounded-full border border-tera-border bg-tera-muted px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-tera-secondary">
          {chip}
        </span>
      ))}
    </div>
  )
}

function Composer() {
    return (
      <div className="flex items-center gap-2 border-t border-tera-border px-4 py-3">
        <div className="flex-1 rounded-full border border-tera-border bg-tera-input px-3.5 py-2 text-[0.7rem] text-tera-secondary">
          Ask TeraAI about anything...
        </div>
        <div className="composer-send-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M4 12h16M14 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    )
  }

function StudyModeChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-tera-border bg-tera-muted px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-tera-secondary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-2.5 w-2.5">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      </svg>
      Study mode
    </span>
  )
}

function ChatPreview() {
  return (
    <WindowFrame url="teraai.chat/new">
      <AppSidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 px-5 pb-5 pt-6">
          <div className="ml-auto w-fit max-w-[80%] rounded-[18px] border border-tera-border bg-tera-elevated px-4 py-2.5">
            <p className="text-xs leading-relaxed text-tera-primary">Explain how the water cycle keeps moving, step by step.</p>
          </div>

          <div className="max-w-[88%] rounded-[18px] border border-tera-border bg-tera-muted/60 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-tera-border bg-tera-highlight text-[0.5rem] font-bold text-tera-accent">T</span>
              <span className="text-[0.65rem] text-tera-secondary">TeraAI</span>
              <StudyModeChip />
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-tera-primary">
              Water keeps moving through a closed loop powered by the sun. There are five key steps.
            </p>
            {[
              'Evaporation: the sun heats oceans and lakes, and liquid water rises as vapor.',
              'Condensation: vapor cools and gathers into clouds.',
              'Precipitation: water falls back as rain or snow.',
              'Collection: it returns to oceans, lakes, and rivers, and the cycle begins again.',
            ].map((step, i) => (
              <div key={step} className="mt-2 flex gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-tera-highlight text-[0.55rem] text-tera-secondary">{i + 1}</span>
                <p className="text-[0.7rem] leading-relaxed text-tera-secondary">{step}</p>
              </div>
            ))}
            <SourceChips chips={['NASA Earth', 'USGS', 'National Geographic']} />
            <div className="relative mt-4 overflow-hidden rounded-xl border border-tera-border bg-tera-panel/80 px-3.5 py-2.5">
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-tera-secondary">Checkpoint</p>
              <p className="mt-1 text-[0.72rem] font-medium text-tera-primary">What makes water rise from lakes as vapor?</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-tera-border bg-tera-muted px-2.5 py-1 text-[0.62rem] text-tera-secondary">Wind force</span>
                <span className="rounded-full border border-tera-neon/30 bg-tera-highlight px-2.5 py-1 text-[0.62rem] text-tera-primary">Solar heat</span>
                <span className="rounded-full border border-tera-border bg-tera-muted px-2.5 py-1 text-[0.62rem] text-tera-secondary">Gravity</span>
              </div>
            </div>
          </div>
        </div>
        <Composer />
      </div>
    </WindowFrame>
  )
}

function explainCard(title: string, steps: string[]) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-tera-border bg-tera-panel p-4 shadow-panel">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-tera-border bg-tera-highlight text-[0.5rem] font-bold text-tera-accent">T</span>
        <span className="text-xs font-medium text-tera-primary">{title}</span>
      </div>
      <div className="mt-3 space-y-2">
        {steps.map((step, i) => (
          <div key={step} className="flex gap-2.5">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-tera-highlight text-[0.55rem] text-tera-secondary">{i + 1}</span>
            <p className="text-[0.72rem] leading-relaxed text-tera-secondary">{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExplainPreview() {
  return explainCard(
    'Photosynthesis, unpacked',
    [
      'Light hits leaf cells and splits water into oxygen.',
      'Carbon dioxide is captured from the air.',
      'Energy converts CO2 and water into glucose.',
      'The plant uses glucose for growth and stores the rest.',
    ],
  )
}

function ResearchPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-tera-border bg-tera-panel p-4 shadow-panel">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-tera-primary">Deep Research</p>
        <span className="rounded-full border border-tera-neon/25 bg-tera-highlight px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em] text-tera-accent">10 sources</span>
      </div>
      {[
        { domain: 'nature.com', snippet: 'Neural networks improve when exposed to structured repetition over time.' },
        { domain: 'ncbi.nlm.nih.gov', snippet: 'Active recall strengthens long-term memory more than rereading.' },
      ].map((s) => (
        <div key={s.domain} className="mt-2.5 rounded-xl border border-tera-border bg-tera-muted/60 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-tera-highlight" />
            <p className="text-[0.62rem] font-medium text-tera-primary">{s.domain}</p>
          </div>
          <p className="mt-1 text-[0.68rem] leading-relaxed text-tera-secondary">{s.snippet}</p>
        </div>
      ))}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {['#1', '#2', '#3'].map((c) => (
          <span key={c} className="rounded-full border border-tera-border bg-tera-muted px-2 py-0.5 text-[0.6rem] text-tera-secondary">
            Source {c}
          </span>
        ))}
      </div>
    </div>
  )
}

function UploadPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-tera-border bg-tera-panel p-4 shadow-panel">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tera-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 text-tera-secondary">
            <path d="M4 4h16v16H4zM4 8h16M8 4v4M14 15h4M14 18h4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-tera-primary">lecture_notes.pdf</p>
          <p className="text-[0.62rem] text-tera-secondary">248 KB · 12 pages</p>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-tera-border bg-tera-muted/60 px-3 py-2 text-[0.68rem] leading-relaxed text-tera-secondary">
        <p className="text-tera-primary">Key ideas detected in this document:</p>
        <p className="mt-1">1. Supply shifts prices in the short run.</p>
        <p>2. Elasticity measures buyer response to change.</p>
        <p>3. Surplus is split between buyers and sellers.</p>
      </div>
      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-tera-border bg-tera-muted px-2.5 py-1 text-[0.6rem] text-tera-secondary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-2.5 w-2.5">
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
        </svg>
        Summarized for you
      </div>
    </div>
  )
}

function QuizPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-tera-border bg-tera-panel p-4 shadow-panel">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-tera-primary">Quiz · Question 2 of 5</p>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-tera-muted">
          <div className="h-full w-2/5 rounded-full bg-tera-primary" />
        </div>
      </div>
      <p className="mt-3 text-[0.78rem] font-medium leading-relaxed text-tera-primary">
        Which part of a neuron receives incoming signals?
      </p>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 rounded-lg border border-tera-border bg-tera-muted/60 px-3 py-2">
          <span className="h-3 w-3 rounded-full border border-tera-border" />
          <p className="text-[0.7rem] text-tera-secondary">Axon</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-tera-neon/30 bg-tera-highlight px-3 py-2">
          <span className="h-3 w-3 rounded-full border-2 border-tera-neon bg-tera-neon/30" />
          <p className="text-[0.7rem] text-tera-primary">Dendrite</p>
          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-2.5 w-2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-tera-border bg-tera-muted/60 px-3 py-2">
          <span className="h-3 w-3 rounded-full border border-tera-border" />
          <p className="text-[0.7rem] text-tera-secondary">Myelin sheath</p>
        </div>
      </div>
    </div>
  )
}

export function ProductPreview({ variant }: { variant: PreviewVariant }) {
  if (variant === 'chat') return <ChatPreview />
  if (variant === 'explain') return <ExplainPreview />
  if (variant === 'research') return <ResearchPreview />
  if (variant === 'upload') return <UploadPreview />
  return <QuizPreview />
}