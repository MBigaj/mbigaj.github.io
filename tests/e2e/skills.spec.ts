import { test, expect } from '@playwright/test';

test('picking a skill shows only its evidence', async ({ page }) => {
  await page.goto('/skills/');
  await expect(page.locator('.skill-evidence:visible')).toHaveCount(24);
  await page.locator('.chip', { hasText: 'Kubernetes' }).click();
  await expect(page.locator('.skill-evidence:visible')).toHaveCount(1);
  await expect(page.locator('#skill-kubernetes')).toContainText('Associate Backend Engineer, YouGov');
  await expect(page.locator('.chip', { hasText: 'Kubernetes' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Show all skills' }).click();
  await expect(page.locator('.skill-evidence:visible')).toHaveCount(24);
});

test('a chip can be operated with the keyboard and toggled off', async ({ page }) => {
  await page.goto('/skills/');
  const chip = page.locator('.chip', { hasText: 'Kubernetes' });
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await chip.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.skill-evidence:visible')).toHaveCount(1);
  await page.keyboard.press('Space');
  await expect(page.locator('.skill-evidence:visible')).toHaveCount(24);
  const box = await chip.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test('a chip on the home page opens that skill preselected', async ({ page }) => {
  await page.goto('/');
  await page.locator('#skills a.chip', { hasText: 'Django' }).click();
  await expect(page).toHaveURL(/\/skills\/#skill-django$/);
  await expect(page.locator('.skill-evidence:visible')).toHaveCount(1);
  await expect(page.locator('#skill-django')).toContainText('Talis');
});

test('evidence links point at the right pages', async ({ page }) => {
  await page.goto('/skills/');
  await expect(
    page.locator('#skill-kubernetes').getByRole('link', { name: 'Associate Backend Engineer, YouGov' }),
  ).toHaveAttribute('href', '/work/#yougov-associate');
  await expect(page.locator('#skill-django').getByRole('link', { name: 'Talis' })).toHaveAttribute(
    'href',
    '/projects/talis/',
  );
});

test('a skill with no evidence says so', async ({ page }) => {
  await page.goto('/skills/#skill-redis');
  await expect(page.locator('#skill-redis')).toContainText('No linked work yet.');
});

test('skills page has its title and a back link', async ({ page }) => {
  await page.goto('/skills/');
  await expect(page).toHaveTitle('Skills · Mikołaj Bigaj');
  await expect(page.getByRole('link', { name: '← control room' })).toHaveAttribute('href', '/');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('every skill and its evidence is still listed', async ({ page }) => {
    await page.goto('/skills/');
    await expect(page.locator('.skill-evidence')).toHaveCount(24);
    await expect(page.locator('#skill-python')).toContainText('Digit recognition');
  });
});
