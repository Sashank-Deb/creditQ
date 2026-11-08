import type { MetadataRoute } from 'next';
import { POSTS } from '../blog/posts';
import { SITE_URL } from '../site-config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: '2026-11-08', changeFrequency: 'monthly', priority: 1 },
    {
      url: `${SITE_URL}/blog`,
      lastModified: '2026-11-08',
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...POSTS.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updated,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
