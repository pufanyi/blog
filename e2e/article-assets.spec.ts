import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: route.request().url().includes('/mathjax@')
        ? 'window.MathJax = {startup:{promise:Promise.resolve()},typesetPromise:async()=>{},typesetClear:()=>{}};'
        : '',
    }),
  );
});

test('comments wait until the reader approaches the end of the article', async ({ page }) => {
  let requests = 0;
  page.on('request', (request) => {
    if (request.url() === 'https://giscus.app/client.js') requests++;
  });
  await page.goto('/blog/ml/ml-revisit/rl-policy-gradient');
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
  expect(requests).toBe(0);
  await page.locator('app-giscus-comments').scrollIntoViewIfNeeded();
  await expect.poll(() => requests).toBe(1);
});

test('formulas and closed derivations remain readable with JavaScript disabled', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.route('https://**/*', (route) => route.fulfill({ body: '' }));
    await page.goto('/blog/ml/ml-revisit/rl-policy-gradient');
    expect(await page.locator('mjx-container[data-static-math]').count()).toBeGreaterThan(100);
    const details = page
      .locator('details')
      .filter({ has: page.locator('mjx-container') })
      .first();
    await details.locator('summary').first().click();
    await expect(details.locator('mjx-container').first()).toBeVisible();
  } finally {
    await context.close();
  }
});

test('article styles render before JavaScript and disappear when navigating away', async ({
  page,
  request,
}) => {
  const article = '/blog/ml/ml-revisit/ssl';
  const html = await (await request.get(article)).text();
  expect(html).toContain('<style data-post-style');
  expect(html).toContain('.ssl-diagram');
  const markdown = await (await request.get(`${article}.md`)).text();
  expect(markdown).not.toContain('.ssl-diagram');
  await page.goto(article);
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await expect(page.locator('.ssl-diagram').first()).toHaveCSS('width', '660px');
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.locator('style[data-post-style]')).toHaveCount(0);
  expect(await page.locator('style').allTextContents()).not.toEqual(
    expect.arrayContaining([expect.stringContaining('.ssl-diagram')]),
  );
  await page.goto('/blog/oi-icpc/codeforces/cf551c');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await expect(page.locator('style[data-post-style]')).toHaveCount(0);
});

test('leaving an interactive article disposes its controls and build-only sources stay private', async ({
  page,
  request,
}) => {
  const asset = '/posts/ml/ml-revisit/infra/flash-attention';
  for (const path of [
    `${asset}/styles.css`,
    `${asset}/scripts/model.ts`,
    `${asset}/scripts/forward.post-client.ts`,
  ]) {
    expect((await request.get(path)).status()).toBe(404);
  }
  await page.goto('/blog/ml/ml-revisit/infra/flash-attention');
  const player = page.locator('[data-flash-forward]');
  await player.scrollIntoViewIfNeeded();
  await expect(player).toHaveAttribute('data-ready', 'true');
  const retired = await player.elementHandle();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(player).toHaveCount(0);
  expect(
    await retired!.evaluate((element) => ({
      ready: element.getAttribute('data-ready'),
      controlsHidden: element.querySelector<HTMLElement>('[data-controls]')!.hidden,
      disabled: [...element.querySelectorAll<HTMLButtonElement>('[data-query]')].every(
        (button) => button.disabled,
      ),
    })),
  ).toEqual({ ready: null, controlsHidden: true, disabled: true });
  await retired!.dispose();
});
