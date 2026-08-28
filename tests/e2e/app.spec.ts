import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('builds and exports a useful map end to end', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('See the soundscape before you play it');
  await page.getByRole('button', { name: 'Explore sample' }).click();
  await expect(page.getByRole('heading', { name: 'Dock machinery' })).toBeVisible();
  await expect(page.locator('#findings-title')).toContainText('finding');

  await page.getByLabel('Max range').fill('18');
  await page.getByLabel('Max range').blur();
  await expect(page.getByLabel('Max range')).toHaveValue('18');

  await page.locator('#export-menu summary').click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /preset JSON/i }).click();
  expect((await download).suggestedFilename()).toBe('harbor-approach.json');
});

test('supports keyboard placement and emitter movement', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start blank' }).click();
  await page.getByRole('button', { name: /Add emitter/ }).click();
  const marker = page.locator('.emitter').first();
  await marker.focus();
  await marker.press('ArrowRight');
  await expect(page.getByLabel('X position')).toHaveValue('51');
});

test('reports invalid imports without replacing the project', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore sample' }).click();
  await page.locator('#file-input').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('label,x,y\nBroken,1,2') });
  await expect(page.getByRole('status')).toContainText('missing the “name” column');
  await expect(page.getByRole('heading', { name: 'Dock machinery' })).toBeVisible();
});

test('restores and verifies a one-time Pro license', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/audio-range-cartographer/verify?license=license_test_123', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/?license=license_test_123');
  await expect(page).not.toHaveURL(/license=/);
  await expect(page.getByRole('button', { name: 'Pro unlocked' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:audio-range-cartographer'))).toBe('license_test_123');
});

test('has no serious accessibility violations with interactive markers and on the legal page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start blank' }).click();
  await page.getByRole('button', { name: /Add emitter/ }).click();
  await expect(page.getByRole('group', { name: /interactive audibility map/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Emitter 1.*maximum range/i })).toBeVisible();
  const editor = await new AxeBuilder({ page }).analyze();
  expect(editor.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.goto('/privacy');
  const privacy = await new AxeBuilder({ page }).analyze();
  expect(privacy.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('precache survives an HTTP-cache eviction before an offline reload', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    await navigator.serviceWorker.ready;
    return Boolean(navigator.serviceWorker.controller);
  });

  const cachedPaths = await page.evaluate(async () => {
    const cacheNames = (await caches.keys()).filter((name) => name.startsWith('arc-'));
    const entries = await Promise.all(cacheNames.map(async (name) => (await caches.open(name)).keys()));
    return entries.flat().map((request) => new URL(request.url).pathname);
  });
  expect(cachedPaths).toContainEqual(expect.stringMatching(/^\/assets\/index-.+\.js$/));
  expect(cachedPaths).toContainEqual(expect.stringMatching(/^\/assets\/index-.+\.css$/));
  // Azure consumes this deployment configuration instead of publishing it.
  expect(cachedPaths).not.toContain('/staticwebapp.config.json');

  // This is the verifier's P1 reproduction: preserve Cache API/SW storage,
  // clear only the ordinary HTTP cache, then reload with the network disabled.
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.clearBrowserCache');
  const retainedPaths = await page.evaluate(async () => {
    const cacheNames = (await caches.keys()).filter((name) => name.startsWith('arc-'));
    return (await Promise.all(cacheNames.map(async (name) => (await caches.open(name)).keys()))).flat().map((request) => new URL(request.url).pathname);
  });
  expect(retainedPaths).toContainEqual(expect.stringMatching(/^\/assets\/index-.+\.js$/));
  expect(retainedPaths).toContainEqual(expect.stringMatching(/^\/assets\/index-.+\.css$/));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Offline · changes stay local')).toBeVisible();
});
