import { expect } from '@playwright/test';
import { test } from './fixtures';

for (const path of ['/blog/cs/notes/version-control-design', '/docs/writing/first-post']) {
  test(`code padding and copied newlines are preserved on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
    const block = page.locator('.code-block').first();
    await expect(block).toBeVisible();
    const source = await block.locator('code').textContent();
    expect(source).toBeTruthy();
    expect(source!.endsWith('\n')).toBe(path.startsWith('/blog/'));

    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.getByRole('button', { name: 'Toggle theme' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const spacing = await block.locator('pre').evaluate((pre) => {
        const lines = [...pre.querySelectorAll<HTMLElement>('.line')].filter((line) =>
          line.textContent?.trim(),
        );
        const box = pre.getBoundingClientRect();
        return {
          top: lines[0].getBoundingClientRect().top - box.top,
          bottom: box.bottom - lines.at(-1)!.getBoundingClientRect().bottom,
        };
      });
      expect(Math.abs(spacing.bottom - spacing.top)).toBeLessThanOrEqual(1);
    }

    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            document.body.dataset['copiedCode'] = text;
          },
        },
      });
    });
    await block.getByRole('button', { name: 'Copy code' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-copied-code', source!);
  });
}
