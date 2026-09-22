import { expect } from '@playwright/test';
import { test } from './fixtures';

test('Material outline keeps large destinations, independent scrolling and modal focus', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog/ml/ml-revisit/rl');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  const widths = testInfo.project.name === 'mobile' ? [320, 390] : [1280, 1480, 1600];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const drawer = width < 1480;
    const trigger = page.getByRole('button', { name: 'Toggle table of contents' });
    if (drawer) await trigger.click();
    const container = page.locator(drawer ? '.post-toc-dialog' : '.post-toc-sidebar');
    await expect(container).toBeVisible();
    const geometry = await container.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const scroll = element.querySelector('.toc-scroll')!;
      return {
        fits: bounds.left >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight,
        targets: [...element.querySelectorAll('.toc-link')].every(
          (link) => link.getBoundingClientRect().height >= 48,
        ),
        scrolls: scroll.scrollHeight > scroll.clientHeight,
      };
    });
    expect(geometry).toEqual({ fits: true, targets: true, scrolls: true });
    if (!drawer) {
      const sidebar = await container.boundingBox();
      const paper = await page.locator('.paper').boundingBox();
      expect(sidebar!.x + sidebar!.width).toBeLessThan(paper!.x);
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

test('Material directory rows remain readable in narrow screens and both themes', async ({
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
