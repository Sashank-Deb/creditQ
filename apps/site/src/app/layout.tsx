import type { Metadata, Viewport } from 'next';
import { Fraunces } from 'next/font/google';
import { ORIGIN, SITE_NAME, SITE_PATH } from '../site-config';
import './globals.css';

const display = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700'],
});

const DESCRIPTION =
  'CreditQ reminds you when to pay your credit card bills, groups them into one pay day, works offline, and keeps your data on your device. No account, no server copy.';

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  title: {
    default: 'CreditQ: credit card bill reminders that stay on your phone',
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'credit card bill reminder',
    'credit card due date reminder',
    'credit card payment tracker India',
    'pay multiple credit card bills',
    'offline credit card reminder app',
  ],
  alternates: { canonical: SITE_PATH },
  icons: {
    icon: [
      { url: `${SITE_PATH}/icon.svg`, type: 'image/svg+xml' },
      { url: `${SITE_PATH}/favicon.ico`, sizes: '48x48' },
    ],
    apple: `${SITE_PATH}/apple-touch-icon.png`,
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
    url: SITE_PATH,
    title: 'CreditQ: never miss a credit card bill',
    description: DESCRIPTION,
    images: [
      {
        url: `${SITE_PATH}/og.png`,
        width: 1200,
        height: 630,
        alt: 'CreditQ credit card bill reminders',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreditQ: never miss a credit card bill',
    description: DESCRIPTION,
    images: [`${SITE_PATH}/og.png`],
  },
  robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large' } },
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
