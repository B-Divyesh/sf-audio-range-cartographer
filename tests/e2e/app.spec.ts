import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Download } from '@playwright/test';

async function downloadContent(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  if (!stream) return Buffer.alloc(0);
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

test('builds and exports a useful map end to end @claim:core-workflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Map audible ranges before playtests');
  await page.locator('#try-sample').click();
  await expect(page).toHaveURL(/\?demo=1/);
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

test('supports keyboard placement and emitter movement @claim:keyboard-marker', async ({ page }) => {
  await page.goto('/?demo=1');
  const marker = page.locator('.emitter').first();
  await marker.focus();
  await marker.press('ArrowRight');
  await expect(page.getByLabel('X position')).toHaveValue('29');
});

test('reports invalid imports without replacing the project @claim:invalid-import', async ({ page }) => {
  await page.goto('/');
  await page.locator('#try-sample').click();
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

test('keeps the free workspace usable when the optional license service is unavailable @regression:license-service-unavailable', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/audio-range-cartographer/verify?license=license_unavailable_123', (route) => route.fulfill({ status: 503, body: 'temporarily unavailable' }));
  await page.goto('/?demo=1&license=license_unavailable_123');
  await expect(page.getByRole('status')).toContainText('License verification is temporarily unavailable. Your free workspace remains available.');
  await expect(page.getByRole('heading', { name: 'Dock machinery' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unlock Pro · $12' })).toBeVisible();
});

test('honors the upstream Retry-After value without affecting the free workspace @regression:license-upstream-retry-after', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/audio-range-cartographer/verify?license=license_retry_after_123', (route) => route.fulfill({
    status: 429,
    headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'retry-after', 'retry-after': '7' },
    body: 'too many checks',
  }));
  await page.goto('/?demo=1&license=license_retry_after_123');
  await expect(page.getByRole('status')).toContainText('Wait 7 seconds before checking another license.');
  await expect(page.getByRole('heading', { name: 'Dock machinery' })).toBeVisible();
});

test('has no serious accessibility violations with interactive markers and on the legal page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start blank' }).click();
  await page.getByRole('button', { name: /Add emitter/ }).click();
  await expect(page.getByRole('group', { name: /interactive audibility map/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Emitter 1.*maximum range/i })).toBeVisible();
  const editor = await new AxeBuilder({ page }).analyze();
  expect(editor.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Close emitter inspector' }).click();
  await expect(page.locator('.color-dot circle')).toHaveAttribute('fill', '#65F4D0');
  expect(await page.locator('[style]').count()).toBe(0);
  await page.goto('/privacy');
  const privacy = await new AxeBuilder({ page }).analyze();
  expect(privacy.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.goto('/terms');
  const terms = await new AxeBuilder({ page }).analyze();
  expect(terms.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('includes the product-styled not-found document in the static build @regression:404-document', async ({ page }) => {
  const response = await page.goto('/404.html');
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle('Page not found — Audio Range Cartographer');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Map page not found');
  await expect(page.getByRole('link', { name: 'Open the range planner' })).toHaveAttribute('href', '/');
});

test('keeps demo and footer controls touch-safe and Terms within the 390px viewport @regression:mobile-touch-targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?demo=1');
  const demoTargets = await page.locator('#demo-banner button').evaluateAll((buttons) => buttons.map((button) => {
    const box = button.getBoundingClientRect();
    return { label: button.textContent?.trim(), width: box.width, height: box.height };
  }));
  expect(demoTargets).toEqual(expect.arrayContaining([
    expect.objectContaining({ label: 'Reset demo', width: expect.any(Number), height: expect.any(Number) }),
    expect.objectContaining({ label: 'Start for real', width: expect.any(Number), height: expect.any(Number) }),
  ]));
  for (const target of demoTargets) {
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
  }

  await page.locator('footer').scrollIntoViewIfNeeded();
  const footerTargets = await page.locator('footer a').evaluateAll((links) => links.map((link) => {
    const box = link.getBoundingClientRect();
    return { label: link.textContent?.trim(), width: box.width, height: box.height };
  }));
  expect(footerTargets).toEqual(expect.arrayContaining([
    expect.objectContaining({ label: 'Privacy', width: expect.any(Number), height: expect.any(Number) }),
    expect.objectContaining({ label: 'Terms', width: expect.any(Number), height: expect.any(Number) }),
    expect.objectContaining({ label: 'Param Factory', width: expect.any(Number), height: expect.any(Number) }),
  ]));
  for (const target of footerTargets) {
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
  }

  // The deployed host serves the static legal document at this directory URL.
  await page.goto('/terms/');
  const legalLayout = await page.evaluate(() => {
    const heading = document.querySelector('h1');
    const headingBox = heading?.getBoundingClientRect();
    return {
      viewportWidth: window.visualViewport?.width ?? window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      headingWidth: headingBox?.width ?? 0,
      headingScrollWidth: heading?.scrollWidth ?? 0,
    };
  });
  expect(legalLayout.documentWidth).toBeLessThanOrEqual(legalLayout.viewportWidth);
  expect(legalLayout.headingScrollWidth).toBeLessThanOrEqual(legalLayout.headingWidth);

  const legalTargets = await page.locator('header a, footer a').evaluateAll((links) => links.map((link) => {
    const box = link.getBoundingClientRect();
    return { label: link.textContent?.trim(), width: box.width, height: box.height };
  }));
  for (const target of legalTargets) {
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
  }
});

test('uses a separate, resettable storage namespace for the direct harbor demo @claim:demo-sandbox', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — Audio Range Cartographer');
  await expect(page.locator('#demo-banner')).toContainText('Demo — sample data, nothing is saved to your real project.');
  await expect(page.getByRole('heading', { name: 'Dock machinery' })).toBeVisible();
  await expect(page.locator('#project-title')).toHaveValue('Harbor approach');

  const databaseNames = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databaseNames).toContain('demo:audio-range-cartographer');
  expect(databaseNames).not.toContain('audio-range-cartographer');

  await page.locator('#project-title').fill('Changed demo');
  await page.locator('#project-title').blur();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#project-title')).toHaveValue('Harbor approach');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Map audible ranges before playtests');
  const namesAfterLeavingDemo = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(namesAfterLeavingDemo).toContain('audio-range-cartographer');
  expect(namesAfterLeavingDemo).not.toContain('demo:audio-range-cartographer');
});

