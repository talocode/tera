import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const processedContent = content
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')

  return (
    <div className="tera-prose prose-headings:tracking-[-0.02em] prose-strong:text-tera-primary prose-p:text-tera-primary prose-li:text-tera-primary prose-code:text-tera-neon prose-a:text-tera-neon">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-4 leading-7 text-tera-primary/95 last:mb-0">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-tera-neon underline decoration-tera-neon/30 underline-offset-4 transition hover:text-tera-primary"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="mb-4 space-y-2 pl-5 marker:text-tera-secondary">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 space-y-2 pl-5 marker:text-tera-secondary">{children}</ol>,
          li: ({ children }) => <li className="leading-7 text-tera-primary/95">{children}</li>,
          h1: ({ children }) => <h1 className="mb-4 mt-7 text-2xl font-semibold text-tera-primary">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-semibold text-tera-primary">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-semibold text-tera-primary">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-2 mt-4 text-base font-semibold text-tera-primary">{children}</h4>,
          table: ({ children }) => (
            <div className="my-6 w-full overflow-x-auto rounded-[20px] border border-tera-border bg-tera-surface-muted">
              <table className="w-full text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-tera-border bg-white/[0.04] text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-tera-border/70">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-white/[0.03]">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-3 font-medium">{children}</th>,
          td: ({ children }) => <td className="px-4 py-3 align-top text-tera-primary/95">{children}</td>,
          hr: () => <hr className="my-6 border-tera-border opacity-70" />,
          blockquote: ({ children }) => (
            <blockquote className="my-5 rounded-r-[18px] border-l-2 border-tera-neon bg-tera-highlight px-4 py-3 italic text-tera-secondary">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => (
            <pre className="my-5 w-full overflow-x-auto rounded-[20px] border border-tera-border bg-[#08101a] p-4 text-sm text-tera-primary">
              {children}
            </pre>
          ),
          code({ inline, className, children, ...props }: any) {
            if (inline) {
              return (
                <code className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-sm text-tera-neon" {...props}>
                  {children}
                </code>
              )
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
