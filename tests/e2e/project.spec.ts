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
  const stack = page.locator('.hero-side > div', { hasText: 'STACK' });
  await expect(stack).toContainText('Django · React · PostgreSQL · clustering model');
  await expect(stack).not.toContainText('Sprint planning');
});

test('section labels are level-2 headings under the project title', async ({ page }) => {
  await page.goto('/projects/dark-souls-app/');
  const h2 = await page.getByRole('heading', { level: 2 }).allTextContents();
  expect(h2).toContain('PROBLEM');
  expect(h2).toContain('ARCHITECTURE');
  await expect(page.getByRole('region', { name: 'ARCHITECTURE' })).toContainText('Fig. 01');
});

test('a figure can be scrolled from the keyboard and owns its arrowhead', async ({ page }) => {
  await page.goto('/projects/dark-souls-app/');
  const sheet = page.getByRole('group', { name: 'Request path and telemetry' });
  await expect(sheet).toHaveClass(/bp-sheet/);
  await expect(sheet).toHaveAttribute('tabindex', '0');
  const marker = page.locator('figure svg marker');
  await expect(marker).toHaveAttribute('id', 'bp-arrow-page-1-fig-01');
  const ends = await page.locator('figure svg path.bp-edge').evaluateAll((els) => els.map((e) => e.getAttribute('marker-end')));
  expect(ends).toEqual(Array(3).fill('url(#bp-arrow-page-1-fig-01)'));
  expect(await page.locator('.bp-label').first().evaluate((e) => getComputedStyle(e).fontWeight)).toBe('600');
});

test('a link in a Markdown body is underlined, accent coloured and tall enough to tap', async ({ page }) => {
  await page.goto('/projects/talis/');
  // The seed content has no Markdown link yet, so put one where a rendered body would have it.
  await page.locator('.prose p').first().evaluate((p) => p.insertAdjacentHTML('beforeend', ' <a href="/work/">more</a>'));
  const link = page.locator('.prose a');
  const style = await link.evaluate((a) => {
    const cs = getComputedStyle(a);
    return { line: cs.textDecorationLine, colour: cs.color };
  });
  expect(style).toEqual({ line: 'underline', colour: 'rgb(108, 182, 255)' });
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await link.focus();
  expect(await link.evaluate((a) => getComputedStyle(a).outlineStyle)).toBe('solid');
});

