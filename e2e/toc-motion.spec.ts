import { expect } from '@playwright/test';
import { test } from './fixtures';

const articlePath = '/blog/cs/notes/modern-communication-protocols';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(articlePath);
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
});

test('a nearby chapter jump keeps its selection throughout motion and focuses only on arrival', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const link = page.locator('.post-toc-sidebar .toc-link').first();
  const id = (await link.getAttribute('data-toc-id'))!;
  const samples = await link.evaluate(async (element: HTMLAnchorElement) => {
    const samples: { y: number; selected: string | null; focused: string; moving: boolean }[] = [];
    element.click();
    const start = performance.now();
    do {
      samples.push({
        y: scrollY,
        selected:
          document
            .querySelector('.post-toc-sidebar [aria-current="location"]')
            ?.getAttribute('data-toc-id') ?? null,
        focused: document.activeElement?.id ?? '',
        moving: document.querySelector('.post-body')!.hasAttribute('data-toc-navigating'),
      });
      await new Promise(requestAnimationFrame);
    } while (performance.now() - start < 1000);
    return samples;
  });
  const traveling = samples.filter((sample) => sample.moving && sample.selected);
  expect(traveling.length).toBeGreaterThan(1);
  expect(new Set(traveling.map((sample) => sample.selected))).toEqual(new Set([id]));
  expect(traveling.every((sample) => sample.focused !== id)).toBe(true);
  expect(new Set(samples.map((sample) => sample.y)).size).toBeGreaterThan(2);
  await expect(link).toHaveAttribute('aria-current', 'location');
  // Selection is the inset marker; the row itself is not tinted.
  await expect
    .poll(() => link.evaluate((element) => getComputedStyle(element, '::before').opacity))
    .toBe('1');
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(id);
  expect(
    await page.evaluate((id) => {
      const heading = document.getElementById(id)!;
      return Math.abs(
        heading.getBoundingClientRect().top - parseFloat(getComputedStyle(heading).scrollMarginTop),
      );
    }, id),
  ).toBeLessThan(2);
});

test('a reader can interrupt a jump without late scrolling or stolen focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const position = await page
    .locator('.post-toc-sidebar .toc-link')
    .first()
    .evaluate(async (element: HTMLAnchorElement) => {
      element.click();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      document.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
      return scrollY;
    });
  await expect(page.locator('.post-body')).not.toHaveAttribute('data-toc-navigating');
  // Wait past the animation's upper bound to expose a stale completion callback.
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBe(position);
  expect(
    await page.evaluate(() => document.activeElement?.matches('.post-body h2, .post-body h3')),
  ).toBe(false);
});

test('chapter jumps reveal nested article disclosures before positioning the destination', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const link = page.locator('.post-toc-sidebar .toc-link').first();
  const id = (await link.getAttribute('data-toc-id'))!;
  await page.evaluate((id) => {
    const heading = document.getElementById(id)!;
    const outer = document.createElement('details');
    const inner = document.createElement('details');
    outer.dataset['tocFixture'] = 'outer';
    inner.dataset['tocFixture'] = 'inner';
    outer.innerHTML = '<summary>Outer navigation regression</summary>';
    inner.innerHTML = '<summary>Inner navigation regression</summary>';
    heading.before(outer);
    outer.append(inner);
    inner.append(heading);
  }, id);
  await link.click();
  await expect(page.locator('details[data-toc-fixture][open]')).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(id);
  expect(
    await page.evaluate((id) => {
      const heading = document.getElementById(id)!;
      return Math.abs(
        heading.getBoundingClientRect().top - parseFloat(getComputedStyle(heading).scrollMarginTop),
      );
    }, id),
  ).toBeLessThan(2);
});

test('rapid and repeated selections reach only the latest chapter and preserve history', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => scrollTo({ top: 300, behavior: 'instant' }));
  const links = page.locator('.post-toc-sidebar .toc-item-row > .toc-link');
  const id = (await links.nth(6).getAttribute('data-toc-id'))!;
  await links.evaluateAll((elements) => {
    (elements[0] as HTMLAnchorElement).click();
    (elements[6] as HTMLAnchorElement).click();
  });
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(id);
  await expect(page).toHaveURL(`${articlePath}#${encodeURIComponent(id)}`);
  const arrival = await page.evaluate(() => scrollY);
  const historyLength = await page.evaluate(() => history.length);
  await page.evaluate(() => scrollTo({ top: 300, behavior: 'instant' }));
  await links.nth(6).evaluate((element: HTMLAnchorElement) => element.click());
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(arrival);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await page.goBack();
  await expect(page).toHaveURL(articlePath);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(300);
});

