import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CreditQ',
    short_name: 'CreditQ',
    description: 'Credit card bill reminders. Your data stays on this device.',
    start_url: '/',
    display: 'standalone',
    background_color: '#EEF2EC',
    theme_color: '#1F3A2F',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
