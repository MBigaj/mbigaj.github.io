import { test, expect, type Page } from '@playwright/test';

// The top-level blocks of the main content that drop in on non-home pages
const BLOCKS = 'main.page-anim > :not(astro-island, dialog, style, script, link, template), main.page-anim > astro-island > *';
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
    await page.waitForTimeout(1800);
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
  expect(delays[1]).toBe(120);
  expect(delays[2]).toBe(240);
  expect(Math.max(...delays)).toBeLessThanOrEqual(720);
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
    await page.waitForTimeout(1800);
    for (const s of await state(page, BLOCKS)) expect(s.opacity).toBe('1');
    expect(await page.locator('h1').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  });
});

test('clicking through from Work to Skills lands with the content visible', async ({ page }) => {
  await page.goto('/work/');
  await page.locator('nav').getByRole('link', { name: 'Skills' }).click();
  await expect(page).toHaveURL(/\/skills\/$/);
  await page.waitForTimeout(1800);
  for (const s of await state(page, BLOCKS)) expect(s.opacity).toBe('1');
});

test('the drop-in releases the block once it ends, so nothing stays pinned', async ({ page }) => {
  await page.goto('/work/');
  await page.waitForTimeout(1800);
  expect(await page.locator(BLOCKS).first().evaluate((e) => e.getAnimations().length)).toBe(0);
});

// Samples the top bar every frame for 600 ms from the first frame of each new document
const SAMPLER = `(() => {
  window.__bar = [];
  const t0 = performance.now();
  const tick = () => {
    const bar = document.querySelector('.topbar');
    if (bar) window.__bar.push({ opacity: getComputedStyle(bar).opacity, top: bar.getBoundingClientRect().top, vt: document.documentElement.classList.contains('vt-arrival') });
    if (performance.now() - t0 < 600) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();`;

// Headless Chromium sometimes skips the view transition under load (the new page then simply loads, and the home bar's
// own cold-load drop-in is correct). So try again until a navigation really arrived through a transition.
async function barStaysStill(page: Page, from: string, scrollY: number, click: () => Promise<void>, to: RegExp) {
  await page.addInitScript(SAMPLER);
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.goto(from);
    await page.waitForTimeout(1000);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
    await click();
    await page.waitForURL(to);
    await page.waitForTimeout(800);
    const samples = await page.evaluate(() => (window as any).__bar as { opacity: string; top: number; vt: boolean }[]);
    if (!samples.some((s) => s.vt)) continue;
    expect(samples.length).toBeGreaterThan(5);
    for (const s of samples) {
      expect(s.opacity, `sample ${JSON.stringify(s)}`).toBe('1');
      expect(Math.abs(s.top - samples[samples.length - 1].top)).toBeLessThanOrEqual(1);
    }
    return;
  }
  // Headless Chromium did not run a transition in any attempt: report a skip rather than a vacuous pass.
  // The CSS state that makes the bar settled is asserted separately, without a browser transition.
  test.skip(true, 'no navigation arrived through a view transition');
}

test('the top bar does not blink when moving from Work to the home page', async ({ page }) => {
  await barStaysStill(page, '/work/', 100000, () => page.locator('.brand').click(), /\/$/);
});

test('the top bar does not move when leaving a scrolled project page', async ({ page }) => {
  await barStaysStill(page, '/projects/talis/', 1200, () => page.locator('nav').getByRole('link', { name: 'Skills' }).click(), /\/skills\/$/);
});

test('the stylesheet pins the top bar group and a view-transition arrival settles the home bar', async ({ page }) => {
  await page.goto('/work/');
  const rules = await page.evaluate(() => [...document.styleSheets].flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('\n'));
  expect(rules).toMatch(/::view-transition-group\(topbar\)\s*\{[^}]*\bnone\b/);
  expect(rules).toMatch(/html\.vt-arrival \.topbar\.enter-anim\s*\{[^}]*\bnone\b/);
});

test('a cold load of the home page still drops the top bar in', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('.topbar').evaluate((e) => e.getAnimations().length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.classList.contains('vt-arrival'))).toBe(false);
});

test('the 404 page drops its content in and ends fully visible', async ({ page }) => {
  await page.goto('/no-such-page/');
  expect(Number((await state(page, BLOCKS))[0].opacity)).toBeLessThan(1);
  await page.waitForTimeout(1800);
  for (const s of await state(page, BLOCKS)) expect(s.opacity).toBe('1');
});

test('the Skills island content is staggered after the heading blocks', async ({ page }) => {
  // The island holds one wrapper; it inherits the delay of the island's place among the blocks of <main>
  await page.goto('/skills/');
  const [back, title, map] = (await state(page, BLOCKS)).map((s) => parseFloat(s.delay) * 1000);
  expect(title).toBeGreaterThan(back);
  expect(map).toBeGreaterThan(title);
  // Hidden <style> and <script> siblings must not count: the map is the third visible block
  expect(map).toBe(240);
});

test('the stylesheet hands over from the old page in one calm fade, without brightening', async ({ page }) => {
  await page.goto('/work/');
  const rules = await page.evaluate(() => [...document.styleSheets].flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('\n'));
  const rule = (sel: string) => rules.split('}').find((r) => r.includes(sel + '{') || r.includes(sel + ' {')) ?? '';
  expect(rule('::view-transition-new(root)')).toMatch(/animation(-name)?:\s*(none|auto ease 0s 1 normal none running none)/);
  expect(rule('::view-transition-new(root)')).toMatch(/mix-blend-mode:\s*normal/);
  expect(rule('::view-transition-old(root)')).toMatch(/mix-blend-mode:\s*normal/);
  expect(rule('::view-transition-old(root)')).toMatch(/0\.45s cubic-bezier\(0\.4, 0, 0\.2, 1\)/);
});

test('page jumps scroll smoothly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'smooth');
});

test('clicking Projects on the home page scrolls the projects section to the top', async ({ page }) => {
  await page.goto('/');
  await page.locator('nav').getByRole('link', { name: 'Projects' }).click();
  await page.waitForFunction(() => {
    const w = window as any;
    const y = window.scrollY;
    const settled = w.__lastY === y && y > 0;
    w.__lastY = y;
    return settled;
  }, null, { polling: 150 });
  const top = await page.locator('#projects').evaluate((e) => e.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(-16);
  expect(top).toBeLessThan(200);
  expect(page.url()).toMatch(/#projects$/);
});

test.describe('reduced motion, calm states', () => {
  test.use({ reducedMotion: 'reduce' });
  test('scrolling is instant and links change colour at once', async ({ page }) => {
    await page.goto('/work/');
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
    await expect(page.locator('nav').getByRole('link', { name: 'Skills' })).toHaveCSS('transition-duration', '0s');
  });
});

test('nav links ease their colour over about 200 ms', async ({ page }) => {
  await page.goto('/work/');
  const link = page.locator('nav').getByRole('link', { name: 'Skills' });
  expect(await link.evaluate((e) => getComputedStyle(e).transitionDuration)).toMatch(/^0\.2s(, 0\.2s)*$/);
  expect(await link.evaluate((e) => getComputedStyle(e).transitionProperty)).not.toMatch(/all|width|height|margin|padding/);
});

test('the home dashboard lights up over 900 ms', async ({ page }) => {
  await page.goto('/');
  const found = await page.evaluate(() => [...document.styleSheets].flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('\n'));
  expect(found).toMatch(/#dashboard\.lit \.panel[^{]*\{[^}]*opacity 0\.9s/);
});
