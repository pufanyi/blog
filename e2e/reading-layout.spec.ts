import { expect } from '@playwright/test';
import { test } from './fixtures';

test('independent article paper keeps the outline outside and aligned with its title', async ({
  page,
}, testInfo) => {
  const widths = testInfo.project.name === 'mobile' ? [320, 390] : [1023, 1024, 1100, 1280, 1600];
  // Each viewport reflows the full long article and exercises both themes.
  testInfo.setTimeout(15_000 * widths.length);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog/ml/ml-revisit/diffusion');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const drawer = width < 1024;
    const trigger = page.getByRole('button', { name: 'Open table of contents' });
    if (drawer) await trigger.click();
    const container = page.locator(drawer ? '.post-toc-dialog' : '.post-toc-sidebar');
    await expect(container).toBeVisible();
    const geometry = await container.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const scroll = element.querySelector('.toc-scroll')!;
      return {
        fits: bounds.left >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight,
        linksFit: [...element.querySelectorAll('.toc-link')]
          .filter((link) => link.getBoundingClientRect().height > 0)
          .every((link) => {
            const rect = link.getBoundingClientRect();
            return rect.width > 0 && rect.left >= bounds.left && rect.right <= bounds.right;
          }),
        independentScroll: getComputedStyle(scroll).overflowY === 'auto',
      };
    });
    expect(geometry).toEqual({ fits: true, linksFit: true, independentScroll: true });
    if (!drawer) {
      const sidebar = await container.boundingBox();
      const paper = await page.locator('.post-reading-paper').boundingBox();
      const heading = await page.locator('app-post-header .title-rule-top').boundingBox();
      expect(paper!.x - sidebar!.x - sidebar!.width).toBeCloseTo(40, 0);
      expect(paper!.width).toBeLessThanOrEqual(900);
      expect(heading!.x).toBeGreaterThan(paper!.x);
      if (width === 1600) {
        expect(paper!.width).toBe(900);
        expect(paper!.x + paper!.width / 2).toBe(width / 2);
      }
      expect(Math.abs(sidebar!.y - heading!.y)).toBeLessThan(1);
      await expect(page.locator('.paper')).toHaveCSS('box-shadow', 'none');
      await expect(page.locator('.paper')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(page.locator('.post-reading-paper')).not.toHaveCSS('box-shadow', 'none');
      await expect(container).toHaveCSS('box-shadow', 'none');
      await expect(page.locator('.post-contents-dock')).not.toBeVisible();
    }
    for (const theme of ['light', 'dark']) {
      await page.evaluate(
        (value) => document.documentElement.setAttribute('data-theme', value),
        theme,
      );
      if (width === 390 || width === 1600) {
        await page.screenshot({
          path: testInfo.outputPath(`outline-${width}-${theme}.png`),
          animations: 'disabled',
          scale: 'css',
        });
      }
    }
    if (drawer) {
      await page.keyboard.press('Escape');
      await expect(container).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('articles without an outline retain one centered paper on every screen', async ({ page }) => {
  await page.goto('/blog/oi-icpc/other-problems/integer-break');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await expect(page.locator('.post-reading-layout')).not.toHaveClass(/has-outline/);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.paper')).not.toHaveCSS('box-shadow', 'none');
    await expect(page.locator('.post-reading-paper')).toHaveCSS('box-shadow', 'none');
    await expect(page.locator('.post-reading-paper')).toHaveCSS('padding', '0px');
    await expect(page.locator('.post-contents-dock')).toHaveCount(0);
    const paper = (await page.locator('.paper').boundingBox())!;
    expect(Math.abs(paper.x + paper.width / 2 - width / 2)).toBeLessThan(1);
  }
});

test('chapters expand independently and subsection navigation retains context and keyboard focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog/ml/ml-revisit/diffusion');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  const panel = page.locator('.post-toc-sidebar');
  const chapter = panel
    .locator('.toc-item')
    .filter({ has: page.locator('.toc-expand') })
    .first();
  const toggle = chapter.locator('.toc-expand');
  const children = chapter.locator('.toc-sublist');
  await expect(children).not.toBeVisible();
  const before = await page.evaluate(() => scrollY);
  await toggle.focus();
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(children).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(before);
  const link = children.locator('.toc-link').first();
  const id = (await link.getAttribute('data-toc-id'))!;
  const text = (await link.textContent())!.trim();
  await link.click();
  await expect(page.locator('.toolbar-context')).toHaveText(text);
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(id);
  await expect(link).toHaveAttribute('aria-current', 'location');
  expect((await panel.boundingBox())!.y).toBeGreaterThanOrEqual(
    (await page.locator('.toolbar').boundingBox())!.height,
  );
  await toggle.click();
  await expect(children).not.toBeVisible();
  await expect(chapter.locator('.toc-item-row > .toc-link')).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(page.locator('.toolbar-context')).toHaveText(text);
});

