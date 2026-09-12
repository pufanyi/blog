import { test as base, expect, type Page } from '@playwright/test';

// Navigation owns layout timing; rendering.spec.ts verifies the real engine.
export const test = base.extend<{ site: void }>({
  site: [
    async ({ page }, use) => {
      await page.route(
        /https:\/\/(www\.googletagmanager\.com|.*google-analytics\.com|giscus\.app)\//,
        (route) => route.fulfill({ body: '', contentType: 'text/javascript' }),
      );
      await page.route('**/mathjax@*/tex-chtml.js', (route) =>
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
      await use();
      expect(await page.pageErrors()).toEqual([]);
    },
    { auto: true },
  ],
});

export async function openSearch(page: Page) {
  const trigger = page.getByRole('button', { name: 'Search', exact: true });
  await trigger.click();
  const input = page.getByRole('combobox', { name: 'Search', exact: true });
  await expect(input).toBeFocused();
  return { trigger, input };
}
