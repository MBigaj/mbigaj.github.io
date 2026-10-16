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
