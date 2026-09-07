import { expect, test, type Page } from '@playwright/test';
import { POSTS } from '../src/app/data/posts';
import { BLOG_CONFIG } from '../src/app/data/blog-config';
import { SITE_CONFIG } from '../src/app/data/site-config';
import { JSDOM } from 'jsdom';

const diffusion = POSTS.find(post => post.slug === 'ml-revisit-diffusion')!;
const autoregressive = POSTS.find(post => post.slug === 'ml-revisit-ar')!;
const archivePages = Math.max(1, Math.ceil(POSTS.length / BLOG_CONFIG.postsPerPage));

test('archive pagination supports keyboard navigation, reload, and history', async ({ page }) => {
  test.skip(archivePages < 2, 'The configured archive fits on one page');
  await page.goto('/blog');
  await expect(page.locator('.post-entry')).toHaveCount(BLOG_CONFIG.postsPerPage);
  await expect(page.locator('.post-title span').first()).toHaveText(POSTS[0]!.title);
  const next = page.getByRole('link', { name: 'Next page', exact: true });
  await next.scrollIntoViewIfNeeded();
  await next.focus();
  await next.press('Enter');
  await expect(page).toHaveURL('/blog/page/2');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('.post-title span').first()).toHaveText(POSTS[BLOG_CONFIG.postsPerPage]!.title);
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('2');
  await expect(page).toHaveTitle(`${SITE_CONFIG.title} — Page 2`);
  await page.reload();
  await expect(page.locator('.post-title span').first()).toHaveText(POSTS[BLOG_CONFIG.postsPerPage]!.title);

  const entry = page.locator('.post-entry').last();
  const articlePath = await entry.getAttribute('href');
  await entry.locator('.post-title').scrollIntoViewIfNeeded();
  const position = await page.evaluate(() => scrollY);
  await entry.locator('.post-title').click();
  await expect(page).toHaveURL(articlePath!);
  await expect(page.locator('#article-structured-data')).toHaveCount(1);
  expect(
    await page.locator('#article-structured-data').evaluate(script => JSON.parse(script.textContent!).url),
  ).toBe(`${SITE_CONFIG.url}${articlePath}`);
  await expect(page.locator('link[rel="prev"], link[rel="next"]')).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL('/blog/page/2');
  await expect(page.locator('#article-structured-data')).toHaveCount(0);
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('2');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(position);
  await page.getByRole('link', { name: 'Previous page', exact: true }).click();
  await expect(page).toHaveURL('/blog');
  await page.goBack();
  await expect(page).toHaveURL('/blog/page/2');
  await page.goForward();
  await expect(page).toHaveURL('/blog');
});

test('archive pages contain their own posts and metadata before JavaScript runs', async ({ request, page }) => {
  for (const number of new Set([1, Math.min(2, archivePages), archivePages])) {
    const path = number === 1 ? '/blog' : `/blog/page/${number}`;
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const document = new JSDOM(await response.text()).window.document;
    const entries = Array.from(document.querySelectorAll('.post-entry'));
    const expected = POSTS.slice((number - 1) * BLOG_CONFIG.postsPerPage, number * BLOG_CONFIG.postsPerPage);
    expect(entries.map(entry => entry.querySelector('.post-title span')?.textContent)).toEqual(expected.map(post => post.title));
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_CONFIG.url}${path}`);
    expect(document.title).toBe(`${SITE_CONFIG.title}${number > 1 ? ` — Page ${number}` : ''}`);
    expect(document.querySelectorAll('link[rel="prev"]').length).toBe(number > 1 ? 1 : 0);
    expect(document.querySelectorAll('link[rel="next"]').length).toBe(number < archivePages ? 1 : 0);
  }
  await page.goto('/blog/page/1');
  await expect(page).toHaveURL('/blog');
  for (const number of ['0', 'banana', String(archivePages + 1)]) {
    const response = await request.get(`/blog/page/${number}`);
    expect(response.status()).toBe(404);
    await page.goto(`/blog/page/${number}`);
    await expect(page).toHaveTitle('404: Existence Left as an Exercise');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  }
});

test('search finds articles outside the current archive page', async ({ page }) => {
  test.skip(archivePages < 2, 'The configured archive fits on one page');
  const older = POSTS[BLOG_CONFIG.postsPerPage]!;
  await page.goto('/blog');
  await expect(page.locator('.post-entry').filter({ hasText: older.title })).toHaveCount(0);
  const { input } = await openSearch(page);
  await input.fill(older.title);
  const result = page.getByRole('option').filter({ hasText: older.title });
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(`/blog/${older.slug}`);
});

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
  // Ensure overflow regardless of viewport size or changes to the post collection.
  await page.addStyleTag({ content: '.search-results { max-height: 140px; }' });
  await input.fill('model');
  await expect(page.getByRole('option').nth(2)).toBeVisible();
  const results = page.getByRole('listbox', { name: 'Search results' });
  await expect.poll(() => results.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-0');
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-1');
  await input.press('ArrowUp');
  await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-0');
  await input.press('ArrowUp');
  await expect(input).toHaveAttribute('aria-activedescendant', `search-result-${await page.getByRole('option').count() - 1}`);
  await expect.poll(() => results.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await expect(input).toBeFocused();
  await input.press('ArrowDown');
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
  await input.press('Tab');
  await expect(page.getByRole('button', { name: 'Close search' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
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
  await expect(page).toHaveTitle(`${diffusion.title} — ${SITE_CONFIG.author.name}`);
  await expect(page.locator('.toolbar-mobile-title')).toHaveText('Reading');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    diffusion.description,
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    `${diffusion.title} — ${SITE_CONFIG.author.name}`,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${SITE_CONFIG.url}/blog/${diffusion.slug}`,
  );
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveTitle(SITE_CONFIG.author.name);
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
    expect(html).toContain(`<title>${post.title} — ${SITE_CONFIG.author.name}</title>`);
    expect(html).toContain(`content="${post.description}"`);
    expect(html).toContain(`href="${SITE_CONFIG.url}/blog/${post.slug}"`);
    expect(html).toContain('property="og:type" content="article"');
    expect(html).not.toContain('<script id="MathJax-script"');
    const dom = new JSDOM(html);
    const scripts = dom.window.document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(1);
    expect(JSON.parse(scripts[0]!.textContent!)).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: [{ '@type': 'Person', name: SITE_CONFIG.author.name, url: `${SITE_CONFIG.url}/` }],
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_CONFIG.url}/blog/${post.slug}` },
    });
    dom.window.close();
  }
  const missing = await request.get('/blog/this-post-does-not-exist');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('noindex, follow');
  await page.goto('/blog/this-post-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    '404: Existence Left as an Exercise',
  );
  await expect(page).toHaveTitle('404: Existence Left as an Exercise');
  await expect(page.locator('#article-structured-data')).toHaveCount(0);
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveTitle(SITE_CONFIG.author.name);
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
