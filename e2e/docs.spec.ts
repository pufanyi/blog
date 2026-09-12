import { expect } from '@playwright/test';
import { test } from './fixtures';

test('documentation supports client navigation, filtering, anchors, history, and themes', async ({
  page,
}) => {
  await page.goto('/docs');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog handbook');
  await expect(page.locator('.docs-body')).toHaveAttribute('data-rendered', 'true');
  await page.evaluate(() => {
    document.documentElement.dataset['docsSession'] = 'retained';
  });
  await page
    .locator('.docs-body')
    .getByRole('link', { name: 'your first post', exact: true })
    .click();
  await expect(page).toHaveURL(/\/docs\/writing\/first-post$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your first post');
  expect(await page.evaluate(() => document.documentElement.dataset['docsSession'])).toBe(
    'retained',
  );
  await page.getByText('On this page', { exact: true }).click();
  await page
    .getByRole('navigation', { name: 'On this page' })
    .getByRole('link', { name: 'Front matter reference' })
    .click();
  await expect(page).toHaveURL(/#front-matter-reference$/);
  await expect(page.locator('#front-matter-reference')).toBeInViewport();
  await page.goBack();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog handbook');
  const mobile = await page.locator('.docs-mobile-menu').isVisible();
  if (mobile) await page.getByText('Browse documentation', { exact: true }).click();
  const navigation = page.locator(mobile ? '.docs-mobile-menu' : '.docs-sidebar');
  await navigation.getByRole('searchbox', { name: 'Find a guide' }).fill('citations');
  await navigation.getByRole('link', { name: 'Citations and bibliographies', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Citations and bibliographies');
  if (mobile) await expect(page.locator('.docs-mobile-menu')).not.toHaveAttribute('open');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('documentation preserves wide examples without overflowing the page', async ({
  page,
}, testInfo) => {
  await page.goto('/docs/writing/first-post');
  await expect(page.locator('.docs-body')).toHaveAttribute('data-rendered', 'true');
  await expect(page.locator('.code-copy').first()).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          document.body.dataset['copiedCode'] = text;
        },
      },
    });
  });
  await page.locator('.code-copy').first().click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-copied-code',
    /pnpm install --frozen-lockfile/,
  );
  if ((page.viewportSize()?.width ?? 0) > 1100) {
    expect((await page.locator('.paper').boundingBox())!.width).toBeGreaterThan(1000);
  } else {
    expect(
      await page
        .locator('.docs-body .table-wrapper')
        .first()
        .evaluate((table) => table.scrollWidth > table.clientWidth),
    ).toBe(true);
  }
  await expect(page.locator('.docs-body .shiki').first()).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('docs-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await page.screenshot({
    path: testInfo.outputPath('docs-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/docs/no-such-guide');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveCount(0);
});
