import type { Metadata, Viewport } from 'next';
import { Fraunces } from 'next/font/google';
import './globals.css';

const display = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'CreditQ: credit card bill reminders that stay on your phone',
  description:
    'CreditQ reminds you when to pay your credit card bills, groups them into one pay day, works offline, and keeps your data on your device. No account, no server copy.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EEF2EC' },
    { media: '(prefers-color-scheme: dark)', color: '#131A16' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-IN" className={display.variable}>
      <body>{children}</body>
    </html>
  );
}
