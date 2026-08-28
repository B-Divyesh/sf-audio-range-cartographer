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

test('has no serious accessibility violations on editor and legal page', async ({ page }, testInfo) => {
  await page.goto('/');
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Start blank' }).click();
  const editor = await new AxeBuilder({ page }).analyze();
  expect(editor.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.goto('/privacy');
  const privacy = await new AxeBuilder({ page }).analyze();
  expect(privacy.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('reloads the cached workspace while offline', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => 'serviceWorker' in navigator);
  await page.waitForTimeout(800);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Offline · changes stay local')).toBeAttached();
});
