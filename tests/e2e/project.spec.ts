import { test, expect } from '@playwright/test';

test('Talis shows its team section and no roadmap', async ({ page }) => {
  await page.goto('/projects/talis/');
  await expect(page.getByRole('heading', { level: 1, name: 'Talis' })).toBeVisible();
  await expect(page.locator('main')).toContainText('TEAM AND DELIVERY');
  await expect(page.locator('main')).toContainText('Team of 4');
  await expect(page.locator('main')).not.toContainText('ROADMAP');
  await expect(page.getByRole('link', { name: /View the repo/ })).toHaveAttribute('href', 'https://github.com/PKrystian/Talis');
});

test('the Dark Souls page draws its architecture figure', async ({ page }) => {
  await page.goto('/projects/dark-souls-app/');
  const fig = page.locator('figure svg[role="img"]');
  await expect(fig).toHaveCount(1);
  await expect(fig).toContainText('FastAPI service');
  await expect(page.locator('figcaption')).toHaveText('Fig. 01 · Request path and telemetry');
});

test('sections without content are absent from the built site', async ({ page }) => {
  await page.goto('/projects/digit-recognition/');
  const main = page.locator('main');
  for (const h of ['ARCHITECTURE', 'SCALING', 'TEAM AND DELIVERY', 'SCREENS', 'ROADMAP', 'Content pending'])
    await expect(main).not.toContainText(h);
  await expect(main).toContainText('PROBLEM');
});

test('a wide figure scrolls inside its panel, not the page', async ({ page }, testInfo) => {
  await page.goto('/projects/dark-souls-app/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (testInfo.project.name === 'phone') {
    const sheet = page.locator('figure .bp-sheet');
    expect(await sheet.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  }
});

test('the page has a title, a back link and a stack line', async ({ page }) => {
  await page.goto('/projects/talis/');
  await expect(page).toHaveTitle('Talis · Mikołaj Bigaj');
  await expect(page.locator('main a').first()).toHaveText('← control room');
  await expect(page.locator('main a').first()).toHaveAttribute('href', '/');
  await expect(page.locator('main')).toContainText('Started April 2024');
  await expect(page.locator('main')).toContainText('Finished February 2025');
});
