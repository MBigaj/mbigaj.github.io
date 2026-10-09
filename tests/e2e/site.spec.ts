import { test, expect } from '@playwright/test';

test('unknown addresses get the 404 page with a way home', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Signal lost');
  await expect(page.getByRole('link', { name: 'Back to the control room' })).toHaveAttribute('href', '/');
});

test('every internal link on the home page resolves', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')!.split('#')[0]))]);
  for (const h of hrefs) expect((await request.get(h)).status(), h).toBe(200);
});

test('the first Tab stop is a skip link to the main content', async ({ page }) => {
  await page.goto('/');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).not.toBeInViewport();
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport({ ratio: 1 });
  expect((await skip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator('main#main')).toHaveCount(1);
});

test('the nav marks the current page', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await page.goto('/work/');
  await expect(nav.getByRole('link', { name: 'Work' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.locator('[aria-current]')).toHaveCount(1);
  await page.goto('/skills/');
  await expect(nav.getByRole('link', { name: 'Skills' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.locator('[aria-current]')).toHaveCount(1);
  await page.goto('/');
  await expect(nav.locator('[aria-current]')).toHaveCount(0);
});

for (const path of ['/', '/work/', '/skills/', '/projects/talis/', '/projects/dark-souls-app/', '/404.html']) {
  test(`headings on ${path} have one h1 and never skip a level`, async ({ page }) => {
    await page.goto(path);
    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    levels.forEach((level, i) => expect(level, `heading ${i + 1}`).toBeLessThanOrEqual((levels[i - 1] ?? 1) + 1));
  });
}
