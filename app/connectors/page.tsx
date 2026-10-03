import SkillMarketplace from '@/components/SkillMarketplace'
import { getSelectedSkill, getSkillsMarketplaceData, filterMarketplaceSkills, paginateSkills } from '@/lib/skills-marketplace'

const connectors = [
  { name: 'X', detail: 'Link the X account. This is identity, not an API bill.', href: '/api/connectors/x' },
  { name: 'xAI', detail: 'API usage bills the connected xAI console, not Tera and not X Premium.', href: 'https://accounts.x.ai' },
  { name: 'Google', detail: 'Gmail and Calendar stay on the account you already pay for.', href: '/api/oauth/google' },
  { name: 'GitHub', detail: 'Repos and issues stay on the GitHub account you already pay for.', href: 'https://github.com/login/oauth/authorize' },
]

type SearchParams = { q?: string; source?: string; page?: string; skill?: string; tab?: string }

export default async function ConnectorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const tab = params.tab === 'skills' ? 'skills' : 'connectors'
  const query = params.q ?? ''
  const source = params.source ?? 'all'
  const page = Number.parseInt(params.page ?? '1', 10) || 1
  const data = await getSkillsMarketplaceData()
  const filteredSkills = filterMarketplaceSkills(data.skills, query, source)
  const pagination = paginateSkills(filteredSkills, page, 36)
  const selectedSkill = getSelectedSkill(filteredSkills.length > 0 ? filteredSkills : data.skills, params.skill ?? null)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-tera-primary">
      <p className="text-xs uppercase tracking-[0.16em] text-tera-secondary">Connectors</p>
      <h1 className="mt-2 text-3xl font-semibold">Connect what you already pay for</h1>
      <p className="mt-3 max-w-2xl text-sm text-tera-secondary">Tera does not take your xAI key. X Premium does not pay third-party API calls. Linking X identifies the account. Model calls bill the xAI console on the account you connect.</p>
      <div className="mt-6 flex gap-2">
        <a href="/connectors" className={`rounded-full px-4 py-2 text-sm ${tab === 'connectors' ? 'bg-tera-primary text-tera-bg' : 'border border-tera-border'}`}>Connectors</a>
        <a href="/connectors?tab=skills" className={`rounded-full px-4 py-2 text-sm ${tab === 'skills' ? 'bg-tera-primary text-tera-bg' : 'border border-tera-border'}`}>Skills</a>
      </div>
      {tab === 'connectors' ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {connectors.map((item) => (
            <a key={item.name} href={item.href} className="rounded-2xl border border-tera-border p-4">
              <h2 className="text-lg font-medium">{item.name}</h2>
              <p className="mt-2 text-sm text-tera-secondary">{item.detail}</p>
              <span className="mt-4 inline-block text-sm">Connect</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <SkillMarketplace query={query} source={source} page={pagination.page} totalPages={pagination.totalPages} totalResults={filteredSkills.length} totalSkills={data.stats.total} selectedSkill={selectedSkill} results={pagination.slice} stats={data.stats} />
        </div>
      )}
    </main>
  )
}
