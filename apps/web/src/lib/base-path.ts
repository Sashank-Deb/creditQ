/**
 * The app is served under /app (the marketing site owns /). Next adds this to <Link> and
 * router calls by itself; use `withBase` for plain strings such as icon URLs and reloads.
 */
export const BASE_PATH = '/app';
export const withBase = (path: string): string => `${BASE_PATH}${path}`;
