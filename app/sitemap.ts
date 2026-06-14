import type { MetadataRoute } from 'next'
import { PUBLIC_INDEXABLE_PATHS, SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return PUBLIC_INDEXABLE_PATHS.map((path) => ({
    url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.startsWith('/ai-') ? 0.9 : 0.7,
  }))
}