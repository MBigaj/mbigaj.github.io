import { test, expect, type Page } from '@playwright/test';

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
    ['01 / STATUS', '02 / TIMELINE', '03 / PROJECTS', '04 / PRODUCTION WORK', '05 / SKILL MAP']);
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
test('panel labels are level-2 headings that name their sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    ['01 / STATUS', '02 / TIMELINE', '03 / PROJECTS', '04 / PRODUCTION WORK', '05 / SKILL MAP']);
  await expect(page.getByRole('region', { name: '03 / PROJECTS' })).toHaveAttribute('id', 'projects');
  await expect(page.locator('#skills').getByRole('heading', { level: 3 })).toHaveText([
    'Languages and frameworks',
    'Data and messaging',
    'Infrastructure and delivery',
    'Observability and testing',
    'Delivery and leadership',
  ]);
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
  for (const el of await page.locator('nav a, a.chip, .identity-links a, .intro-links a, .enter, a.project-row, a[href="/work/"]').all())
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
test('identity panel is a status panel with facts, Email and Download CV', async ({ page }) => {
  await page.goto('/');
  const id = page.locator('#identity');
  await expect(id.locator('.panel-label')).toHaveText('01 / STATUS');
  await expect(id.locator('h1')).toHaveCount(0);
  await expect(id.locator('.facts')).toContainText('Associate Backend Engineer, YouGov');
  await expect(id.locator('.facts')).toContainText('2022');
  await expect(id.locator('.facts')).toContainText('BTech Computer Science, 2025');
  const links = id.locator('.identity-links a');
  await expect(links).toHaveText(['Email', 'Download CV']);
  expect(await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))).toEqual([
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

const ABOUT =
  "I'm a Computer Science graduate focused on Python software engineering. I've worked across a range of programming languages, databases, deployment systems and analytical tools. I work to get better at what I do every day, and I pick up new technologies quickly and adapt fast.";

const opacities = (page: Page) =>
  page.locator('#dashboard .panel').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));

test.describe('intro screen', () => {
  test('shows the name, about text, photo and links', async ({ page }) => {
    await page.goto('/');
    const intro = page.locator('#intro');
    await expect(intro.getByRole('heading', { level: 1, name: 'Mikołaj Bigaj' })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(intro.locator('p')).toHaveText(ABOUT);
    const img = intro.locator('img[alt="Mikołaj Bigaj"]');
    await expect(img).toBeVisible();
    expect(await img.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0);
    const links = intro.locator('.intro-links a');
    await expect(links).toHaveText(['GitHub', 'LinkedIn', 'Download CV']);
    expect(await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))).toEqual([
      'https://github.com/MBigaj',
      'https://www.linkedin.com/in/mikolajbigaj/',
      '/Mikolaj_Bigaj_CV.pdf',
    ]);
  });

  test('the intro and the enter link are on the first screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#intro')).toBeInViewport();
    await expect(page.locator('.enter')).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('clicking enter scrolls to the dashboard, focuses it and lights the panels', async ({ page }) => {
    await page.goto('/');
    const historyBefore = await page.evaluate(() => history.length);
    await page.locator('.enter').click();
    await expect.poll(() => page.evaluate(() => Math.abs(document.getElementById('dashboard')!.getBoundingClientRect().top)), { timeout: 3000 }).toBeLessThan(4);
    expect(page.url()).toMatch(/#dashboard$/);
    await expect(page.locator('#dashboard')).toBeFocused();
    await expect.poll(async () => (await opacities(page)).every((o) => o === '1'), { timeout: 1500 }).toBe(true);
    expect(await page.evaluate(() => history.length)).toBe(historyBefore);
  });

  test('panels start dimmed while the dashboard is out of view, then light up on scrolling', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/js-enter/);
    expect((await opacities(page)).every((o) => o === '0.25')).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: document.getElementById('dashboard')!.offsetTop, behavior: 'instant' }));
    await expect.poll(async () => (await opacities(page)).every((o) => o === '1'), { timeout: 1500 }).toBe(true);
  });

  test('without JavaScript the panels are fully visible and enter is a plain anchor', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    expect((await opacities(page)).every((o) => o === '1')).toBe(true);
    await expect(page.locator('.enter')).toHaveAttribute('href', '#dashboard');
    await context.close();
  });

  test('with reduced motion nothing is dimmed after clicking enter', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    expect((await opacities(page)).every((o) => o === '1')).toBe(true);
    await page.locator('.enter').click();
    expect((await opacities(page)).every((o) => o === '1')).toBe(true);
    await expect(page.locator('#dashboard')).toBeFocused();
    await context.close();
  });

  test('scrolling by wheel lights the panels once the dashboard top is in view', async ({ page }) => {
    await page.goto('/');
    const intro = await page.locator('#intro').evaluate((e) => e.getBoundingClientRect().height);
    await page.mouse.move(100, 100);
    await page.mouse.wheel(0, intro + 100);
    await expect.poll(async () => (await opacities(page)).every((o) => o === '1'), { timeout: 1500 }).toBe(true);
  });

  test('with reduced motion the click jumps to the dashboard instantly', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('.enter').click();
    const top = await page.evaluate(() => Math.abs(document.getElementById('dashboard')!.getBoundingClientRect().top));
    expect(top).toBeLessThan(4);
    await context.close();
  });

  test('loading /#dashboard shows the panels lit at once', async ({ page }) => {
    await page.goto('/#dashboard');
    expect((await opacities(page)).every((o) => o === '1')).toBe(true);
  });

  test('loading a hash inside the dashboard shows it lit at once', async ({ page }) => {
    await page.goto('/#projects');
    expect((await opacities(page)).every((o) => o === '1')).toBe(true);
    await expect(page.locator('#projects')).toHaveCSS('opacity', '1');
  });

  for (const width of [320, 390]) {
    test(`no sideways scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
});
