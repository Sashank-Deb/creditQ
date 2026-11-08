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

export const metadata: Metadata = {
  title: 'CreditQ',
  description: 'Credit card bill reminders. Your data stays on this device.',
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
