import { expect } from '@playwright/test';
import { test } from './fixtures';

test('shared reading sheet aligns its outline with the title and preserves modal focus', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog/ml/ml-revisit/rl');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  const widths = testInfo.project.name === 'mobile' ? [320, 390] : [1199, 1200, 1280, 1600];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const drawer = width < 1200;
    const trigger = page.getByRole('button', { name: 'Toggle table of contents' });
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
      const paper = await page.locator('.paper').boundingBox();
      const heading = await page.locator('app-post-header .title-rule-top').boundingBox();
      expect(sidebar!.x).toBeGreaterThan(paper!.x);
      expect(sidebar!.x + sidebar!.width).toBeLessThan(heading!.x);
      expect(Math.abs(sidebar!.y - heading!.y)).toBeLessThan(1);
      await expect(container).toHaveCSS('box-shadow', 'none');
      await expect(page.locator('.post-contents-entry')).not.toBeVisible();
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

test('chapters expand independently and subsection navigation retains context and keyboard focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog/ml/ml-revisit/rl');
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

test('inline contents opens the mobile sheet and restores its trigger after Escape or resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/blog/ml/ml-revisit/rl');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  const entry = page.locator('.post-contents-entry');
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
    await page.goto(`${baseURL}/blog/ml/ml-revisit/rl`);
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
