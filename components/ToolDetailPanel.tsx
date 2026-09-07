import { Tool } from './ToolCard'

const samplePrompts: Record<string, string> = {
  'Code Builder': 'Build a full-stack CRUD API with authentication, validation, and error handling.',
  'Content Writer': 'Draft a product launch announcement with a compelling headline, clear benefits, and a strong CTA.',
  'Web Researcher': 'Research the latest developments in AI infrastructure and present findings with cited sources.',
  'Project Planner': 'Create a 3-month roadmap for launching a new SaaS product with milestones and dependencies.',
  'General Assistant': 'What are the key considerations when migrating a monolith to microservices?',
  'Group Project Generator': 'Create a structured group project with roles, timelines, and rubrics.',
  'Research Agent': 'I conduct deep web research with Context.dev and Tavily to build comprehensive reports with citations.',
  'Mind Map Maker': 'Visualize complex topics with auto-generated mind maps.',
  'Spreadsheet Creator': 'Create and populate Google Sheets with data, charts, and visualizations.',
  'Resume Builder': 'Draft and polish professional resumes and cover letters.',
  'Idea Generator': 'Brainstorm ideas for creative writing, art, business, or just fun.',
  'Data Analyst': 'Upload data files. I will analyze trends, visualize patterns, and generate insights.'
}

export default function ToolDetailPanel({ tool }: { tool: Tool }) {
  return (
    <section className="flex w-full max-w-[22rem] flex-col gap-5 rounded-[32px] border border-tera-border bg-gradient-to-b from-[#111111] to-[#050505] p-5 shadow-glow-md md:w-96 md:gap-6 md:p-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Tool insight</p>
        <div className="flex items-center gap-2">
          <span className="text-xl md:text-2xl">{tool.icon}</span>
          <h2 className="text-lg font-semibold text-white md:text-xl">{tool.name}</h2>
        </div>
        <p className="text-sm text-white/60">{tool.description}</p>
      </header>
      <div className="flex flex-col gap-3 rounded-[26px] border border-tera-border bg-tera-panel/80 p-4">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Sample Prompt</p>
        <p className="text-sm text-white/70">{samplePrompts[tool.name]}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tool.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-tera-border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/60">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 rounded-[26px] border border-tera-border bg-tera-panel/90 p-4">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Workflow</p>
        <ol className="flex flex-col gap-2 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-tera-neon" />
            Define the task and constraints →
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-tera-neon" />
            Generate the output with Tera →
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-tera-neon" />
            Review, iterate, and save to workspace
          </li>
        </ol>
      </div>
      <button className="mt-auto rounded-[26px] border border-tera-neon/60 bg-gradient-to-br from-tera-neon/30 to-transparent px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-tera-neon/60">
        Launch tool
      </button>
    </section>
  )
}