test.describe('the digit recognition demo', () => {
  const PAGE = '/projects/digit-recognition/';
  const MODEL = '/models/digit-model.json';

  /** Draws through the given points, in pad coordinates (0 to 280 on a 280 px pad). */
  async function stroke(page: import('@playwright/test').Page, points: [number, number][]) {
    const pad = page.locator('.dd-pad');
    await pad.scrollIntoViewIfNeeded();
    const box = (await pad.boundingBox())!;
    const k = box.width / 280;
    const at = ([x, y]: [number, number]) => [box.x + x * k, box.y + y * k] as const;
    await page.mouse.move(...at(points[0]));
    await page.mouse.down();
    for (const p of points.slice(1)) await page.mouse.move(...at(p), { steps: 2 });
    await page.mouse.up();
  }

  const one: [number, number][] = Array.from({ length: 19 }, (_, i) => [140, 50 + i * 10]);
  const zero: [number, number][] = Array.from({ length: 41 }, (_, i) => {
    const a = (i / 40) * 2 * Math.PI;
    return [140 + 60 * Math.sin(a), 140 - 90 * Math.cos(a)];
  });

  async function barWidths(page: import('@playwright/test').Page) {
    return page.locator('.dd-bar').evaluateAll((els) => els.map((e) => (e as HTMLElement).style.getPropertyValue('--v')));
  }

  async function outputs(page: import('@playwright/test').Page) {
    return page.locator('.dd-val').allTextContents();
  }

  test('shows the new summary and a TRY IT section, which other projects do not have', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('.summary')).toHaveText(
      'A neural network written by hand that analyses a digit drawn by hand and predicts it using classification.',
    );
    const demo = page.getByRole('region', { name: 'TRY IT' });
    await expect(demo).toBeVisible();
    await expect(demo).toContainText('Weights trained once from the original code and exported for this page.');
    await expect(demo.getByRole('link', { name: 'How it was trained' })).toHaveAttribute(
      'href',
      'https://github.com/MBigaj/mbigaj.github.io/blob/main/scripts/export-digit-model.py',
    );
    for (const other of ['/projects/talis/', '/projects/dark-souls-app/']) {
      await page.goto(other);
      await expect(page.locator('main')).not.toContainText('TRY IT');
    }
  });

  test('loads the model only when the section comes near the viewport', async ({ page }) => {
    // Short enough that the section starts well over 200 px below the fold at either width.
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 240 });
    const requested: string[] = [];
    page.on('request', (r) => requested.push(new URL(r.url()).pathname));
    await page.goto(PAGE, { waitUntil: 'load' });
    expect(await page.locator('.dd').evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThan(440);
    expect(requested).not.toContain(MODEL);
    const loaded = page.waitForResponse((r) => new URL(r.url()).pathname === MODEL);
    await page.locator('.dd').scrollIntoViewIfNeeded();
    expect((await loaded).ok()).toBe(true);
    await expect(page.locator('.dd-hint')).toHaveText('Draw a digit from 0 to 9.');
  });

  test('predicts a drawn 1 and a drawn 0', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('.dd').scrollIntoViewIfNeeded();
    await expect(page.locator('.dd-hint')).toHaveText('Draw a digit from 0 to 9.');
    const digit = page.locator('.dd-digit');

    await stroke(page, one);
    await expect(digit).not.toHaveText('–');
    test.info().annotations.push({ type: 'drawn 1', description: `${await digit.textContent()}: ${(await outputs(page)).join(' ')}` });
    await expect(digit).toHaveText('1');

    await page.getByRole('button', { name: 'Clear' }).click();
    await stroke(page, zero);
    await expect(digit).not.toHaveText('–');
    test.info().annotations.push({ type: 'drawn 0', description: `${await digit.textContent()}: ${(await outputs(page)).join(' ')}` });
    await expect(digit).toHaveText('0');
  });

  test('Clear and Delete reset the result', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('.dd').scrollIntoViewIfNeeded();
    await expect(page.locator('.dd-hint')).toHaveText('Draw a digit from 0 to 9.');
    const digit = page.locator('.dd-digit');
    const empty = Array(10).fill('0');

    await stroke(page, one);
    await expect(digit).not.toHaveText('–');
    expect(await barWidths(page)).not.toEqual(empty);
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(digit).toHaveText('–');
    expect(await barWidths(page)).toEqual(empty);

    await stroke(page, one);
    await expect(digit).not.toHaveText('–');
    // A mouse stroke focuses the pad natively, without the keyboard focus ring.
    const pad = page.locator('.dd-pad');
    await expect(pad).toBeFocused();
    expect(await pad.evaluate((el) => el.matches(':focus-visible'))).toBe(false);
    await page.keyboard.press('Delete');
    await expect(digit).toHaveText('–');
    expect(await barWidths(page)).toEqual(empty);
  });

  test('treats a model of the wrong shape as a load failure', async ({ page }) => {
    await page.route(`**${MODEL}`, (route) =>
      route.fulfill({ json: { layers: [{ weights: [[0]], bias: [0] }], activations: ['sigmoid'] } }),
    );
    await page.goto(PAGE);
    await page.locator('.dd').scrollIntoViewIfNeeded();
    await expect(page.locator('.dd-hint')).toHaveText('The model could not be loaded.');
    await expect(page.locator('.dd-hint')).toHaveAttribute('aria-live', 'polite');
    await stroke(page, one);
    await expect(page.locator('.dd-digit')).toHaveText('–');
  });

  test('fits a phone and has a tall enough Clear button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PAGE);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const clear = page.getByRole('button', { name: 'Clear' });
    expect((await clear.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const pad = (await page.locator('.dd-pad').boundingBox())!;
    expect(Math.round(pad.width)).toBe(Math.round(pad.height));
  });
});

test.describe('the digit recognition demo without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('says it needs JavaScript and shows nothing interactive', async ({ page }) => {
    await page.goto('/projects/digit-recognition/');
    const demo = page.getByRole('region', { name: 'TRY IT' });
    await expect(demo).toContainText('The demo needs JavaScript.');
    await expect(demo.locator('canvas, button, a').filter({ visible: true })).toHaveCount(0);
  });
});
