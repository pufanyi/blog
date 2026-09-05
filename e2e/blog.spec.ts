import { expect, test, type Page } from '@playwright/test';
import { POSTS } from '../src/app/data/posts';

const diffusion = POSTS.find(post => post.slug === 'ml-revisit-diffusion')!;
const autoregressive = POSTS.find(post => post.slug === 'ml-revisit-ar')!;

async function openSearch(page: Page) {
  const trigger = page.getByRole('button', { name: 'Search', exact: true });
  await trigger.click();
  const input = page.getByRole('combobox', { name: 'Search', exact: true });
  await expect(input).toBeFocused();
  return { trigger, input };
}

// Navigation tests exercise our loading/lifecycle contract independently of
// third-party network availability. Formula appearance is checked with MathJax
// itself when inspecting the served site.
test.beforeEach(async ({ page }) => {
  await page.route(
    /https:\/\/(www\.googletagmanager\.com|.*google-analytics\.com|giscus\.app)\//,
    route => route.fulfill({ body: '', contentType: 'text/javascript' }),
  );
  await page.route('**/mathjax@*/tex-chtml.js', route =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.MathJax = {
      startup: { promise: Promise.resolve() },
      typesetPromise: async elements => {
        await new Promise(resolve => setTimeout(resolve, 80));
        for (const element of elements) {
          for (const formula of element.querySelectorAll('.math-display')) formula.style.minHeight = '100px';
          element.dataset.mathReady = 'true';
        }
      },
      typesetClear: () => {}
    };`,
    }),
  );
});

test.afterEach(async ({ page }) => {
  expect(await page.pageErrors()).toEqual([]);
});

test('search moves one result per key and keeps focus inside the dialog', async ({ page }) => {
  await page.goto('/blog');
  const { trigger, input } = await openSearch(page);
  await input.fill('model');
  await expect(page.getByRole('option').nth(2)).toBeVisible();
  await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-0');
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-1');
  await input.press('ArrowUp');
  await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-0');
  await input.press('Tab');
  await expect(page.getByRole('button', { name: 'Close search' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  await input.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Close search' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Search posts' })).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await openSearch(page);
  await page.getByRole('button', { name: 'Close search' }).click();
  await expect(trigger).toBeFocused();
});

test('Chinese search finds words inside prose and keyboard selection navigates', async ({
  page,
}) => {
  await page.goto('/');
  const { input } = await openSearch(page);
  await input.fill('模型');
  await expect(page.getByRole('option').filter({ hasText: diffusion.title })).toBeVisible();
  await expect(
    page.getByRole('option').filter({ hasText: 'ML Revisit: Autoencoder' }),
  ).toBeVisible();
  await input.fill('Diffusion');
  await input.press('Enter');
  await expect(page).toHaveURL(`/blog/${diffusion.slug}`);
  await expect(page).toHaveTitle(`${diffusion.title} — Fanyi Pu`);
  await expect(page.locator('.toolbar-mobile-title')).toHaveText('Reading');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    diffusion.description,
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    `${diffusion.title} — Fanyi Pu`,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://pufanyi.com/blog/${diffusion.slug}`,
  );
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveTitle('Fanyi Pu');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0);
});

test('new articles start at the top and history restores the previous reading position', async ({
  page,
}) => {
  await page.goto(`/blog/${autoregressive.slug}`);
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(900);
  const { input } = await openSearch(page);
  await input.fill('Diffusion');
  await input.press('Enter');
  await expect(page).toHaveURL(`/blog/${diffusion.slug}`);
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goBack();
  await expect(page).toHaveURL(`/blog/${autoregressive.slug}`);
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(900);
});

test('table of contents preserves focus and anchors after deferred formula layout', async ({
  page,
}) => {
  await page.goto(`/blog/${autoregressive.slug}#references`);
  const heading = page.locator('.post-body #references');
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
  await expect
    .poll(async () =>
      heading.evaluate(element =>
        Math.abs(
          element.getBoundingClientRect().top -
            parseFloat(getComputedStyle(element).scrollMarginTop),
        ),
      ),
    )
    .toBeLessThan(3);
  const trigger = page.getByRole('button', { name: 'Toggle table of contents' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Table of contents', exact: true });
  await expect(dialog.getByRole('button', { name: 'Close table of contents' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('link', { name: 'Early Explorations', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.post-body #early-explorations')).toBeFocused();
  await expect(page).toHaveURL(/#early-explorations$/);
});

test('prerendered HTML contains article metadata and missing routes return the 404 page', async ({
  request,
  page,
}) => {
  for (const post of [diffusion, autoregressive]) {
    const response = await request.get(`/blog/${post.slug}`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`<title>${post.title} — Fanyi Pu</title>`);
    expect(html).toContain(`content="${post.description}"`);
    expect(html).toContain(`href="https://pufanyi.com/blog/${post.slug}"`);
    expect(html).toContain('property="og:type" content="article"');
    expect(html).not.toContain('<script id="MathJax-script"');
  }
  const missing = await request.get('/blog/this-post-does-not-exist');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('noindex, follow');
  await page.goto('/blog/this-post-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    '404: Existence Left as an Exercise',
  );
  await expect(page).toHaveTitle('404: Existence Left as an Exercise');
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveTitle('Fanyi Pu');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
});

test('home and search do not download article bodies or MathJax; reading loads one body', async ({
  page,
}) => {
  const scripts: Promise<string>[] = [];
  let mathRequests = 0;
  page.on('request', request => {
    if (request.url().includes('/mathjax@')) mathRequests++;
  });
  page.on('response', response => {
    if (
      response.url().startsWith('http://127.0.0.1:4173/') &&
      response.request().resourceType() === 'script'
    )
      scripts.push(response.text());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect((await Promise.all(scripts)).join('\n')).not.toContain('contentHtml');
  expect(mathRequests).toBe(0);
  const { input } = await openSearch(page);
  await input.fill('Diffusion');
  await expect(page.getByRole('option').first()).toBeVisible();
  expect((await Promise.all(scripts)).join('\n')).not.toContain('contentHtml');
  expect(mathRequests).toBe(0);
  await input.press('Enter');
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
  expect((await Promise.all(scripts)).filter(script => /contentHtml:/.test(script))).toHaveLength(
    1,
  );
  expect(mathRequests).toBe(1);
});
