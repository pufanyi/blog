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
