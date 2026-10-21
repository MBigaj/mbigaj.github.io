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

test('Talis shows its architecture figure, its screens and DigitalOcean in the stack', async ({ page }) => {
  await page.goto('/projects/talis/');
  const fig = page.locator('figure svg[role="img"]');
  await expect(fig).toHaveCount(1);
  for (const text of ['Django app', 'PostgreSQL', 'Recommender', 'Jupyter notebook']) await expect(fig).toContainText(text);
  await expect(page.locator('figcaption').first()).toHaveText('Fig. 01 · System overview and recommendation model');
  await expect(page.locator('.hero-side > div', { hasText: 'STACK' })).toContainText('DigitalOcean');
});

test('the Talis screens are in order, loaded and served resized', async ({ page }) => {
  await page.goto('/projects/talis/');
  const alts = [
    'Talis home page listing the top-rated board games',
    "A player's library of board games with ratings and dates added",
    'A local game meeting with its games, host, crew size and a map',
    "A player's profile with their friends list",
    'The Talis sign-up form',
  ];
  const images = page.getByRole('region', { name: 'SCREENS' }).locator('img');
  await expect(images).toHaveCount(5);
  for (const [i, alt] of alts.entries()) {
    const img = images.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveAttribute('alt', alt);
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
    const src = await img.evaluate((el: HTMLImageElement) => el.currentSrc);
    expect(src).toContain('/_astro/');
    expect(src).not.toMatch(/\/assets\/talis\//);
  }
});

test('the Talis page does not scroll sideways', async ({ page }) => {
  await page.goto('/projects/talis/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('an odd last screen spans both columns on desktop and the figure hints that it scrolls on a phone', async ({ page }, testInfo) => {
  await page.goto('/projects/talis/');
  const hint = page.locator('.bp-hint');
  if (testInfo.project.name === 'desktop') {
    const figures = page.getByRole('region', { name: 'SCREENS' }).locator('figure');
    const [first, last, panel] = await Promise.all([
      figures.first().boundingBox(),
      figures.last().boundingBox(),
      page.getByRole('region', { name: 'SCREENS' }).locator('.screens').boundingBox(),
    ]);
    expect(last!.width).toBeGreaterThan(first!.width * 1.9);
    expect(Math.abs(last!.width - panel!.width)).toBeLessThan(2);
    await expect(hint).toBeHidden();
  } else {
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText('scroll ↔');
  }
});

test.describe('the screenshot viewer', () => {
  const ALTS = [
    'Talis home page listing the top-rated board games',
    "A player's library of board games with ratings and dates added",
    'A local game meeting with its games, host, crew size and a map',
    "A player's profile with their friends list",
    'The Talis sign-up form',
  ];
  const FIRST_CAPTION = 'Home page: the highest-rated games, open to visitors without an account.';

  async function open(page: import('@playwright/test').Page, index = 0) {
    await page.goto('/projects/talis/');
    const thumb = page.getByRole('link', { name: `Open full screen: ${ALTS[index]}` });
    await thumb.scrollIntoViewIfNeeded();
    await thumb.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveAttribute('open', '');
    return { dialog, thumb };
  }

  test('opens the clicked screenshot with its caption, counter and focus on Close', async ({ page }) => {
    const { dialog } = await open(page);
    const img = dialog.getByRole('img', { name: ALTS[0] });
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(1000);
    expect(await img.evaluate((el: HTMLImageElement) => el.currentSrc)).toContain('/_astro/');
    await expect(dialog).toContainText(FIRST_CAPTION);
    await expect(dialog.locator('.viewer-count')).toHaveText('1 / 5');
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
    expect(await page.evaluate(() => location.pathname)).toBe('/projects/talis/');
  });

  test('steps with the buttons and the arrow keys, and hides Previous and Next at the ends', async ({ page }) => {
    const { dialog } = await open(page);
    const count = dialog.locator('.viewer-count');
    const prev = dialog.getByRole('button', { name: 'Previous screenshot' });
    const next = dialog.getByRole('button', { name: 'Next screenshot' });
    await expect(prev).toBeHidden();
    await next.click();
    await expect(count).toHaveText('2 / 5');
    await expect(dialog.getByRole('img', { name: ALTS[1] })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(count).toHaveText('3 / 5');
    await page.keyboard.press('ArrowLeft');
    await expect(count).toHaveText('2 / 5');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(count).toHaveText('5 / 5');
    await expect(next).toBeHidden();
    await expect(prev).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(count).toHaveText('5 / 5');
  });

  test('Esc closes it and focus returns to the thumbnail of the shot that was showing', async ({ page }) => {
    const { dialog } = await open(page);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.locator('.viewer-count')).toHaveText('3 / 5');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('link', { name: `Open full screen: ${ALTS[2]}` })).toBeFocused();
  });

  test('a click on the backdrop closes it and a click on the image does not', async ({ page }) => {
    const { dialog } = await open(page);
    await dialog.getByRole('img', { name: ALTS[0] }).click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(dialog).toBeHidden();
  });

  test('the image keeps its size when the large file replaces the placeholder', async ({ page }) => {
    await page.goto('/projects/talis/');
    const thumb = page.getByRole('link', { name: `Open full screen: ${ALTS[0]}` });
    const href = (await thumb.getAttribute('href'))!;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route(`**${href}`, async (route) => {
      await gate;
      await route.continue();
    });
    await thumb.scrollIntoViewIfNeeded();
    await thumb.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveAttribute('open', '');
    const img = dialog.getByRole('img', { name: ALTS[0] });
    await expect(img).toBeVisible();
    // Let the opening scale transition finish before measuring.
    await page.waitForTimeout(400);
    const before = (await img.boundingBox())!;
    const placeholderWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(placeholderWidth).toBeLessThan(1000);
    release();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(1000);
    const after = (await img.boundingBox())!;
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(2);
  });

  test('a press that starts on the image and ends on the empty stage does not close it', async ({ page }) => {
    const { dialog } = await open(page);
    const box = (await dialog.getByRole('img', { name: ALTS[0] }).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(5, 5);
    await page.mouse.up();
    await page.waitForTimeout(350);
    await expect(dialog).toBeVisible();
  });

  test('arrow keys and Next do nothing during the closing fade', async ({ page }) => {
    const { dialog } = await open(page);
    await dialog.evaluate((el: HTMLDialogElement) => el.setAttribute('data-closing', ''));
    await page.keyboard.press('ArrowRight');
    await dialog.getByRole('button', { name: 'Next screenshot' }).dispatchEvent('click');
    await expect(dialog.locator('.viewer-count')).toHaveText('1 / 5');
  });

  test('opening the viewer does not shift the page behind', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects/talis/');
    const thumb = page.getByRole('link', { name: `Open full screen: ${ALTS[0]}` });
    await thumb.scrollIntoViewIfNeeded();
    const before = (await thumb.boundingBox())!.x;
    await thumb.click();
    await expect(page.getByRole('dialog')).toHaveAttribute('open', '');
    const after = (await thumb.boundingBox())!.x;
    expect(Math.abs(after - before)).toBeLessThanOrEqual(0.5);
  });

  test('the page behind does not scroll while it is open', async ({ page }) => {
    const { dialog } = await open(page);
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(200, 200);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
  });

  test('Close, Previous and Next are at least 44 by 44 px', async ({ page }) => {
    const { dialog } = await open(page, 1);
    for (const name of ['Close', 'Previous screenshot', 'Next screenshot']) {
      const box = (await dialog.getByRole('button', { name }).boundingBox())!;
      expect(box.width, name).toBeGreaterThanOrEqual(44);
      expect(box.height, name).toBeGreaterThanOrEqual(44);
    }
  });

  test('a swipe left on the image steps to the next shot', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'touch swipe is checked on the phone');
    const { dialog } = await open(page);
    const box = (await dialog.getByRole('img', { name: ALTS[0] }).boundingBox())!;
    const y = box.y + box.height / 2;
    const x = box.x + box.width / 2 + 60;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let d = 20; d <= 120; d += 20)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - d, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(dialog.locator('.viewer-count')).toHaveText('2 / 5');
  });

  test('the page does not scroll sideways at 390 px with the viewer closed', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/talis/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('each thumbnail links to a large image', async ({ page }) => {
      await page.goto('/projects/talis/');
      const links = page.locator('.screens a');
      await expect(links).toHaveCount(5);
      const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')));
      for (const href of hrefs) expect(href).toMatch(/^\/_astro\/.+\.(webp|jpg|png|avif)$/);
      const response = await page.goto(hrefs[0]!);
      expect(response!.headers()['content-type']).toMatch(/^image\//);
    });
  });
});
