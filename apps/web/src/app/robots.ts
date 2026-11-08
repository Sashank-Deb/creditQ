import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// The app's private screens have nothing to index; the public pages live on the marketing site.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: ['/privacy', '/terms'], disallow: ['/add', '/card', '/settings'] },
    ],
  };
}
