import Link from 'next/link'
import { buildSkillSessionHref, type MarketplaceSkill } from '@/lib/skills-marketplace'

type SkillMarketplaceProps = {
  query: string
  source: string
  page: number
  totalPages: number
  totalResults: number
  totalSkills: number
  selectedSkill: MarketplaceSkill | null
  results: MarketplaceSkill[]
  stats: {
    total: number
    tera: number
    nsa: number
  }
}

const SOURCE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Tera', value: 'tera' },
  { label: 'NSA', value: 'nsa' },
]

const buildQueryHref = ({
  q,
  source,
  page,
  skill,
}: {
  q?: string
  source?: string
  page?: number
  skill?: string | null
}) => {
  const params = new URLSearchParams()

  if (q && q.trim()) params.set('q', q.trim())
  if (source && source !== 'all') params.set('source', source)
  if (page && page > 1) params.set('page', String(page))
  if (skill) params.set('skill', skill)

  const suffix = params.toString()
  return suffix ? `/skills?${suffix}` : '/skills'
}

const StatCard = ({ label, value, hint }: { label: string; value: string | number; hint: string }) => (
  <div className="tera-card-subtle p-4">
    <p className="text-[0.65rem] uppercase tracking-[0.32em] text-tera-secondary">{label}</p>
    <div className="mt-3 flex items-end justify-between gap-3">
      <p className="text-3xl font-semibold tracking-[-0.04em] text-tera-primary">{value}</p>
      <p className="max-w-[9rem] text-right text-xs leading-5 text-tera-secondary">{hint}</p>
    </div>
  </div>
)

const SkillBadge = ({ children }: { children: string }) => (
  <span className="tera-badge">
    {children}
  </span>
)

