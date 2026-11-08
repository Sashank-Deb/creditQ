// One deployment, two apps: the app is served at /, the marketing site under /site.
// Builds each Next static export, then merges them into apps/web/dist.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'apps/site/out');
const web = join(root, 'apps/web/out');
const dist = join(root, 'apps/web/dist');

for (const dir of [site, web]) {
  if (!existsSync(dir)) throw new Error(`Missing build output: ${dir}. Run the builds first.`);
}
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(web, dist, { recursive: true });
// The site was built with basePath /site, so its files drop in under /site.
cpSync(site, join(dist, 'site'), { recursive: true });
console.log(`Merged site and app into ${dist}`);