test('persistent contents opens the mobile sheet and restores its trigger after Escape or resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/blog/ml/ml-revisit/diffusion');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  const entry = page.locator('.post-contents-dock');
  const dialog = page.getByRole('dialog', { name: 'Table of contents', exact: true });
  await entry.click();
  await expect(dialog).toBeVisible();
  await expect(entry).toHaveAttribute('aria-expanded', 'true');
  const bounds = (await dialog.boundingBox())!;
  expect(Math.abs(bounds.y + bounds.height - 844)).toBeLessThan(1);
  expect(bounds.height).toBeLessThanOrEqual(844 * 0.86 + 1);
  for (const box of await dialog
    .locator('.toc-expand')
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().toJSON()),
    )) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press('Escape');
  await expect(entry).toBeFocused();
  await expect(entry).toHaveAttribute('aria-expanded', 'false');
  await entry.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.post-toc-sidebar')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(entry).toHaveAttribute('aria-expanded', 'false');
  await entry.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
});

test('the wide outline remains reachable at the page end and can collapse without moving the text', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog/ml/ml-revisit/diffusion');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  const sidebar = page.locator('.post-toc-sidebar');
  const headerBottom = (await page.locator('.toolbar').boundingBox())!.height;
  for (const fraction of [0.5, 1]) {
    await page.evaluate(
      (value) =>
        scrollTo({
          top: (document.documentElement.scrollHeight - innerHeight) * value,
          behavior: 'instant',
        }),
      fraction,
    );
    await expect(sidebar).toHaveClass(/is-pinned/);
    await expect.poll(async () => (await sidebar.boundingBox())!.y).toBeGreaterThan(headerBottom);
    const bounds = (await sidebar.boundingBox())!;
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
    const host = (await page.locator('app-post-navigation').boundingBox())!;
    expect(Math.abs(bounds.x - host.x)).toBeLessThan(1);
    expect(Math.abs(bounds.width - host.width)).toBeLessThan(1);
  }
  const textBefore = (await page.locator('.post-body').boundingBox())!;
  const paperBefore = (await page.locator('.post-reading-paper').boundingBox())!;
  const scrollBefore = await page.evaluate(() => scrollY);
  const toggle = sidebar.locator('.toc-heading-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(sidebar.locator('.toc-scroll')).not.toBeVisible();
  await expect(sidebar.locator('.toc-collapsed-context')).toBeVisible();
  await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  expect(await page.locator('.post-body').boundingBox()).toEqual(textBefore);
  expect(await page.locator('.post-reading-paper').boundingBox()).toEqual(paperBefore);
  await toggle.press('Enter');
  await expect(sidebar.locator('.toc-scroll')).toBeVisible();
  const firstLink = sidebar.locator('.toc-link').first();
  const firstId = await firstLink.getAttribute('data-toc-id');
  await firstLink.click();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(firstId);
  await page.evaluate(() => {
    const anchor = document.querySelector('.post-outline-anchor')!;
    const panel = document.querySelector('.post-toc-sidebar')!;
    const start = anchor.getBoundingClientRect().top + scrollY;
    const clearance = parseFloat(getComputedStyle(panel).top);
    scrollTo({ top: Math.ceil(start - clearance), behavior: 'instant' });
  });
  await expect(sidebar).not.toHaveClass(/is-pinned/);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(sidebar).not.toHaveClass(/is-pinned/);
  const heading = (await page.locator('app-post-header .title-rule-top').boundingBox())!;
  expect(Math.abs((await sidebar.boundingBox())!.y - heading.y)).toBeLessThan(1);
  await page.evaluate(() =>
    scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  );
  await expect(sidebar).toHaveClass(/is-pinned/);
  await page.screenshot({ path: info.outputPath('outline-page-end.png'), animations: 'disabled' });
});