test('the mobile sheet fades out, lands on the chapter and reopens at the current section', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dock = page.locator('.post-contents-dock');
  await dock.click();
  const dialog = page.locator('.post-toc-dialog');
  const link = dialog.locator('.toc-item-row > .toc-link').nth(6);
  const id = (await link.getAttribute('data-toc-id'))!;
  await link.scrollIntoViewIfNeeded();
  const closing = await link.evaluate(async (element: HTMLAnchorElement) => {
    const dialog = element.closest('dialog')!;
    element.click();
    await new Promise(requestAnimationFrame);
    return {
      open: dialog.open,
      closing: dialog.classList.contains('is-closing'),
      animating: dialog.getAnimations().length > 0,
    };
  });
  expect(closing).toEqual({ open: true, closing: true, animating: true });
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(id);
  await expect(dock).toBeInViewport({ ratio: 1 });
  await dock.click();
  await expect(dialog).toBeVisible();
  await expect(link).toHaveAttribute('aria-current', 'location');
  await expect
    .poll(() =>
      link.evaluate((element) => {
        const link = element.getBoundingClientRect();
        const viewport = element.closest('.toc-scroll')!.getBoundingClientRect();
        return link.top >= viewport.top && link.bottom <= viewport.bottom;
      }),
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(dock).toBeFocused();
});

test('subsection disclosure animates its flow while collapsed links immediately leave keyboard navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const chapter = page
    .locator('.post-toc-sidebar .toc-item')
    .filter({ has: page.locator('.toc-expand') })
    .first();
  const subtree = chapter.locator('.toc-subtree');
  const toggle = chapter.locator('.toc-expand');
  await expect(subtree).toHaveAttribute('inert', '');
  // Hydration initially folds the fully accessible static outline.
  await expect
    .poll(() => subtree.evaluate((element) => element.getBoundingClientRect().height))
    .toBe(0);
  const heights = await toggle.evaluate(async (element: HTMLButtonElement) => {
    const subtree = element.closest('.toc-item')!.querySelector('.toc-subtree')!;
    const heights: number[] = [subtree.getBoundingClientRect().height];
    element.click();
    const start = performance.now();
    do {
      heights.push(subtree.getBoundingClientRect().height);
      await new Promise(requestAnimationFrame);
    } while (performance.now() - start < 350);
    return heights;
  });
  expect(heights[0]).toBe(0);
  expect(new Set(heights).size).toBeGreaterThan(2);
  await expect(subtree).not.toHaveAttribute('inert');
  await toggle.click();
  await expect(subtree).toHaveAttribute('inert', '');
  await expect(subtree).toHaveAttribute('aria-hidden', 'true');
  await expect(subtree).not.toBeVisible();
});

test('the whole outline collapses smoothly without reflowing the article', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const paper = (await page.locator('.post-reading-paper').boundingBox())!;
  const toggle = page.locator('.post-toc-sidebar .toc-heading-toggle');
  const heights = await toggle.evaluate(async (element: HTMLButtonElement) => {
    const body = element.closest('.toc')!.querySelector('.toc-body')!;
    const heights: number[] = [body.getBoundingClientRect().height];
    element.click();
    const start = performance.now();
    do {
      heights.push(body.getBoundingClientRect().height);
      await new Promise(requestAnimationFrame);
    } while (heights.at(-1)! > 0 && performance.now() - start < 2000);
    return heights;
  });
  expect(heights[0]).toBeGreaterThan(100);
  expect(heights.at(-1)).toBe(0);
  expect(new Set(heights).size).toBeGreaterThan(2);
  expect(await page.locator('.post-reading-paper').boundingBox()).toEqual(paper);
  await expect(page.locator('.post-toc-sidebar .toc-body')).toHaveAttribute('inert', '');
  await toggle.click();
  await expect(page.locator('.post-toc-sidebar .toc-scroll')).toBeVisible();
  expect(await page.locator('.post-reading-paper').boundingBox()).toEqual(paper);
});

test('reduced motion keeps chapter selection, focus and disclosures without animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 900 });
  const sidebar = page.locator('.post-toc-sidebar');
  const toggle = sidebar.locator('.toc-expand').first();
  await toggle.click();
  const subtree = sidebar.locator('.toc-subtree.is-expanded').first();
  await expect(subtree).toHaveCSS('transition-duration', '0s');
  const link = subtree.locator('.toc-link').first();
  const id = (await link.getAttribute('data-toc-id'))!;
  await link.click();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(id);
  expect(await page.evaluate((id) => document.getElementById(id)!.getAnimations().length, id)).toBe(
    0,
  );
  await expect(link).toHaveAttribute('aria-current', 'location');
});
