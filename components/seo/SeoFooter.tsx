import Link from 'next/link'

const resourceLinks = [
  { href: '/ai-learning-companion', label: 'AI learning companion' },
  { href: '/ai-study-assistant', label: 'AI study assistant' },
  { href: '/ai-research-assistant', label: 'AI research assistant' },
]

const siteLinks = [
  { href: '/about', label: 'About' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/help', label: 'Help' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
]

export default function SeoFooter() {
  return (
    <footer className="mt-10 border-t border-tera-border/60 pt-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <p className="tera-eyebrow">Resources</p>
          <ul className="mt-4 space-y-2 text-sm text-tera-secondary">
            {resourceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-tera-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="tera-eyebrow">Site</p>
          <ul className="mt-4 space-y-2 text-sm text-tera-secondary">
            {siteLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-tera-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-8 text-xs text-tera-secondary">
        © {new Date().getFullYear()} TeraAI. Learn deeply, research clearly, build from what you study.
      </p>
    </footer>
  )
}