import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(
    /https:\/\/(www\.googletagmanager\.com|.*google-analytics\.com|giscus\.app)\//,
    route => route.fulfill({ body: '', contentType: 'text/javascript' }),
  );
});

test.afterEach(async ({ page }) => {
  expect(await page.pageErrors()).toEqual([]);
});

test('two embedded PDFs render independently and follow the article theme', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog');
  await page.goto('/blog/oi-icpc/other-problems/mock-contest-20190307');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  const embeds = page.locator('iframe.post-pdf');
  await expect(embeds).toHaveCount(2);
  const problems = embeds.nth(0).contentFrame();
  const solutions = embeds.nth(1).contentFrame();
  for (let index = 0; index < 2; index++) {
    await embeds.nth(index).scrollIntoViewIfNeeded();
    await expect(embeds.nth(index).contentFrame().locator('.page[data-page-number="1"] canvas').first()).toBeVisible({ timeout: 30_000 });
  }
  await expect(problems.locator('app-blog-shell')).toHaveCount(0);
  await expect(solutions.locator('app-blog-shell')).toHaveCount(0);
  await expect(problems.locator('#pageNumber')).toHaveValue('1');
  await expect(solutions.locator('#pageNumber')).toHaveValue('1');

  await embeds.nth(0).scrollIntoViewIfNeeded();
  const pageNumber = problems.locator('#pageNumber');
  await pageNumber.fill('2');
  await pageNumber.press('Enter');
  await expect(problems.locator('.page[data-page-number="2"] canvas').first()).toBeVisible();
  await expect(solutions.locator('#pageNumber')).toHaveValue('1');

  const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
  await themeToggle.scrollIntoViewIfNeeded();
  await themeToggle.click();
  await expect(problems.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(solutions.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(problems.locator('#pageNumber')).toHaveValue('2');
  await expect(page.getByRole('link', { name: '查看题目 PDF', exact: true })).toHaveAttribute('href', '/posts/oi-icpc/other-problems/mock-contest-20190307/problem.pdf');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goBack();
  await expect(page).toHaveURL('/blog');
  await expect(embeds).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL('/blog/oi-icpc/other-problems/mock-contest-20190307');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await expect(problems.locator('.page canvas').first()).toBeVisible({ timeout: 30_000 });
  await embeds.nth(0).scrollIntoViewIfNeeded();
});

test('the static reader is noindex and rejects non-asset sources', async ({ page, request }) => {
  const response = await request.get('/pdf-viewer');
  expect(response.status()).toBe(200);
  expect(await response.text()).toMatch(/name="robots" content="noindex, follow"/);
  const sitemap = await request.get('/sitemap.xml');
  expect(await sitemap.text()).not.toContain('/pdf-viewer');
  await page.goto('/pdf-viewer?file=https%3A%2F%2Fexample.com%2Ffile.pdf');
  await expect(page.getByRole('status')).toHaveText('未找到 PDF 文件。');
  await expect(page.locator('ngx-extended-pdf-viewer')).toHaveCount(0);
});

test('failed PDF loads retain a direct file link', async ({ page }) => {
  await page.route('**/posts/example/missing.pdf', route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/pdf-viewer?file=%2Fposts%2Fexample%2Fmissing.pdf');
  const error = page.getByRole('alert');
  await expect(error).toContainText('无法加载 PDF', { timeout: 20_000 });
  await expect(error.getByRole('link', { name: '打开原文件' })).toHaveAttribute('href', '/posts/example/missing.pdf');
});

test('CMYK PDFs load their color profile from the static deployment', async ({ page }) => {
  const profile = page.waitForResponse(response => response.url().endsWith('/CGATS001Compat-v2-micro.icc'));
  await page.goto('/pdf-viewer?file=%2Fposts%2Foi-icpc%2Fother-problems%2Fwf2019-a%2Fa.pdf');
  expect((await profile).status()).toBe(200);
  await expect(page.locator('.page canvas').first()).toBeVisible();
});
