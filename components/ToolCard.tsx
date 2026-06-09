export type TeacherTool = {
  name: string
  description: string
  icon: string
  tags: string[]
}

export type ToolCardProps = {
  tool: TeacherTool
  selected?: boolean
  onSelect?: (tool: TeacherTool) => void
}

export default function ToolCard({ tool, selected, onSelect }: ToolCardProps) {
  return (
    <article
      onClick={() => onSelect?.(tool)}
      className={`group flex cursor-pointer flex-col gap-5 rounded-[24px] border p-5 transition-all duration-200 backdrop-blur-xl sm:p-6 ${selected ? 'border-tera-border bg-tera-elevated/92 shadow-panel' : 'border-tera-border bg-tera-panel/78 shadow-soft-lg hover:-translate-y-0.5 hover:bg-tera-elevated/82'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] border border-tera-border ${selected ? 'bg-tera-highlight text-tera-accent' : 'bg-tera-muted text-tera-primary'}`}>
            <span className="text-xl leading-none">{tool.icon}</span>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">Tool</p>
            <h3 className="mt-2 text-lg font-semibold text-tera-primary">{tool.name}</h3>
          </div>
        </div>
        <span className="tera-badge px-2.5 py-1 text-[0.58rem] tracking-[0.18em]">Ready</span>
      </div>

      <p className="text-sm leading-7 text-tera-secondary">{tool.description}</p>

      <div className="flex flex-wrap gap-2 pt-1">
        {tool.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-tera-border bg-tera-muted px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.2em] text-tera-secondary">
            {tag}
          </span>
        ))}
      </div>
    </article>
  )
}
