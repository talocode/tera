import SkillMarketplace from '@/components/SkillMarketplace'
import { getSelectedSkill, getSkillsMarketplaceData, filterMarketplaceSkills, paginateSkills } from '@/lib/skills-marketplace'

type SearchParams = {
  q?: string
  source?: string
  page?: string
  skill?: string
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const query = params.q ?? ''
  const source = params.source ?? 'all'
  const page = Number.parseInt(params.page ?? '1', 10) || 1
  const selectedSkillSlug = params.skill ?? null

  const data = await getSkillsMarketplaceData()
  const filteredSkills = filterMarketplaceSkills(data.skills, query, source)
  const pagination = paginateSkills(filteredSkills, page, 36)
  const selectedSkill = getSelectedSkill(filteredSkills.length > 0 ? filteredSkills : data.skills, selectedSkillSlug)

  return (
    <SkillMarketplace
      query={query}
      source={source}
      page={pagination.page}
      totalPages={pagination.totalPages}
      totalResults={filteredSkills.length}
      totalSkills={data.stats.total}
      selectedSkill={selectedSkill}
      results={pagination.slice}
      stats={data.stats}
    />
  )
}
