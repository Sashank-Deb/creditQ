import type { Metadata, Viewport } from 'next';
import { Fraunces, JetBrains_Mono as JetBrainsMono } from 'next/font/google';
import ReminderRuntime from '@/features/reminders/ReminderRuntime';
import { themeBootScript } from '@/lib/theme';
import './globals.css';

// next/font self-hosts these at build time: no request to Google from the user's device.
const display = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700'],
});
const mono = JetBrainsMono({ variable: '--font-mono', subsets: ['latin'], weight: ['500'] });

// Origin only; files live under /app.
const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://credit-q.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  title: { default: 'CreditQ', template: '%s' },
  description: 'Credit card bill reminders. Your data stays on this device.',
  applicationName: 'CreditQ',
  icons: {
    icon: [
      { url: '/app/icon.svg', type: 'image/svg+xml' },
      { url: '/app/favicon.ico', sizes: '48x48' },
    ],
    apple: '/app/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'CreditQ',
    title: 'CreditQ: credit card bill reminders',
    description:
      'Pay day reminders for your credit cards. Works offline. Your data stays on your device.',
    images: [{ url: '/app/og.png', width: 1200, height: 630, alt: 'CreditQ' }],
  },
  twitter: { card: 'summary_large_image', images: ['/app/og.png'] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EEF2EC' },
    { media: '(prefers-color-scheme: dark)', color: '#131A16' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-IN" className={`${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger -- constant script, applies the saved theme before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        {children}
        <ReminderRuntime />
      </body>
    </html>
  );
}
