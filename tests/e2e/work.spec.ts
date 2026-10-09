import { test, expect } from '@playwright/test';

test('work page lists the three YouGov pieces and the earlier roles', async ({ page }) => {
  await page.goto('/work/');
  await expect(page).toHaveTitle('Work · Mikołaj Bigaj');
  await expect(page.getByRole('link', { name: '← control room' })).toHaveAttribute('href', '/');
  for (const id of ['ai-chat-api-layer', 'rpc-to-api-migration', 'lambda-to-ecs-migration', 'mh-junior', 'withsecure', 'blulog'])
    await expect(page.locator(`article#${id}`)).toBeVisible();
  await expect(page.locator('#lambda-to-ecs-migration')).toContainText('Amazon ECS');
  await expect(page.locator('main')).not.toContainText(/php|yii/i);
});

test('the roles list is headed "Roles", since it starts with the current job', async ({ page }) => {
  await page.goto('/work/');
  await expect(page.getByRole('heading', { level: 2, name: 'Roles', exact: true })).toBeVisible();
  await expect(page.locator('main')).not.toContainText('Earlier roles');
  await expect(page.locator('article[data-role]').first()).toHaveAttribute('id', 'yougov-associate');
});

test('earlier roles are newest first and link their skills', async ({ page }) => {
  await page.goto('/work/');
  const ids = await page.locator('article[data-role]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids.indexOf('mh-junior')).toBeLessThan(ids.indexOf('withsecure'));
  expect(ids.indexOf('withsecure')).toBeLessThan(ids.indexOf('blulog'));
  const chip = page.locator('#mh-junior a.chip').first();
  await expect(chip).toHaveAttribute('href', /^\/skills\/#skill-/);
});
