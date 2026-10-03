import SkillMarketplace from '@/components/SkillMarketplace'
import { getSelectedSkill, getSkillsMarketplaceData, filterMarketplaceSkills, paginateSkills } from '@/lib/skills-marketplace'

const connectors = [
  { name: 'Talocode Cloud', platform: 'skills', detail: 'Skills call every Talocode product API through the Cloud MCP server after you agree.', href: 'https://dashboard.talocode.site/oauth/authorize?redirect_uri=https://teraai.chat/api/connectors/callback&state=skills' },
  { name: 'X', platform: 'x', detail: 'Connect opens the platform MCP consent screen.', href: '/api/connectors/connect?platform=x' },
  { name: 'xAI', platform: 'xai', detail: 'Connect opens the platform MCP consent screen.', href: '/api/connectors/connect?platform=xai' },
  { name: 'GitHub', platform: 'github', detail: 'Connect opens the platform MCP consent screen.', href: '/api/connectors/connect?platform=github' },
]

type SearchParams = { q?: string; source?: string; page?: string; skill?: string; tab?: string; connected?: string; error?: string }

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
      <h1 className="mt-2 text-3xl font-semibold">Connect through the platform</h1>
      <p className="mt-3 max-w-2xl text-sm text-tera-secondary">Skills use the Talocode Cloud MCP server. Agree on the dashboard and Tera can call the product APIs on that account. Decline and Tera gets nothing.</p>
      {params.connected ? <p className="mt-4 text-sm">Connected {params.connected}.</p> : null}
      {params.error ? <p className="mt-4 text-sm">Consent did not finish ({params.error}).</p> : null}
      <div className="mt-6 flex gap-2">
        <a href="/connectors" className={`rounded-full px-4 py-2 text-sm ${tab === 'connectors' ? 'bg-tera-primary text-tera-bg' : 'border border-tera-border'}`}>Connectors</a>
        <a href="/connectors?tab=skills" className={`rounded-full px-4 py-2 text-sm ${tab === 'skills' ? 'bg-tera-primary text-tera-bg' : 'border border-tera-border'}`}>Skills</a>
      </div>
      {tab === 'connectors' ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {connectors.map((item) => (
            <a key={item.platform} href={item.href} className="rounded-2xl border border-tera-border p-4">
              <h2 className="text-lg font-medium">{item.name}</h2>
              <p className="mt-2 text-sm text-tera-secondary">{item.detail}</p>
              <span className="mt-4 inline-block text-sm">Connect</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <p className="mb-4 text-sm"><a href="https://dashboard.talocode.site/oauth/authorize?redirect_uri=https://teraai.chat/api/connectors/callback&state=skills">Connect Talocode Cloud for skills</a></p>
          <SkillMarketplace query={query} source={source} page={pagination.page} totalPages={pagination.totalPages} totalResults={filteredSkills.length} totalSkills={data.stats.total} selectedSkill={selectedSkill} results={pagination.slice} stats={data.stats} />
        </div>
      )}
    </main>
  )
}
