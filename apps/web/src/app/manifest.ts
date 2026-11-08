import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CreditQ',
    short_name: 'CreditQ',
    description: 'Credit card bill reminders. Your data stays on this device.',
    start_url: '/app',
    scope: '/app',
    display: 'standalone',
    background_color: '#EEF2EC',
    theme_color: '#1F3A2F',
    icons: [
      { src: '/app/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/app/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/app/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/app/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
