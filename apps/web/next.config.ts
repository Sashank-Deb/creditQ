import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Fully static PWA: no server runtime, so no user data can ever reach a server of ours.
  output: 'export',
  reactCompiler: true,
  // @creditq/core ships TypeScript source.
  transpilePackages: ['@creditq/core'],
  turbopack: {
    rules: {
      // Only the global stylesheet runs through Tailwind; a `*.css` glob would also catch
      // compiled `.module.scss` output and strip the CSS-module class mapping.
      'globals.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
