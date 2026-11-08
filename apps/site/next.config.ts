import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  // One Vercel project: the app is served at /, this marketing site under /site.
  basePath: '/site',
  // @creditq/core ships TypeScript source.
  transpilePackages: ['@creditq/core'],
};

export default nextConfig;
