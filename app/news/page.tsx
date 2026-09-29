import Link from 'next/link'

export const metadata = {
  title: 'News',
  description: 'News and launch notes from Tera.',
}

const posts = [
  {
    href: '/news/tera-wallet',
    date: '29 September 2026',
    title: 'Tera Wallet is live',
    summary: 'A self-custodial Solana wallet for SOL, SPL tokens, and official $TCODE. The recovery phrase stays in your browser.',
  },
]

export default function NewsPage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-8 md:pt-10">
        <section className="tera-surface px-6 py-10 md:px-10 md:py-14">
          <p className="tera-eyebrow">News</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl">What shipped</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-tera-secondary">
            Product notes for Tera. The wallet launch is the first entry.
          </p>
        </section>
        <div className="mt-8 space-y-4">
          {posts.map((post) => (
            <Link key={post.href} href={post.href} className="tera-card block">
              <p className="text-xs uppercase tracking-[0.14em] text-tera-secondary">{post.date}</p>
              <h2 className="mt-2 text-2xl font-semibold text-tera-primary">{post.title}</h2>
              <p className="mt-3 text-sm leading-7 text-tera-secondary">{post.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
