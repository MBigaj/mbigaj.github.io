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

test('home has the five panels in order', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section .panel-label')).toHaveText(
    ['01 / IDENTITY', '02 / TIMELINE', '03 / PROJECTS', '04 / PRODUCTION WORK', '05 / SKILL MAP']);
});
test('projects list three rows with statuses and case-study links', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('#projects a.project-row');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Dark Souls: The Board Game app');
  await expect(rows.nth(0)).toContainText('in progress');
  await expect(rows.nth(1)).toHaveAttribute('href', '/projects/talis/');
  await expect(rows.nth(1)).toContainText('shipped');
});
test('project rows print the display stack, not every skill', async ({ page }) => {
  await page.goto('/');
  const talis = page.locator('#projects a.project-row').nth(1);
  await expect(talis.locator('.stack')).toHaveText('Django · React · PostgreSQL · clustering model');
  await expect(talis).not.toContainText('Sprint planning');
  await expect(page.locator('#projects a.project-row .stack').first()).toHaveText('FastAPI · React · MongoDB · New Relic');
});
test('skill map shows 24 chips linking to their evidence', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#skills a.chip')).toHaveCount(24);
  await expect(page.locator('#skills a.chip', { hasText: 'Kubernetes' })).toHaveAttribute('href', '/skills/#skill-kubernetes');
});
test('timeline shows every employer and the degree note', async ({ page }) => {
  await page.goto('/');
  for (const name of ['YouGov', 'MH', 'WithSecure', 'Blulog', 'Collegium Da Vinci'])
    await expect(page.locator('#timeline')).toContainText(name);
  await expect(page.locator('#timeline')).toContainText('full-time on the engineering degree');
});
test('the page never scrolls sideways', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('links and chips are at least 44px tall', async ({ page }) => {
  await page.goto('/');
  for (const el of await page.locator('nav a, a.chip, .identity-links a, a.project-row, a[href="/work/"]').all())
    expect((await el.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test('timeline merges same-employer roles and ends with a dashed education bar', async ({ page }) => {
  await page.goto('/');
  const heads = page.locator('#timeline [data-row] .row-head > span:first-child');
  await expect(heads).toHaveText([
    'YouGov · Graduate, then Associate Backend Engineer',
    'MH · Big Data Intern, then Junior Backend Developer',
    'WithSecure · Data Scientist Intern',
    'Blulog · Full-stack Developer',
    'Collegium Da Vinci · BTech Computer Science',
  ]);
  const last = page.locator('#timeline [data-row]').last();
  await expect(last).toContainText('Collegium Da Vinci');
  expect(await last.locator('.bar').evaluate((e) => getComputedStyle(e).borderTopStyle)).toBe('dashed');
});
test('identity facts and links', async ({ page }) => {
  await page.goto('/');
  const id = page.locator('#identity');
  await expect(id.locator('.facts')).toContainText('Associate Backend Engineer, YouGov');
  await expect(id.locator('.facts')).toContainText('2022');
  await expect(id.locator('.facts')).toContainText('BTech Computer Science, 2025');
  const links = id.locator('.identity-links a');
  await expect(links).toHaveText(['GitHub', 'LinkedIn', 'Email', 'Download CV']);
  expect(await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))).toEqual([
    'https://github.com/MBigaj',
    'https://www.linkedin.com/in/mikolajbigaj/',
    'mailto:mikolaj.bigaj.00@gmail.com',
    '/Mikolaj_Bigaj_CV.pdf',
  ]);
});
test('status markers: circle for in progress, square for shipped', async ({ page }) => {
  await page.goto('/');
  const radius = (row: number) =>
    page.locator('#projects a.project-row').nth(row).locator('.marker').evaluate((e) => getComputedStyle(e).borderTopLeftRadius);
  expect(await radius(0)).toBe('50%');
  expect(await radius(1)).toBe('0px');
  await expect(page.locator('#projects a.project-row').nth(2)).toContainText('shipped');
});
