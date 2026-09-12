import { expect } from '@playwright/test';
import { POSTS } from '../src/app/data/posts';
import { openSearch, test } from './fixtures';

const autoregressive = POSTS.find((post) => post.slug === 'ml/ml-revisit/ar')!;

const diffusion = POSTS.find((post) => post.slug === 'ml/ml-revisit/diffusion')!;

test('code inside details keeps its layout, scrolling and copy behavior', async ({
  page,
  context,
  isMobile,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/blog/oi-icpc/codeforces/cf551c');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; scroll-behavior: auto !important; }',
  });
  // Keep the actual rendered code and its attached copy handler, while making
  // disclosure placement independent of editorial changes to an article.
  await page
    .locator('.post-body .code-block')
    .first()
    .evaluate((block) => {
      block
        .querySelector('code')!
        .append(document.createTextNode(`\n// ${'wide code fixture '.repeat(24)}`));
      const details = document.createElement('details');
      details.dataset['readingFixture'] = 'code';
      details.innerHTML =
        '<summary>Code disclosure regression</summary><div class="details-content"></div>';
      block.before(details);
      details.lastElementChild!.append(block);
    });
  const details = page.locator('details[data-reading-fixture="code"]');
  const summary = details.locator(':scope > summary');
  const block = details.locator('.code-block').first();
  const pre = block.locator('pre');
  const source = await pre.locator('code').textContent();
  await expect(block).toBeHidden();
  await summary.scrollIntoViewIfNeeded();
  await summary.focus();
  await summary.press('Enter');
  await expect(block).toBeVisible();

  for (const theme of ['light', 'dark']) {
    if ((await page.locator('html').getAttribute('data-theme')) !== theme) {
      await page.getByRole('button', { name: 'Toggle theme' }).click();
    }
    await block.scrollIntoViewIfNeeded();
    // The header and code background should meet the frame, with the disclosure
    // providing space outside that frame instead of inserting strips inside it.
    const gaps = await block.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const left = bounds.left + parseFloat(style.borderLeftWidth);
      const right = bounds.right - parseFloat(style.borderRightWidth);
      const header = element.querySelector('.code-header')!.getBoundingClientRect();
      const code = element.querySelector('pre')!.getBoundingClientRect();
      return [
        header.left - left,
        right - header.right,
        code.left - left,
        right - code.right,
        code.top - header.bottom,
      ];
    });
    for (const gap of gaps) expect(Math.abs(gap)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (isMobile) {
      await pre.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
      });
      expect(await pre.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      await pre.evaluate((element) => {
        element.scrollLeft = 0;
      });
    }
  }
  await block.getByRole('button', { name: 'Copy code' }).click();
  await expect(block.getByRole('button', { name: 'Copy code' })).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
  await summary.scrollIntoViewIfNeeded();
  await summary.click();
  await expect(block).toBeHidden();
  await summary.click();
  await expect(block).toBeVisible();
  await expect(pre.locator('code')).toHaveText(source!);
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
      heading.evaluate((element) =>
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

test('home and search do not download article bodies or MathJax; reading loads one body', async ({
  page,
  baseURL,
}) => {
  const scripts: Promise<string>[] = [];
  let mathRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/mathjax@')) mathRequests++;
  });
  page.on('response', (response) => {
    if (response.url().startsWith(`${baseURL}/`) && response.request().resourceType() === 'script')
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
  expect((await Promise.all(scripts)).filter((script) => /contentHtml:/.test(script))).toHaveLength(
    1,
  );
  expect(mathRequests).toBe(1);
});

for (const layout of ['sidebar', 'drawer'] as const) {
  test(`long table of contents scrolls to its final section in the ${layout}`, async ({ page }) => {
    await page.setViewportSize({
      width: layout === 'sidebar' ? 1600 : page.viewportSize()!.width,
      height: 560,
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/blog/ml/ml-revisit/rl');
    await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
    await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
    if (layout === 'drawer') {
      await page.getByRole('button', { name: 'Toggle table of contents' }).click();
    }
    const panel = page.locator(layout === 'sidebar' ? '.post-toc-sidebar' : '.toc-drawer');
    const viewport = panel.locator('.toc-scroll');
    const header = panel.locator('.toc-header');
    const headerTop = await header.evaluate((element) => element.getBoundingClientRect().top);
    const pageTop = await page.evaluate(() => scrollY);

    // A clipped, content-sized list cannot scroll even though its outer panel fits.
    expect(await viewport.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
      true,
    );
    expect(
      await viewport.evaluate((element) => element.getBoundingClientRect().bottom <= innerHeight),
    ).toBe(true);
    await viewport.hover();
    await page.mouse.wheel(0, 10000);
    await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const finalLink = panel.locator('.toc-link').last();
    await expect(finalLink).toBeInViewport({ ratio: 1 });
    expect(await header.evaluate((element) => element.getBoundingClientRect().top)).toBe(headerTop);
    expect(await page.evaluate(() => scrollY)).toBe(pageTop);

    const id = await finalLink.getAttribute('data-toc-id');
    await finalLink.focus();
    await finalLink.press('Enter');
    await expect
      .poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1))))
      .toBe(id);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(id);
    if (layout === 'drawer') {
      await expect(
        page.getByRole('dialog', { name: 'Table of contents', exact: true }),
      ).not.toBeVisible();
    }
  });
}
