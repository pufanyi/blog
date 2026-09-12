import { expect, type Page } from '@playwright/test';
import { BLOG_CONFIG } from '../src/app/data/blog-config';
import { POSTS } from '../src/app/data/posts';
import { SITE_CONFIG } from '../src/app/data/site-config';
import { openSearch, test } from './fixtures';

const archivePages = Math.max(1, Math.ceil(POSTS.length / BLOG_CONFIG.postsPerPage));

const vae = POSTS.find((post) => post.slug === 'ml/ml-revisit/ae/ml-revisit-vae')!;

const diffusion = POSTS.find((post) => post.slug === 'ml/ml-revisit/diffusion')!;

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function interceptSearchEngine(page: Page, beforeResponse: () => Promise<boolean>) {
  await page.route('**/*.js', async (route) => {
    if (!route.request().url().startsWith(new URL(page.url()).origin)) return route.fallback();
    const response = await route.fetch();
    const body = await response.text();
    // Identify the engine by its tokenizer and result field, independently of
    // production chunk hashes. The dialog must load while this response waits.
    if (body.includes('Intl.Segmenter') && body.includes('matchField')) {
      if (!(await beforeResponse())) return route.abort('failed');
    }
    return route.fulfill({ response, body });
  });
}

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

test('search opens and stays interactive while its index downloads', async ({ page }) => {
  const requested = deferred();
  const release = deferred();
  let engineRequests = 0;
  await interceptSearchEngine(page, async () => {
    engineRequests++;
    requested.resolve();
    await release.promise;
    return true;
  });
  await page.goto('/');
  expect(engineRequests).toBe(0);
  const { trigger, input } = await openSearch(page);
  await requested.promise;
  await expect(page.getByRole('status')).toContainText('Loading search');
  await input.fill('attention');
  await input.fill('模型');
  expect(
    await page
      .locator('.search-input-wrap')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await expect(page.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByText('No results', { exact: false })).toHaveCount(0);
  await input.press('Enter');
  await input.press('Escape');
  await expect(trigger).toBeFocused();
  await openSearch(page);
  await input.fill('模型');
  release.resolve();
  await expect(page.getByRole('option').filter({ hasText: diffusion.title })).toBeVisible();
  await expect(page.getByRole('option').filter({ hasText: vae.title })).toBeVisible();
  await expect(page.getByRole('listbox')).toHaveAttribute('aria-busy', 'false');
  await expect(page).toHaveURL('/');
  await input.press('Escape');
  await openSearch(page);
  await input.fill('attention');
  await expect(page.getByRole('option').first()).toContainText('Attention');
  expect(engineRequests).toBe(1);
});

test('Enter during the first download opens the latest query after loading', async ({ page }) => {
  const release = deferred();
  await interceptSearchEngine(page, async () => {
    await release.promise;
    return true;
  });
  await page.goto('/');
  const { input } = await openSearch(page);
  await input.fill('attention');
  await input.press('Enter');
  await input.fill('Diffusion');
  await input.press('Enter');
  release.resolve();
  await expect(page).toHaveURL(`/blog/${diffusion.slug}`);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('search offers a page reload after an index download fails', async ({ page }) => {
  const fail = deferred();
  let engineRequests = 0;
  await interceptSearchEngine(page, async () => {
    if (++engineRequests > 1) return true;
    await fail.promise;
    return false;
  });
  await page.goto('/');
  const { input } = await openSearch(page);
  await input.fill('模型');
  fail.resolve();
  await expect(page.getByRole('alert')).toContainText('Search could not load');
  await page.getByRole('button', { name: 'Reload page' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await openSearch(page);
  await input.fill('模型');
  await expect(page.getByRole('option').filter({ hasText: diffusion.title })).toBeVisible();
  await expect(input).toHaveValue('模型');
  expect(engineRequests).toBe(2);
});

test('search moves one result per key and keeps focus inside the dialog', async ({ page }) => {
  await page.goto('/blog');
  const { trigger, input } = await openSearch(page);
  // Ensure overflow regardless of viewport size or changes to the post collection.
  await page.addStyleTag({ content: '.search-results { max-height: 140px; }' });
  await input.fill('model');
  await expect(page.getByRole('option').nth(2)).toBeVisible();
  const results = page.getByRole('listbox', { name: 'Search results' });
  await expect
    .poll(() => results.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-0');
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-1');
  await input.press('ArrowUp');
  await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-0');
  await input.press('ArrowUp');
  await expect(input).toHaveAttribute(
    'aria-activedescendant',
    `search-result-${(await page.getByRole('option').count()) - 1}`,
  );
  await expect.poll(() => results.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
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
  await expect(page.getByRole('option').filter({ hasText: vae.title })).toBeVisible();
  await input.fill('Diffusion');
  await input.press('Enter');
  await expect(page).toHaveURL(`/blog/${diffusion.slug}`);
  await expect(page).toHaveTitle(`${diffusion.title} — ${SITE_CONFIG.author.name}`);
  await expect(page.locator('.toolbar-mobile-title')).toHaveText('Reading');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    diffusion.description ?? SITE_CONFIG.description,
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
