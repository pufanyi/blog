import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { expect, test } from '@playwright/test';
import type {} from '../src/app/utils/mathjax';
import { serveMathJaxWorker } from './mathjax-assets';

const root = process.cwd();
const packages = new Map([
  ['mathjax@4.1.3', resolve(root, 'node_modules/mathjax')],
  ['@mathjax/mathjax-newcm-font@4.1.3', resolve(root, 'node_modules/@mathjax/mathjax-newcm-font')],
]);

for (const article of ['ssl', 'ar']) {
  test(`real MathJax renders ${article} in both themes without page overflow`, async ({
    page,
    context,
    browserName,
  }, info) => {
    const worker = await serveMathJaxWorker();
    try {
      const assets: string[] = [];
      const failures: string[] = [];
      await context.route('https://**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.hostname !== 'cdn.jsdelivr.net' || !url.pathname.includes('mathjax')) {
          await route.fulfill({ body: '', contentType: 'text/javascript' });
          return;
        }
        assets.push(url.pathname);
        const match = [...packages].find(([name]) => url.pathname.startsWith(`/npm/${name}/`));
        if (!match) {
          failures.push(`Unpinned MathJax asset: ${url.pathname}`);
          await route.abort();
          return;
        }
        const [name, directory] = match;
        const path = resolve(
          directory,
          decodeURIComponent(url.pathname.slice(`/npm/${name}/`.length)),
        );
        if (!path.startsWith(`${directory}${sep}`))
          throw new Error('MathJax asset escaped its package');
        try {
          await route.fulfill({
            body: path.endsWith('/tex-chtml.js')
              ? Buffer.concat([
                  Buffer.from(
                    `window.MathJax.options = { ...window.MathJax.options, worker: { path: ${JSON.stringify(worker.url)}, maps: ${JSON.stringify(worker.url + '/mathmaps')} } };\n`,
                  ),
                  await readFile(path),
                ])
              : await readFile(path),
            contentType: path.endsWith('.woff2') ? 'font/woff2' : 'text/javascript',
            headers: { 'Access-Control-Allow-Origin': '*' },
          });
        } catch (error) {
          failures.push(`${path}: ${error}`);
          await route.abort();
        }
      });
      const widths = browserName === 'webkit' ? [1280, 390] : [page.viewportSize()!.width];
      // Each viewport performs a cold render, including the real speech queue.
      test.setTimeout(30_000 * widths.length);
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/blog/ml/ml-revisit/${article}`);
        await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
        await page.waitForFunction(
          () => document.querySelectorAll('.post-body mjx-container').length > 20,
        );
        // Join the existing queue without scheduling another typesetting pass.
        await page.evaluate(async () => {
          await window.MathJax!.whenReady!(() => undefined);
          await document.fonts.ready;
        });
        await expect(page.locator('mjx-merror, [data-mjx-error]')).toHaveCount(0);
        expect(
          await page.evaluate(() =>
            [...document.fonts]
              .filter((font) => font.status === 'error' && /MJX|MathJax/.test(font.family))
              .map((font) => font.family),
          ),
        ).toEqual([]);
        expect(await page.locator('mjx-utext').allTextContents()).not.toEqual(
          expect.arrayContaining([expect.stringMatching(/\\[A-Za-z]+/)]),
        );
        await page.addStyleTag({
          content:
            '*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }',
        });
        for (const theme of ['light', 'dark']) {
          if ((await page.locator('html').getAttribute('data-theme')) !== theme)
            await page.getByRole('button', { name: 'Toggle theme' }).click();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          if (article === 'ar') {
            const diagram = page.locator('.made-diagram-shell');
            await diagram.scrollIntoViewIfNeeded();
            const labels = await page
              .locator('.made-diagram-math mjx-container')
              .evaluateAll((elements) =>
                elements.map((element) => {
                  const math = element.getBoundingClientRect();
                  const host = element.closest('foreignObject')!.getBoundingClientRect();
                  return {
                    width: math.width,
                    height: math.height,
                    dx: Math.abs((math.left + math.right - host.left - host.right) / 2),
                    dy: Math.abs((math.top + math.bottom - host.top - host.bottom) / 2),
                  };
                }),
              );
            expect(labels.length).toBeGreaterThan(5);
            for (const label of labels) {
              expect(label.width).toBeGreaterThan(0);
              expect(label.height).toBeGreaterThan(0);
              expect(label.dx).toBeLessThan(3);
              expect(label.dy).toBeLessThan(3);
            }
            const screenshot = info.outputPath(`made-${width}-${theme}.png`);
            await diagram.screenshot({ path: screenshot });
            await info.attach(`made-${width}-${theme}`, {
              path: screenshot,
              contentType: 'image/png',
            });
          }
        }
      }
      expect(assets.some((path) => path.endsWith('/tex-chtml.js'))).toBe(true);
      expect(assets.some((path) => path.endsWith('.woff2'))).toBe(true);
      expect(failures).toEqual([]);
      expect(await page.pageErrors()).toEqual([]);
      expect(worker.requests).toContain('/speech-worker.js');
    } finally {
      await worker.close();
    }
  });
}