test('exports labelled PNG, SVG, JSON, and CSV from the clean demo @claim:map-exports', async ({ page }) => {
  await page.goto('/?demo=1');

  const exportMap = async (name: RegExp) => {
    await page.locator('#export-menu summary').click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name }).click();
    return download;
  };

  const png = await exportMap(/standard-resolution PNG map/i);
  expect((await png).suggestedFilename()).toBe('harbor-approach.png');
  expect((await downloadContent(await png)).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const svg = await exportMap(/editable SVG map/i);
  expect((await svg).suggestedFilename()).toBe('harbor-approach.svg');
  expect((await downloadContent(await svg)).toString()).toContain('<svg');
  const preset = await exportMap(/preset JSON/i);
  expect((await preset).suggestedFilename()).toBe('harbor-approach.json');
  expect(JSON.parse((await downloadContent(await preset)).toString())).toMatchObject({ title: 'Harbor approach', emitters: expect.arrayContaining([expect.objectContaining({ name: 'Dock machinery' })]) });
  const csv = await exportMap(/emitter CSV/i);
  expect((await csv).suggestedFilename()).toBe('harbor-approach.csv');
  const csvText = (await downloadContent(await csv)).toString();
  expect(csvText).toContain('name,x,y,innerRadius,maxDistance,curve,color,notes');
  expect(csvText.trim().split('\n')).toHaveLength(4);
});

test('keeps clean-demo project use local and same-origin only @claim:local-project-data', async ({ page, baseURL }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/?demo=1');
  await page.getByLabel('Max range').fill('18');
  await page.getByLabel('Max range').blur();
  await expect(page.getByLabel('Max range')).toHaveValue('18');
  await page.waitForTimeout(450);

  expect(requests.length).toBeGreaterThan(0);
  for (const request of requests) expect(new URL(request).origin).toBe(new URL(baseURL ?? 'http://127.0.0.1:4173').origin);
  const databaseNames = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databaseNames).toContain('demo:audio-range-cartographer');
  expect(databaseNames).not.toContain('audio-range-cartographer');
});

test('precache survives an HTTP-cache eviction before an offline demo reload @claim:offline-reload', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('/?demo=1');
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
    expect(cachedPaths).not.toContain('/staticwebapp.config.json');

    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.clearBrowserCache');
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dock machinery' })).toBeVisible();
    await expect(page.getByText('Offline · changes stay local')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('shows the published one-time Pro price in the clean demo @claim:pro-price', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Unlock Pro · $12' }).click();
  await expect(page.locator('#pro-dialog .price')).toContainText('$12');
  await expect(page.locator('#pro-dialog .price')).toContainText('once');
});

test('pauses a sixth local license check without fabricating a server response @claim:license-check-pacing', async ({ page }) => {
  let checks = 0;
  await page.route(/https:\/\/api\.sociobot\.in\/api\/v1\/products\/audio-range-cartographer\/verify\?license=/, (route) => {
    checks += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }) });
  });
  for (let index = 1; index <= 5; index += 1) {
    await page.goto(`/?demo=1&license=license_rate_${index}`);
    await expect(page.getByRole('status')).toContainText('License no longer active');
  }
  await page.goto('/?demo=1&license=license_rate_6');
  await expect(page.getByRole('status')).toContainText(/Wait (?:1 minute|[1-9]\d seconds) before checking another license\./);
  expect(checks).toBe(5);
});
