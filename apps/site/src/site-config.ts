/**
 * One Vercel project serves everything: the marketing site at / and the app at /app.
 * Override the origin with NEXT_PUBLIC_SITE_URL if the project gets a custom domain.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://credit-q.vercel.app';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? `${SITE_URL}/app`;
export const REPO_URL = 'https://github.com/Sashank-Deb/creditQ';
export const SITE_NAME = 'CreditQ';
