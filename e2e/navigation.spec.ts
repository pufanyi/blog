import { expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { BLOG_CONFIG } from '../src/app/data/blog-config';
import { POSTS } from '../src/app/data/posts';
import { SITE_CONFIG } from '../src/app/data/site-config';
import { openSearch, test } from './fixtures';

const archivePages = Math.max(1, Math.ceil(POSTS.length / BLOG_CONFIG.postsPerPage));

test('full-width toolbar stays flush with the top and clear of page content', async ({
  page,
}, testInfo) => {
  await page.goto('/blog/ml/ml-revisit/rl');
  const toolbar = page.locator('app-toolbar');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  const widths = testInfo.project.name === 'mobile' ? [320, 390, 600, 601, 768] : [769, 1280, 1600];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await expect(toolbar.getByRole('button', { name: 'Search', exact: true })).toBeVisible();
    const geometry = await toolbar.evaluate((element) => {
      const header = element.querySelector('header')!.getBoundingClientRect();
      const navigation = element.querySelector('.toolbar-nav')!.getBoundingClientRect();
      const actions = element.querySelector('.toolbar-actions')!.getBoundingClientRect();
      const leftGap = navigation.left;
      const rightGap = document.documentElement.clientWidth - actions.right;
      const paper = document.querySelector('.paper')!.getBoundingClientRect();
      const controls = Array.from(element.querySelectorAll('a, button')).filter(
        (control) => control.getBoundingClientRect().width > 0,
      );
      return {
        fullWidth:
          Math.abs(header.left) < 1 &&
          Math.abs(header.right - document.documentElement.clientWidth) < 1,
        flushTop: header.top === 0,
        edgeGroups:
          leftGap >= 12 &&
          leftGap <= 32 &&
          rightGap >= 12 &&
          rightGap <= 32 &&
          Math.abs(leftGap - rightGap) < 1,
        fits: controls.every((control) => {
          const box = control.getBoundingClientRect();
          return (
            box.width >= 44 &&
            box.height >= 44 &&
            box.left >= 0 &&
            box.right <= innerWidth &&
            box.top >= header.top &&
            box.bottom <= header.bottom &&
            control.contains(
              document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2),
            )
          );
        }),
        clearsHeading: document.querySelector('h1')!.getBoundingClientRect().top > header.bottom,
        clearsPaper: paper.top > header.bottom,
      };
    });
    expect(geometry).toEqual({
      fullWidth: true,
      flushTop: true,
      edgeGroups: true,
      fits: true,
      clearsHeading: true,
      clearsPaper: true,
    });
    for (const reducedMotion of ['reduce', 'no-preference'] as const) {
      await page.emulateMedia({ reducedMotion });
      expect((await toolbar.locator('header').boundingBox())!.height).toBe(width <= 768 ? 52 : 56);
    }
    if (width > 768) {
      await expect(toolbar.locator('.toolbar-nav .toolbar-avatar')).toBeVisible();
      await expect(toolbar.locator('.toolbar-nav .toolbar-brand .toolbar-label')).toBeVisible();
      await expect(toolbar.getByRole('link', { name: 'Blog', exact: true })).toHaveCSS(
        'box-shadow',
        'none',
      );
    }
    await expect(toolbar.getByRole('link', { name: 'Blog', exact: true })).not.toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );
    if (width < 1200) {
      await expect(toolbar.getByRole('button', { name: 'Toggle table of contents' })).toBeVisible();
    } else {
      const sidebar = await page.locator('.post-toc-sidebar').boundingBox();
      const header = await toolbar.locator('header').boundingBox();
      expect(sidebar!.y).toBeGreaterThan(header!.y + header!.height);
    }
  }
  await toolbar.getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page).toHaveURL('/blog');
  await expect(toolbar.getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(toolbar.getByRole('button', { name: 'Toggle table of contents' })).toHaveCount(0);
  await page.setViewportSize({
    width: testInfo.project.name === 'mobile' ? 390 : 1280,
    height: 900,
  });
  await page.screenshot({ path: testInfo.outputPath('toolbar-light.png'), animations: 'disabled' });
  await toolbar.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: testInfo.outputPath('toolbar-dark.png'), animations: 'disabled' });
  await page.emulateMedia({ media: 'print' });
  await expect(toolbar).not.toBeVisible();
});

