import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://credit-q.vercel.app';

// Private app screens have nothing to index. The marketing site under /site is public.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/add', '/card', '/settings'] }],
    sitemap: `${ORIGIN}/site/sitemap.xml`,
    host: ORIGIN,
  };
}
