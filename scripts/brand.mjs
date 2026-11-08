// Generates the CreditQ logo, icons and social images. Run: node scripts/brand.mjs
// The logo is the card: terracotta body, sand chip, cream stripe.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(root, 'apps/web/public');
const SITE = join(root, 'apps/site/public');
[WEB, SITE].forEach((d) => mkdirSync(d, { recursive: true }));

const INK = '#1B3A30';
const src = readFileSync(join(root, 'brand/creditq-logo.svg'), 'utf8');
// The supplied logo: green tile, terracotta card, check badge. Keep the artwork, re-frame it.
const art = src.slice(src.indexOf('<defs>'), src.indexOf('</svg>'));
const frame = (viewBox, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${art}${extra}</svg>\n`;

/** Full logo with its margin, as supplied. */
const logo = src;
/** Tile only, edge to edge: favicon and app icon. */
const icon = frame('90 90 844 844');
/** Full-bleed square for maskable and iOS icons: the tile colour fills, artwork sits in the safe zone. */
const defs = art.slice(art.indexOf('<defs>'), art.indexOf('</defs>') + 7);
const foreground = art.slice(art.indexOf('<!-- Credit card -->'));
const bleed = (scale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${defs}<rect width="1024" height="1024" fill="url(#bg)"/><g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${foreground}</g></svg>\n`;
const maskable = bleed(0.95);
const appleTouch = bleed(1.1);
const favicon = icon;

const out = (dir, name, data) => writeFileSync(join(dir, name), data);
const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toBuffer();

// Single-image ICO that embeds a PNG.
const ico = (pngBuf, size) => {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(pngBuf.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, pngBuf]);
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const og = ({ kicker, lines, sub, host }) => {
  const title = lines
    .map(
      (l, i) =>
        `<text x="80" y="${300 + i * 78}" font-family="Georgia, serif" font-weight="700" font-size="66" fill="#F4F7F1">${esc(l)}</text>`,
    )
    .join('');
  const subY = 300 + lines.length * 78 + 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H48" stroke="#ffffff" stroke-opacity="0.05"/></pattern></defs>
<rect width="1200" height="630" fill="${INK}"/><rect width="1200" height="630" fill="url(#p)"/>
<image x="80" y="56" width="132" height="132" href="data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}"/>
<text x="236" y="136" font-family="Georgia, serif" font-weight="700" font-size="40" fill="#F4F7F1">CreditQ</text>
<text x="80" y="236" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="22" letter-spacing="4" fill="#E58F68">${esc(kicker.toUpperCase())}</text>
${title}
<text x="80" y="${subY}" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#C9D6CD">${esc(sub)}</text>
<rect x="80" y="560" width="64" height="6" rx="3" fill="#E58F68"/>
<text x="164" y="568" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#C9D6CD">${esc(host)}</text>
</svg>`;
};

const ogPng = (spec) =>
  sharp(Buffer.from(og(spec)))
    .png({ compressionLevel: 9 })
    .toBuffer();

// ---- logo and icons (both apps) ----
for (const dir of [WEB, SITE]) {
  out(dir, 'logo.svg', logo);
  out(dir, 'icon.svg', favicon);
  out(dir, 'icon-192.png', await png(icon, 192));
  out(dir, 'icon-512.png', await png(icon, 512));
  out(dir, 'icon-maskable-512.png', await png(maskable, 512));
  out(dir, 'apple-touch-icon.png', await png(appleTouch, 180));
  out(dir, 'favicon.ico', ico(await png(favicon, 48), 48));
}

// ---- social images ----
out(
  WEB,
  'og.png',
  await ogPng({
    kicker: 'Credit card bill reminders',
    lines: ['Your cards, your phone,', 'nobody else.'],
    sub: 'Offline, encrypted, no account.',
    host: 'cards.creditq.vercel.app',
  }),
);

const SITE_HOST = 'creditq.vercel.app';
out(
  SITE,
  'og.png',
  await ogPng({
    kicker: 'Credit card bill reminders',
    lines: ['Never miss a credit card', 'bill. Pay on one day.'],
    sub: 'Works offline. Your data stays on your phone.',
    host: SITE_HOST,
  }),
);
out(
  SITE,
  'og-blog-never-miss-credit-card-due-date.png',
  await ogPng({
    kicker: 'Guide',
    lines: ['How to never miss a', 'credit card due date'],
    sub: 'A practical system for India',
    host: `${SITE_HOST}/blog`,
  }),
);
out(
  SITE,
  'og-blog-statement-date-vs-due-date.png',
  await ogPng({
    kicker: 'Guide',
    lines: ['Statement date vs due date:', 'when to pay your card'],
    sub: 'How the billing cycle works',
    host: `${SITE_HOST}/blog`,
  }),
);
console.log('brand assets written');
