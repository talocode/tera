import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNewsPost, newsPosts } from '@/lib/news'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return newsPosts.filter((post) => post.slug !== 'tera-wallet').map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = getNewsPost(slug)
  return {
    title: post?.title ?? 'News',
    description: post?.summary ?? 'Tera news',
  }
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params
  const post = getNewsPost(slug)
  if (!post || post.slug === 'tera-wallet') notFound()

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-8 md:pt-10">
        <article className="tera-surface px-6 py-10 md:px-10 md:py-14">
          <p className="tera-eyebrow">{post.date}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl">{post.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-tera-secondary md:text-lg">{post.summary}</p>
          <div className="mt-8 max-w-3xl space-y-4 text-sm leading-7 text-tera-secondary md:text-base">
            {post.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/news" className="tera-button-secondary">All news</Link>
            <Link href="/wallet" className="tera-button-primary">Open Tera Wallet</Link>
          </div>
        </article>
      </div>
    </div>
  )
}
