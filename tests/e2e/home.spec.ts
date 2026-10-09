import { test, expect } from '@playwright/test';

test('home shows the name and site chrome', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Mikołaj Bigaj' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Skills' }).first()).toHaveAttribute('href', '/skills/');
  await expect(page.getByRole('link', { name: 'CV' }).first()).toHaveAttribute('href', '/Mikolaj_Bigaj_CV.pdf');
  await expect(page).toHaveTitle('Mikołaj Bigaj · Backend engineer');
});

test('page background is the ground colour', async ({ page }) => {
  await page.goto('/');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(11, 16, 22)');
});
