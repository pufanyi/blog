import { expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { BLOG_CONFIG } from '../src/app/data/blog-config';
import { POSTS } from '../src/app/data/posts';
import { SITE_CONFIG } from '../src/app/data/site-config';
import { test } from './fixtures';

const archivePages = Math.max(1, Math.ceil(POSTS.length / BLOG_CONFIG.postsPerPage));

test('folder navigation opens nested articles and returns through their breadcrumbs', async ({
  page,
}) => {
  await page.goto('/blog/contents');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Contents');
  await expect(page.locator('.directory-entry')).toHaveCount(
    new Set(POSTS.map((post) => post.slug.split('/')[0])).size,
  );
  await page.locator('a.directory-entry[href="/blog/contents/oi-icpc"]').click();
  await expect(page).toHaveURL('/blog/contents/oi-icpc');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('oi-icpc');
  const folder = page.locator('a.directory-entry[href="/blog/contents/oi-icpc/codeforces"]');
  const codeforcesPosts = POSTS.filter((post) => post.slug.startsWith('oi-icpc/codeforces/'));
  const date = codeforcesPosts
    .map((post) => post.date)
    .sort()
    .at(-1)!;
  await expect(folder.locator('time')).toHaveAttribute('datetime', date);
  await folder.scrollIntoViewIfNeeded();
  await folder.focus();
  await folder.press('Enter');
  await expect(page).toHaveURL('/blog/contents/oi-icpc/codeforces');
  await expect(page.locator('.directory-entry')).toHaveCount(codeforcesPosts.length);
  await expect(page.locator('.directory-entry[data-kind="post"] .entry-copy')).toHaveText(
    codeforcesPosts.map((post) => post.title),
  );
  await page.locator('a.directory-entry[href="/blog/oi-icpc/codeforces/cf551c"]').click();
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await expect(page).toHaveURL('/blog/oi-icpc/codeforces/cf551c');
  await expect(page.locator('app-post-header h1')).toContainText('551');
  const breadcrumbs = page.getByRole('navigation', { name: 'Blog directory breadcrumb' });
  await breadcrumbs.getByRole('link', { name: 'oi-icpc', exact: true }).click();
  await expect(page).toHaveURL('/blog/contents/oi-icpc');
  await expect(page.locator('#article-structured-data')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${SITE_CONFIG.url}/blog/contents/oi-icpc`,
  );
  await page.reload();
  await expect(
    page.locator('a.directory-entry[href="/blog/contents/oi-icpc/codeforces"] time'),
  ).toHaveAttribute('datetime', date);
  await breadcrumbs.getByRole('link', { name: 'Contents', exact: true }).click();
  await expect(page).toHaveURL('/blog/contents');
  await expect(breadcrumbs.locator('[aria-current="page"]')).toHaveText('Contents');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/blog/contents/ml/ml-revisit/infra');
  const infraEntries = new Set(
    POSTS.filter((post) => post.slug.startsWith('ml/ml-revisit/infra/')).map(
      (post) => post.slug.split('/')[3],
    ),
  );
  await expect(page.locator('.directory-entry')).toHaveCount(infraEntries.size);
  await page.goto('/blog/contents/ml/ml-revisit/infra/does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    '404: Existence Left as an Exercise',
  );
});

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
  await expect(page.locator('.post-title span').first()).toHaveText(
    POSTS[BLOG_CONFIG.postsPerPage]!.title,
  );
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('2');
  await expect(page).toHaveTitle(`${SITE_CONFIG.title} — Page 2`);
  await page.reload();
  await expect(page.locator('.post-title span').first()).toHaveText(
    POSTS[BLOG_CONFIG.postsPerPage]!.title,
  );

  const entry = page.locator('.post-entry').last();
  const articlePath = await entry.getAttribute('href');
  await entry.locator('.post-title').scrollIntoViewIfNeeded();
  const position = await page.evaluate(() => scrollY);
  await entry.locator('.post-title').click();
  await expect(page).toHaveURL(articlePath!);
  await expect(page.locator('#article-structured-data')).toHaveCount(1);
  expect(
    await page
      .locator('#article-structured-data')
      .evaluate((script) => JSON.parse(script.textContent!).url),
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

test('archive pages contain their own posts and metadata before JavaScript runs', async ({
  request,
  page,
}) => {
  for (const number of new Set([1, Math.min(2, archivePages), archivePages])) {
    const path = number === 1 ? '/blog' : `/blog/page/${number}`;
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const document = new JSDOM(await response.text()).window.document;
    const entries = Array.from(document.querySelectorAll('.post-entry'));
    const expected = POSTS.slice(
      (number - 1) * BLOG_CONFIG.postsPerPage,
      number * BLOG_CONFIG.postsPerPage,
    );
    expect(entries.map((entry) => entry.querySelector('.post-title span')?.textContent)).toEqual(
      expected.map((post) => post.title),
    );
    expect(document.querySelectorAll('.post-excerpt').length).toBe(
      BLOG_CONFIG.showExcerpts ? expected.filter((post) => post.excerptHtml).length : 0,
    );
    for (const [index, entry] of entries.entries()) {
      const excerpt = document.createElement('div');
      excerpt.innerHTML = BLOG_CONFIG.showExcerpts ? (expected[index]!.excerptHtml ?? '') : '';
      expect(entry.querySelector('.post-excerpt')?.innerHTML ?? '').toBe(excerpt.innerHTML);
    }
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_CONFIG.url}${path}`,
    );
    expect(document.title).toBe(`${SITE_CONFIG.title}${number > 1 ? ` — Page ${number}` : ''}`);
    expect(document.querySelectorAll('link[rel="prev"]').length).toBe(number > 1 ? 1 : 0);
    expect(document.querySelectorAll('link[rel="next"]').length).toBe(
      number < archivePages ? 1 : 0,
    );
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
