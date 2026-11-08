import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  // @creditq/core ships TypeScript source.
  transpilePackages: ['@creditq/core'],
};

export default nextConfig;