const SkillCard = ({
  skill,
  selected,
  q,
  source,
  page,
}: {
  skill: MarketplaceSkill
  selected: boolean
  q: string
  source: string
  page: number
}) => {
  const detailHref = buildQueryHref({ q, source, page, skill: skill.id })
  const launchHref = buildSkillSessionHref(skill)

  return (
    <article
      className={[
        'group flex h-full flex-col rounded-[24px] border p-5 transition-all duration-200',
        selected
          ? 'border-tera-primary bg-tera-primary text-tera-bg shadow-[0_18px_40px_rgba(0,0,0,0.18)]'
          : 'tera-card hover:-translate-y-0.5 hover:border-tera-border/90',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={[
            'text-[0.62rem] uppercase tracking-[0.28em]',
            selected ? 'text-tera-bg/70' : 'text-tera-secondary',
          ].join(' ')}>
            {skill.source}
          </p>
          <Link href={detailHref} className="mt-2 block">
            <h3 className={[
              'text-[1.02rem] font-semibold tracking-[-0.03em] transition',
              selected ? 'text-tera-bg' : 'text-tera-primary group-hover:text-tera-primary',
            ].join(' ')}>
              {skill.name}
            </h3>
          </Link>
        </div>
        <SkillBadge>{skill.section}</SkillBadge>
      </div>

      <p className={[
        'mt-3 text-sm leading-6',
        selected ? 'text-tera-bg/82' : 'text-tera-secondary',
      ].join(' ')}>
        {skill.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {skill.tags.slice(0, 3).map((tag) => (
          <SkillBadge key={tag}>{tag}</SkillBadge>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Link
          href={detailHref}
          className={[
            'text-xs font-semibold uppercase tracking-[0.28em] transition',
            selected ? 'text-tera-bg/90 hover:text-tera-bg' : 'text-tera-secondary hover:text-tera-primary',
          ].join(' ')}
        >
          Details
        </Link>
        <Link
          href={launchHref}
          className={[
            'inline-flex items-center justify-center rounded-full px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.24em] transition',
            selected
              ? 'bg-tera-bg text-tera-primary hover:opacity-90'
              : 'border border-tera-border bg-tera-primary text-tera-bg hover:opacity-90',
          ].join(' ')}
        >
          Use in Tera
        </Link>
      </div>
    </article>
  )
}

const DetailPanel = ({ skill }: { skill: MarketplaceSkill | null }) => {
  if (!skill) {
    return (
      <aside className="tera-card h-fit md:sticky md:top-24">
        <p className="text-xs uppercase tracking-[0.35em] text-tera-secondary">Selected skill</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-tera-primary">Choose a skill</h2>
        <p className="mt-3 text-sm leading-6 text-tera-secondary">
          Pick any entry from the marketplace to preview the launch context and open it inside a fresh Tera session.
        </p>
      </aside>
    )
  }

  return (
    <aside className="tera-card h-fit md:sticky md:top-24">
      <p className="text-xs uppercase tracking-[0.35em] text-tera-secondary">Selected skill</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-tera-primary">{skill.name}</h2>
      <p className="mt-3 text-sm leading-6 text-tera-secondary">{skill.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <SkillBadge>{skill.source}</SkillBadge>
        <SkillBadge>{skill.section}</SkillBadge>
      </div>

      <div className="mt-6 tera-card-subtle p-4">
        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-tera-secondary">Launch context</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-tera-primary">
          {skill.launchPrompt}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Link
          href={buildSkillSessionHref(skill)}
          className="inline-flex items-center justify-center rounded-full bg-tera-primary px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-tera-bg transition hover:opacity-90"
        >
          Use in Tera
        </Link>
        {skill.sourceUrl?.startsWith('http') && (
          <Link
            href={skill.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-tera-border px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-tera-primary transition hover:border-tera-primary hover:bg-tera-highlight"
          >
            Open source
          </Link>
        )}
      </div>
    </aside>
  )
}

export default function SkillMarketplace({
  query,
  source,
  page,
  totalPages,
  totalResults,
  totalSkills,
  selectedSkill,
  results,
  stats,
}: SkillMarketplaceProps) {
  const activeSource = source.trim() || 'all'

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Skills Library</p>
            <h1 className="tera-title mt-3">Tera skill library</h1>
            <p className="tera-subtitle mt-4 max-w-2xl">
              Explore Tera learning skills and real open-source learning systems from NSA repositories. Launch a skill into a fresh chat with context attached.
            </p>
          </div>
          <div className="grid w-full max-w-[20rem] gap-3 sm:grid-cols-2">
            <StatCard label="Total skills" value={stats.total} hint="Loaded from the curated learning catalog." />
            <StatCard label="Results" value={totalResults} hint={`Page ${page} of ${totalPages}.`} />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="tera-card-subtle px-4 py-3">
            <p className="text-sm text-tera-secondary">
              Use the filters below, preview a skill, and launch it into Tera with the right context already seeded.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={buildQueryHref({ q: query, source: 'tera', page: 1, skill: selectedSkill?.id ?? null })} className="tera-button-primary">
              Open Tera learning
            </Link>
            <Link href={buildQueryHref({ q: query, source: 'nsa', page: 1, skill: selectedSkill?.id ?? null })} className="tera-button-secondary">
              Browse NSA
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <div className="tera-segmented flex-wrap">
            {SOURCE_FILTERS.map((filter) => {
              const href = buildQueryHref({
                q: query,
                source: filter.value,
                page: 1,
                skill: selectedSkill ? selectedSkill.id : null,
              })
              const active = activeSource === filter.value

              return (
                <Link
                  key={filter.value}
                  href={href}
                  className="tera-segmented-item"
                  data-active={active}
                >
                  {filter.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <div className="tera-card p-4">
              <form method="get" className="flex flex-col gap-3 md:flex-row md:items-center">
                <input type="hidden" name="source" value={activeSource} />
                <input type="hidden" name="page" value="1" />
                <label className="flex-1">
                  <span className="sr-only">Search skills</span>
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search skills, categories, or descriptions"
                    className="tera-input h-12 w-full rounded-[18px] px-4 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-[18px] bg-tera-primary px-4 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-tera-bg transition hover:opacity-90"
                >
                  Search
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-tera-border pt-4">
                <p className="text-sm text-tera-secondary">
                  Showing <span className="font-semibold text-tera-primary">{totalResults}</span> of {totalSkills} skills
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={buildQueryHref({ q: query, source: activeSource, page: Math.max(1, page - 1), skill: selectedSkill?.id ?? null })}
                    className={[
                      'inline-flex h-10 items-center justify-center rounded-full border px-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] transition',
                      page <= 1
                        ? 'pointer-events-none border-tera-border/50 text-tera-secondary/40'
                        : 'border-tera-border text-tera-secondary hover:border-tera-primary hover:text-tera-primary',
                    ].join(' ')}
                  >
                    Prev
                  </Link>
                  <span className="text-xs uppercase tracking-[0.26em] text-tera-secondary">
                    Page {page} / {totalPages}
                  </span>
                  <Link
                    href={buildQueryHref({ q: query, source: activeSource, page: Math.min(totalPages, page + 1), skill: selectedSkill?.id ?? null })}
                    className={[
                      'inline-flex h-10 items-center justify-center rounded-full border px-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] transition',
                      page >= totalPages
                        ? 'pointer-events-none border-tera-border/50 text-tera-secondary/40'
                        : 'border-tera-border text-tera-secondary hover:border-tera-primary hover:text-tera-primary',
                    ].join(' ')}
                  >
                    Next
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.length === 0 ? (
                <div className="md:col-span-2 xl:col-span-3 tera-card-subtle p-6 text-sm text-tera-secondary">
                  No skills match your current filters.
                </div>
              ) : (
                results.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    selected={selectedSkill?.id === skill.id}
                    q={query}
                    source={activeSource}
                    page={page}
                  />
                ))
              )}
            </div>
          </section>

          <DetailPanel skill={selectedSkill} />
        </div>
      </div>
    </div>
  )
}
