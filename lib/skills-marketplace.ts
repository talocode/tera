export type SkillSource = 'Tera' | 'NSA'

export type MarketplaceSkill = {
  id: string
  name: string
  description: string
  source: SkillSource
  section: string
  sectionSlug: string
  sourceUrl?: string
  launchPrompt: string
  tags: string[]
}

export type MarketplaceSection = {
  id: string
  title: string
  description: string
  source: SkillSource
  sourceSlug: string
  count: number
  skills: MarketplaceSkill[]
}

export type SkillsMarketplaceData = {
  sections: MarketplaceSection[]
  skills: MarketplaceSkill[]
  stats: {
    total: number
    tera: number
    nsa: number
  }
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

const buildLaunchPrompt = (skill: Omit<MarketplaceSkill, 'launchPrompt'>) => {
  return [
    `Skill context: ${skill.name}`,
    `Source: ${skill.source}`,
    `Section: ${skill.section}`,
    `Description: ${skill.description}`,
    '',
    'Teach the user with a calm, clear, step-by-step style.',
    'Focus on learning, not jargon.',
    'Use examples, checkpoints, and a concise next action when helpful.',
  ].join('\n')
}

const createSkill = (skill: Omit<MarketplaceSkill, 'launchPrompt'>): MarketplaceSkill => ({
  ...skill,
  launchPrompt: buildLaunchPrompt(skill),
})

const createSection = (
  title: string,
  description: string,
  source: SkillSource,
  skills: Omit<MarketplaceSkill, 'launchPrompt'>[],
): MarketplaceSection => {
  const preparedSkills = skills.map(createSkill)

  return {
    id: `${source.toLowerCase()}-${slugify(title)}`,
    title,
    description,
    source,
    sourceSlug: source.toLowerCase(),
    count: preparedSkills.length,
    skills: preparedSkills,
  }
}

const teraSections: MarketplaceSection[] = [
  createSection('Tera Core', 'Built-in Tera workflows for learning, research, writing, and building.', 'Tera', [
    {
      id: 'tera-learn',
      name: 'Learn',
      description: 'Explain concepts clearly, step by step, with examples and checkpoints.',
      source: 'Tera',
      section: 'Tera Core',
      sectionSlug: 'tera-core',
      sourceUrl: '/new',
      tags: ['Learning', 'Explain', 'Mastery'],
    },
    {
      id: 'tera-research',
      name: 'Research',
      description: 'Compare sources, weigh evidence, and turn the result into a clean brief.',
      source: 'Tera',
      section: 'Tera Core',
      sectionSlug: 'tera-core',
      sourceUrl: '/deep-research',
      tags: ['Research', 'Sources', 'Evidence'],
    },
    {
      id: 'tera-build',
      name: 'Build',
      description: 'Turn an idea into a plan, spec, or implementation path.',
      source: 'Tera',
      section: 'Tera Core',
      sectionSlug: 'tera-core',
      sourceUrl: '/new',
      tags: ['Build', 'Plan', 'Ship'],
    },
    {
      id: 'tera-quiz',
      name: 'Quiz',
      description: 'Test understanding with quick questions and useful feedback.',
      source: 'Tera',
      section: 'Tera Core',
      sectionSlug: 'tera-core',
      sourceUrl: '/new',
      tags: ['Quiz', 'Recall', 'Practice'],
    },
    {
      id: 'tera-summarize',
      name: 'Summarize',
      description: 'Condense long text into a compact, useful summary.',
      source: 'Tera',
      section: 'Tera Core',
      sectionSlug: 'tera-core',
      sourceUrl: '/new',
      tags: ['Summary', 'Reading', 'Notes'],
    },
    {
      id: 'tera-image',
      name: 'Image',
      description: 'Handle image-focused prompts, visual analysis, and multimodal tasks.',
      source: 'Tera',
      section: 'Tera Core',
      sectionSlug: 'tera-core',
      sourceUrl: '/images',
      tags: ['Image', 'Visual', 'Multimodal'],
    },
  ]),
]

const nsaRepoBase = 'https://github.com/NationalSecurityAgency'

const nsaSections: MarketplaceSection[] = [
  createSection('SkillTree Learning', 'Structured learning paths and progress tracking from the NSA skills-service project.', 'NSA', [
    {
      id: 'nsa-skilltree-foundations',
      name: 'SkillTree Foundations',
      description: 'Learn how skill trees structure learning paths, checkpoints, and progress.',
      source: 'NSA',
      section: 'SkillTree Learning',
      sectionSlug: 'skilltree-learning',
      sourceUrl: `${nsaRepoBase}/skills-service`,
      tags: ['Learning Path', 'Progress', 'Training'],
    },
    {
      id: 'nsa-skilltree-creator',
      name: 'SkillTree Builder',
      description: 'Design a skill tree for a course, team, or self-study program.',
      source: 'NSA',
      section: 'SkillTree Learning',
      sectionSlug: 'skilltree-learning',
      sourceUrl: `${nsaRepoBase}/skills-service`,
      tags: ['Curriculum', 'Roadmap', 'Practice'],
    },
    {
      id: 'nsa-skills-client',
      name: 'Skills Client',
      description: 'Understand how learning progress can be integrated into apps and dashboards.',
      source: 'NSA',
      section: 'SkillTree Learning',
      sectionSlug: 'skilltree-learning',
      sourceUrl: `${nsaRepoBase}/skills-client`,
      tags: ['Integration', 'Progress', 'Apps'],
    },
  ]),
  createSection('Security and Reverse Engineering', 'Practical learning skills inspired by NSA open-source security tooling.', 'NSA', [
    {
      id: 'nsa-ghidra-overview',
      name: 'Ghidra Overview',
      description: 'Learn what Ghidra is and how reverse engineering workflows are organized.',
      source: 'NSA',
      section: 'Security and Reverse Engineering',
      sectionSlug: 'security-and-reverse-engineering',
      sourceUrl: `${nsaRepoBase}/ghidra`,
      tags: ['Security', 'Reverse Engineering', 'Binary'],
    },
    {
      id: 'nsa-ghidra-basics',
      name: 'Binary Analysis Basics',
      description: 'Break down binaries safely with a clear, beginner-friendly workflow.',
      source: 'NSA',
      section: 'Security and Reverse Engineering',
      sectionSlug: 'security-and-reverse-engineering',
      sourceUrl: `${nsaRepoBase}/ghidra`,
      tags: ['Analysis', 'Debugging', 'Learning'],
    },
    {
      id: 'nsa-threat-modeling',
      name: 'Threat Modeling',
      description: 'Learn how to think about risk, trust boundaries, and system design.',
      source: 'NSA',
      section: 'Security and Reverse Engineering',
      sectionSlug: 'security-and-reverse-engineering',
      sourceUrl: `${nsaRepoBase}/ghidra`,
      tags: ['Security', 'Risk', 'Design'],
    },
  ]),
  createSection('Data and Search', 'Learn how large-scale data search systems and query workflows are organized.', 'NSA', [
    {
      id: 'nsa-datawave-overview',
      name: 'DataWave Overview',
      description: 'Understand a secure, query-driven data search workflow.',
      source: 'NSA',
      section: 'Data and Search',
      sectionSlug: 'data-and-search',
      sourceUrl: `${nsaRepoBase}/DataWave`,
      tags: ['Search', 'Query', 'Data'],
    },
    {
      id: 'nsa-datawave-query',
      name: 'Query Explorer',
      description: 'Practice turning questions into effective search queries.',
      source: 'NSA',
      section: 'Data and Search',
      sectionSlug: 'data-and-search',
      sourceUrl: `${nsaRepoBase}/DataWave`,
      tags: ['Querying', 'Research', 'Patterns'],
    },
  ]),
  createSection('Workflow and Graphs', 'Skills for thinking in graphs, workflows, and event-driven systems.', 'NSA', [
    {
      id: 'nsa-emissary-workflows',
      name: 'Workflow Design',
      description: 'Learn how distributed workflows are structured and coordinated.',
      source: 'NSA',
      section: 'Workflow and Graphs',
      sectionSlug: 'workflow-and-graphs',
      sourceUrl: `${nsaRepoBase}/Emissary`,
      tags: ['Workflow', 'Automation', 'Systems'],
    },
    {
      id: 'nsa-lemongraph',
      name: 'Graph Thinking',
      description: 'Learn how graph models help represent relationships and events.',
      source: 'NSA',
      section: 'Workflow and Graphs',
      sectionSlug: 'workflow-and-graphs',
      sourceUrl: `${nsaRepoBase}/LemonGraph`,
      tags: ['Graphs', 'Modeling', 'Systems'],
    },
  ]),
]

export const skillsMarketplaceData: SkillsMarketplaceData = (() => {
  const sections = [...teraSections, ...nsaSections]
  const skills = sections.flatMap((section) => section.skills)

  return {
    sections,
    skills,
    stats: {
      total: skills.length,
      tera: teraSections.reduce((sum, section) => sum + section.count, 0),
      nsa: nsaSections.reduce((sum, section) => sum + section.count, 0),
    },
  }
})()

export const getSkillsMarketplaceData = async () => skillsMarketplaceData

export const buildSkillSessionHref = (skill: MarketplaceSkill) => {
  const sessionId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const params = new URLSearchParams({
    sessionId,
    prompt: skill.launchPrompt,
  })

  return `/new?${params.toString()}`
}

export const filterMarketplaceSkills = (skills: MarketplaceSkill[], query: string, source: string) => {
  const normalizedQuery = query.trim().toLowerCase()
  const normalizedSource = source.trim().toLowerCase()

  return skills.filter((skill) => {
    const matchesSource = !normalizedSource || normalizedSource === 'all' || skill.source.toLowerCase() === normalizedSource
    const matchesQuery =
      !normalizedQuery ||
      `${skill.name} ${skill.description} ${skill.section} ${skill.tags.join(' ')}`.toLowerCase().includes(normalizedQuery)

    return matchesSource && matchesQuery
  })
}

export const paginateSkills = (skills: MarketplaceSkill[], page: number, pageSize: number) => {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1
  const start = (safePage - 1) * pageSize
  return {
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(skills.length / pageSize)),
    slice: skills.slice(start, start + pageSize),
  }
}

export const getSelectedSkill = (skills: MarketplaceSkill[], skillSlug: string | null | undefined) => {
  if (!skillSlug) return skills[0] ?? null
  const normalized = skillSlug.trim().toLowerCase()
  return skills.find((skill) => slugify(skill.name) === normalized || skill.id.toLowerCase() === normalized) ?? (skills[0] ?? null)
}
