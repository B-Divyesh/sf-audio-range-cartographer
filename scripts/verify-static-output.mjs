import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve('dist');
const required = ['404.html', 'sitemap.xml', 'staticwebapp.config.json'];

for (const file of required) {
  const path = resolve(output, file);
  if (!existsSync(path)) throw new Error(`Missing distribution asset: ${file}`);
}

const config = JSON.parse(readFileSync(resolve(output, 'staticwebapp.config.json'), 'utf8'));
if (config.navigationFallback) throw new Error('Distribution must not turn unknown URLs into an index.html 200 response.');
if (config.responseOverrides?.['404']?.rewrite !== '/404.html') throw new Error('Distribution 404 override must rewrite to /404.html.');

const notFound = readFileSync(resolve(output, '404.html'), 'utf8');
if (!notFound.includes('<h1>Map page not found</h1>')) throw new Error('Distribution 404 document is missing its product-styled heading.');

const sitemap = readFileSync(resolve(output, 'sitemap.xml'), 'utf8');
for (const route of ['https://audio-range-cartographer.sociobot.in/', 'https://audio-range-cartographer.sociobot.in/privacy/', 'https://audio-range-cartographer.sociobot.in/terms/']) {
  if (!sitemap.includes(route)) throw new Error(`Sitemap is missing ${route}`);
}
