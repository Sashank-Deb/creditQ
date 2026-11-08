// One deployment, two apps: the marketing site is served at /, the app at /app.
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
cpSync(site, dist, { recursive: true });
// The app was built with basePath /app, so its files drop in under /app.
cpSync(web, join(dist, 'app'), { recursive: true });
console.log(`Merged site and app into ${dist}`);
