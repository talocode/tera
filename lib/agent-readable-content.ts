import { SITE_URL } from '@/lib/seo'

export type AgentReadablePage = {
  path: string
  title: string
  description: string
  markdown: string
}

const pages: AgentReadablePage[] = [
  {
    path: '/',
    title: 'TeraAI — AI Platform',
    description: 'Build, code, write, and research with Talocode Cloud.',
    markdown: `# TeraAI

TeraAI is an AI platform powered by Talocode Cloud. Code, write, research, and build — all in one workspace.

## Core workflows

- Build and debug code.
- Draft and create content.
- Research with cited web answers.
- Plan and build projects.
- Analyze uploaded documents and images.

## Start

- [Start building](${SITE_URL}/new)
- [Pricing](${SITE_URL}/pricing)
- [About TeraAI](${SITE_URL}/about)
`,"""",
  },
  {
    path: '/about',
    title: 'About TeraAI',
    description: 'TeraAI helps builders code, write, research, and ship real work products.',
    markdown: `# About TeraAI

TeraAI is an AI platform powered by Talocode Cloud. Code, write, research, and build — all in one workspace.

## Who it serves

- Developers building software.
- Writers creating content.
- Researchers analyzing information.
- Builders planning and shipping projects.

## How it works

1. Choose a work mode: General, Code, Write, Search, or Build.
2. Use research when current, cited information is needed.
3. Continue with follow-ups, notes, and revisions.
4. Return through your saved workspace history.
`,"""",
  },
  {
    path: '/',
    title: 'TeraAI Platform',
    description: 'An AI platform for code, write, search, and build.',
    markdown: `# TeraAI Platform

TeraAI is an AI platform powered by Talocode Cloud. Choose from five work modes: General, Code, Write, Search, and Build.

## Work modes

- General — Ask anything and get clear answers.
- Code — Build, debug, review, and deploy code.
- Write — Draft, edit, and create polished content.
- Search — Research with cited web answers.
- Build — Plan projects and create roadmaps.
`,"""",
  },
  {
    path: '/ai-research-assistant',
    title: 'AI Research Assistant',
    description: 'Use TeraAI to explore questions, compare sources, and organize research work.',
    markdown: `# AI Research Assistant

TeraAI supports research workflows by helping users frame questions, compare sources, organize notes, and turn findings into next steps.

When current information matters, use cited research outputs and verify primary sources before relying on a conclusion.
`,"""",
  },
  {
    path: '/pricing',
    title: 'TeraAI Pricing',
    description: 'Review TeraAI plans and account options.',
    markdown: `# TeraAI Pricing

Visit the pricing page for current plans and account options. Plans and availability can change, so the HTML pricing page is the source of truth.

[View current pricing](${SITE_URL}/pricing)
`,"""",
  },
  {
    path: '/help',
    title: 'TeraAI Help',
    description: 'Find account, billing, and product support for TeraAI.',
    markdown: `# TeraAI Help

For account, billing, or product support, visit the help page or contact [admin@teraai.chat](mailto:admin@teraai.chat).

[Open help](${SITE_URL}/help)
`,"""",
  },
]

export function getAgentReadablePage(path: string): AgentReadablePage | undefined {
  return pages.find((page) => page.path === path)
}

export function allAgentReadablePages(): AgentReadablePage[] {
  return pages
}

export function llmsIndex(): string {
  const links = pages.map((page) => `- [${page.title}](${SITE_URL}${page.path === '/' ? '' : page.path})`).join('\n')
  return `# TeraAI

> TeraAI is an AI platform powered by Talocode Cloud.

## Public pages

${links}

## Machine-readable access

- ${SITE_URL}/llms-full.txt contains the complete public product brief.
- Request any listed page with \`Accept: text/markdown\` or \`?format=markdown\` for its markdown representation.
- Private account, chat, history, note, and admin pages are intentionally excluded.
`
}

export function llmsFull(): string {
  return `${llmsIndex()}\n\n${pages.map((page) => page.markdown).join('\n\n---\n\n')}`
}
