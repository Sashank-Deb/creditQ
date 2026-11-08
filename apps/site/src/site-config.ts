/**
 * One Vercel project serves everything: the app at the root and this marketing site under /site.
 * Next adds the /site prefix to <Link> and router calls. Plain strings (metadata URLs, CSS url(),
 * JSON-LD) must include SITE_PATH themselves.
 */
export const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://credit-q.vercel.app';
export const SITE_PATH = '/site';
/** Absolute address of the marketing site. */
export const SITE_URL = `${ORIGIN}${SITE_PATH}`;
/** Absolute address of the app. */
export const APP_URL = ORIGIN;
export const REPO_URL = 'https://github.com/Sashank-Deb/creditQ';
export const SITE_NAME = 'CreditQ';