test('toolbar controls stay at the same edges across article and documentation widths', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/blog/cs/notes/modern-communication-protocols');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  const toolbar = page.locator('.toolbar');
  const home = toolbar.getByRole('link', { name: 'Home', exact: true });
  const theme = toolbar.getByRole('button', { name: 'Toggle theme' });
  const articleHome = (await home.boundingBox())!;
  const articleTheme = (await theme.boundingBox())!;
  const articlePaper = (await page.locator('.paper').boundingBox())!;
  await page.goto('/docs');
  await expect(page.locator('.docs-body')).toHaveAttribute('data-rendered', 'true');
  expect((await page.locator('.paper').boundingBox())!.width).toBeGreaterThan(articlePaper.width);
  expect((await home.boundingBox())!.x).toBe(articleHome.x);
  expect((await theme.boundingBox())!.x).toBe(articleTheme.x);
});

test('toolbar covers the top safe area and keeps anchor targets below its controls', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog/ml/ml-revisit/rl');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await page.addStyleTag({ content: 'html { --toolbar-safe-area-top: 24px; }' });
  const header = page.locator('.toolbar');
  const bounds = (await header.boundingBox())!;
  expect(bounds.y).toBe(0);
  expect(bounds.height).toBe((page.viewportSize()!.width <= 768 ? 52 : 56) + 24);
  const controls = await header.locator('a, button').evaluateAll((elements) =>
    elements
      .filter((element) => element.getBoundingClientRect().width > 0)
      .map((element) => {
        const box = element.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom };
      }),
  );
  for (const control of controls) {
    expect(control.top).toBeGreaterThanOrEqual(24);
    expect(control.bottom).toBeLessThanOrEqual(bounds.height);
  }
  expect((await page.locator('.paper').boundingBox())!.y).toBeGreaterThan(bounds.height);
  await page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>('.post-body #references')!;
    heading.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await expect
    .poll(async () => (await page.locator('.post-body #references').boundingBox())!.y)
    .toBeGreaterThan(bounds.height);
  expect((await header.boundingBox())!.y).toBe(0);
});

test('a directly opened article offers navigation back to the blog', async ({ page }) => {
  await page.goto('/blog/oi-icpc/codeforces/cf551c');
  await expect(page.locator('app-toolbar').getByRole('link', { name: 'Blog' })).toBeVisible();
  await expect(
    page.locator('app-toolbar').getByRole('link', { name: 'Documentation' }),
  ).toHaveCount(0);
});

test('a stale lazy chunk reloads the destination with current assets', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One browser covers shared recovery behavior');
  await page.goto('/blog/contents/oi-icpc/codeforces');
  const { input } = await openSearch(page);
  await input.press('Escape');
  const destination = '/blog/oi-icpc/codeforces/cf551c';
  const contentChunk = await page.evaluate(async () => {
    const source = document.querySelector<HTMLScriptElement>('script[src^="main-"]')?.src;
    if (!source) throw new Error('Main application module was not found');
    const main = await fetch(source).then((response) => response.text());
    const marker = '`oi-icpc/codeforces/cf551c`,()=>import(`./';
    const start = main.indexOf(marker);
    const end = main.indexOf('`', start + marker.length);
    if (start < 0 || end < 0) throw new Error('Article content chunk was not found');
    return main.slice(start + marker.length, end);
  });
  let failedModule = false;
  let destinationDocuments = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest() && new URL(request.url()).pathname === destination)
      destinationDocuments += 1;
  });
  await page.route(
    `**/${contentChunk}`,
    async (route) => {
      failedModule = true;
      await route.fulfill({
        status: 404,
        contentType: 'text/javascript',
        body: '/* removed by a newer deployment */',
      });
    },
    { times: 1 },
  );
  await page.locator(`a.directory-entry[href="${destination}"]`).click();
  await expect(page).toHaveURL(destination);
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  expect(failedModule).toBe(true);
  expect(destinationDocuments).toBe(1);
});

test('slow article navigation gives feedback until its content arrives', async ({ page }) => {
  await page.goto('/blog/contents/oi-icpc/codeforces');
  // Wait for hydration before holding subsequent lazy route and body requests.
  const { input } = await openSearch(page);
  await input.press('Escape');
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/*.js', async (route) => {
    await pending;
    await route.continue();
  });
  try {
    const link = page.locator('a.directory-entry[href="/blog/oi-icpc/codeforces/cf551c"]');
    await link.focus();
    await link.press('Enter');
    await expect(page.locator('.navigation-progress')).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('codeforces');
  } finally {
    release();
  }
  await expect(page).toHaveURL('/blog/oi-icpc/codeforces/cf551c');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.locator('.navigation-progress')).toHaveCount(0);
});

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
  // Playwright can scroll again while positioning the click below the toolbar.
  const positionAtClick = page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        document.addEventListener('click', () => resolve(scrollY), { once: true, capture: true });
      }),
  );
  await entry.locator('.post-title').click();
  const position = await positionAtClick;
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
