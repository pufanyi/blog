import { execFileSync } from 'node:child_process';
import { expect } from '@playwright/test';
import { initCodeCopyButtons } from '../src/app/shared/rich-content/code-copy';
import { test } from './fixtures';

const url =
  'https://github.com/git/git/blob/c51408889c3b372814bc20b9431c3b74d0d268eb/blob.h#L8-L12';

test('GitHub code cards retain line numbers, copy text, and fit both themes', async ({
  page,
}, testInfo) => {
  const { html, text } = JSON.parse(
    execFileSync(
      process.execPath,
      ['--import', 'tsx', 'scripts/lib/fixtures/github-code/render.mts'],
      { encoding: 'utf8', env: { ...process.env, TSX_TSCONFIG_PATH: 'tsconfig.scripts.json' } },
    ),
  ) as { html: string; text: string };
  // Mount compiler output in a served article to use the production reading styles.
  // The shared copy helper is the same one attached by the reader's article runtime.
  await page.goto('/blog/cs/notes/version-control-design');
  const body = page.locator('.post-body');
  await expect(body).toHaveAttribute('data-rendered', 'true');
  const githubRequests: string[] = [];
  page.on('request', (request) => {
    if (/githubusercontent|github\.com/.test(request.url())) githubRequests.push(request.url());
  });
  await body.evaluate((element, content) => {
    element.innerHTML = content;
  }, html);
  await body.evaluate(initCodeCopyButtons);
  const card = body.locator('.github-code');
  await expect(card).toBeVisible();
  await expect(card.getByRole('link')).toHaveAttribute('href', url);
  await expect(card.locator('code')).toHaveText(text);
  await expect(card.locator('.line[data-line-number="8"]')).toContainText('struct blob');
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const dimensions = await card.evaluate((element) => ({
      right: element.getBoundingClientRect().right,
      viewport: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
      firstLine: getComputedStyle(element.querySelector('.line')!, '::before').content,
    }));
    expect(dimensions.right).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.firstLine).toBe('"8"');
    await card.screenshot({ path: testInfo.outputPath(`github-code-${theme}.png`) });
  }
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          document.body.dataset['copiedCode'] = value;
        },
      },
    });
  });
  await card.getByRole('button', { name: 'Copy code' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-copied-code', text);
  expect(githubRequests).toEqual([]);
});
