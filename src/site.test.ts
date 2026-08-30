import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type StaticWebAppConfig = {
  navigationFallback?: unknown;
  responseOverrides?: Record<string, { rewrite?: string }>;
};

const text = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('static deployment fallbacks', () => {
  it('configures a real product-styled 404 instead of an SPA 200 fallback', () => {
    const config = JSON.parse(text('../public/staticwebapp.config.json')) as StaticWebAppConfig;
    expect(config.navigationFallback).toBeUndefined();
    expect(config.responseOverrides?.['404']?.rewrite).toBe('/404.html');

    const notFound = text('../public/404.html');
    expect(notFound).toContain('<h1>Map page not found</h1>');
    expect(notFound).toContain('href="/"');
    expect(notFound).toContain('<title>Page not found — Audio Range Cartographer</title>');
  });

  it('publishes a sitemap for every static product route', () => {
    const sitemap = text('../public/sitemap.xml');
    expect(sitemap).toContain('https://audio-range-cartographer.sociobot.in/</loc>');
    expect(sitemap).toContain('https://audio-range-cartographer.sociobot.in/privacy/</loc>');
    expect(sitemap).toContain('https://audio-range-cartographer.sociobot.in/terms/</loc>');
  });

  it('derives the service-worker cache identifier from stable precache content', () => {
    const config = text('../vite.config.ts');
    expect(config).toContain('function cacheVersion');
    expect(config).toContain("digest.update(url).update('\\0').update(readFileSync(resolve(output, file)))");
    expect(config).not.toContain('Date.now()');
  });
});