test('the mobile contents dock stays visible through reading and never covers the last content', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog/ml/ml-revisit/diffusion');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  const dock = page.locator('.post-contents-dock');
  for (const fraction of [0, 0.5, 1]) {
    await page.evaluate(
      (value) =>
        scrollTo({
          top: (document.documentElement.scrollHeight - innerHeight) * value,
          behavior: 'instant',
        }),
      fraction,
    );
    await expect(dock).toBeInViewport({ ratio: 1 });
    const bounds = (await dock.boundingBox())!;
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.y + bounds.height).toBe(844);
  }
  const dockTop = (await dock.boundingBox())!.y;
  const footer = (await page.locator('.footer').boundingBox())!;
  expect(footer.y + footer.height).toBeLessThanOrEqual(dockTop);
  // The floating control would cover body text; the dock provides its own.
  await expect(page.locator('app-back-to-top.is-wide-only')).toBeHidden();
  const backToTop = page.locator('.post-reading-dock').getByRole('button', { name: 'Back to top' });
  await expect(backToTop).toBeInViewport({ ratio: 1 });
  const backToTopBox = (await backToTop.boundingBox())!;
  expect(backToTopBox.width).toBeGreaterThanOrEqual(44);
  expect(backToTopBox.height).toBeGreaterThanOrEqual(44);
  await dock.click();
  const dialog = page.getByRole('dialog', { name: 'Table of contents', exact: true });
  const firstLink = dialog.locator('.toc-link').first();
  const firstId = await firstLink.getAttribute('data-toc-id');
  const firstTitle = (await firstLink.locator('span').last().textContent())!.trim();
  await firstLink.click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(firstId);
  await expect(dock.locator('.contents-dock-context')).toHaveText(firstTitle);
  await expect(dock).toBeInViewport({ ratio: 1 });
  await page.screenshot({
    path: info.outputPath('contents-dock-reading.png'),
    animations: 'disabled',
  });
  await backToTop.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.emulateMedia({ media: 'print' });
  await expect(dock).not.toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.locator('app-toolbar').getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(dock).toHaveCount(0);
  await expect(page.locator('body')).toHaveCSS('padding-bottom', '0px');
});

test('without JavaScript the wide outline retains every chapter and subsection link', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1280, height: 900 },
  });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/blog/ml/ml-revisit/diffusion`);
    await expect(page.locator('.post-toc-sidebar')).toBeVisible();
    expect(
      await page.locator('.post-toc-sidebar .toc-sublist:not([hidden])').count(),
    ).toBeGreaterThan(0);
    await expect(page.locator('.post-toc-sidebar .toc-sublist[hidden]')).toHaveCount(0);
    expect(await page.locator('.post-toc-sidebar .toc-link').count()).toBe(
      await page.locator('.post-body h2[id], .post-body h3[id]').count(),
    );
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.post-toc-sidebar')).not.toBeVisible();
    await expect(page.locator('.post-reading-layout')).toHaveCSS('display', 'block');
    await expect(page.locator('.post-reading-paper')).toHaveCSS('display', 'block');
    await expect(page.locator('.post-reading-paper')).toHaveCSS('box-shadow', 'none');
  } finally {
    await context.close();
  }
});

test('directory rows remain readable in narrow screens and both themes', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of testInfo.project.name === 'mobile' ? [320, 390] : [1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/blog/contents', '/blog/contents/oi-icpc/codeforces']) {
      await page.goto(path);
      await expect(page.locator('.directory-entry').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      for (const theme of ['light', 'dark']) {
        await page.evaluate(
          (value) => document.documentElement.setAttribute('data-theme', value),
          theme,
        );
        await page.screenshot({
          path: testInfo.outputPath(
            `directory-${path.endsWith('contents') ? 'folders' : 'posts'}-${width}-${theme}.png`,
          ),
          animations: 'disabled',
          scale: 'css',
        });
      }
    }
  }
});
