import Link from 'next/link'
import { newsPosts } from '@/lib/news'

export const metadata = {
  title: 'News',
  description: 'What shipped in Tera, with dates from the product history.',
}

export default function NewsPage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-8 md:pt-10">
        <section className="tera-surface px-6 py-10 md:px-10 md:py-14">
          <p className="tera-eyebrow">News</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl">What shipped</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-tera-secondary">
            Product notes for Tera, dated from the repository. Newest first.
          </p>
        </section>
        <div className="mt-6 divide-y divide-tera-border overflow-hidden rounded-2xl border border-tera-border bg-tera-surface">
          {newsPosts.map((post) => (
            <Link key={post.slug} href={`/news/${post.slug}`} className="block px-6 py-5 transition hover:bg-tera-highlight md:px-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-tera-secondary">{post.date}</p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-tera-primary">{post.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-tera-secondary">{post.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
