import { test, expect, type Page } from '@playwright/test';

// The top-level blocks of the main content that drop in on non-home pages
const BLOCKS = 'main.page-anim > :not(astro-island, dialog), main.page-anim > astro-island > *';
const PAGES = ['/work/', '/skills/', '/projects/talis/'];

const state = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) =>
    els.map((e) => {
      const c = getComputedStyle(e);
      return { opacity: c.opacity, transform: c.transform, delay: c.animationDelay };
    }));
const identity = (t: string) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';

test('the stylesheet opts into cross-document view transitions and pins the top bar', async ({ page }) => {
  await page.goto('/work/');
  const found = await page.evaluate(() =>
    [...document.styleSheets].some((s) => [...s.cssRules].some((r) => /@view-transition/.test(r.cssText) && /navigation:\s*auto/.test(r.cssText))));
  expect(found).toBe(true);
  await expect(page.locator('.topbar')).toHaveCSS('view-transition-name', 'topbar');
});

for (const path of PAGES) {
  test(`${path} drops its content in, never leaves it hidden, and never animates the top bar`, async ({ page }) => {
    await page.goto(path);
    expect(await page.locator('.topbar').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    const first = (await state(page, BLOCKS))[0];
    expect(Number(first.opacity)).toBeLessThan(1);
    await page.waitForTimeout(1200);
    const all = await state(page, BLOCKS);
    expect(all.length).toBeGreaterThan(1);
    for (const s of all) {
      expect(s.opacity).toBe('1');
      expect(identity(s.transform)).toBe(true);
    }
  });
}

test('later blocks start later, and the delay is capped', async ({ page }) => {
  await page.goto('/work/');
  const delays = (await state(page, BLOCKS)).map((s) => parseFloat(s.delay) * 1000);
  expect(delays[0]).toBe(0);
  expect(delays[1]).toBeGreaterThan(delays[0]);
  expect(Math.max(...delays)).toBeLessThanOrEqual(480);
});

test('landing on a hash skips the drop-in', async ({ page }) => {
  await page.goto('/work/#ai-chat-api-layer');
  expect(await page.locator('#ai-chat-api-layer').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('content is visible at once and nothing is animating', async ({ page }) => {
    await page.goto('/work/');
    for (const s of await state(page, BLOCKS)) expect(s.opacity).toBe('1');
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

test.describe('no JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('skills content is visible after the drop-in', async ({ page }) => {
    await page.goto('/skills/');
    await page.waitForTimeout(1200);
    for (const s of await state(page, BLOCKS)) expect(s.opacity).toBe('1');
    expect(await page.locator('h1').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  });
});

test('clicking through from Work to Skills lands with the content visible', async ({ page }) => {
  await page.goto('/work/');
  await page.locator('nav').getByRole('link', { name: 'Skills' }).click();
  await expect(page).toHaveURL(/\/skills\/$/);
  await page.waitForTimeout(1200);
  for (const s of await state(page, BLOCKS)) expect(s.opacity).toBe('1');
});

test('the drop-in releases the block once it ends, so nothing stays pinned', async ({ page }) => {
  await page.goto('/work/');
  await page.waitForTimeout(1200);
  expect(await page.locator(BLOCKS).first().evaluate((e) => e.getAnimations().length)).toBe(0);
});
