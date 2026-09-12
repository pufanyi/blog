import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { JSDOM } from 'jsdom';

// Decoded response bytes. Baselines are measured on the served production build;
// 10% headroom makes growth visible without treating host timings as an SLA.
const baselines = {
  '/': { code: 466_159, html: 85_163, styles: 70_617 },
  '/blog': { code: 590_430, html: 95_147, styles: 71_166 },
  '/blog/oi-icpc/codeforces/cf551c': { code: 718_922, html: 137_695, styles: 90_106 },
};
const searchBaseline = 1_482_726;
const limit = (baseline: number) => Math.ceil(baseline * 1.1);

for (const [path, baseline] of Object.entries(baselines)) {
  test(`cold production resource budget: ${path}`, async ({ page, context, baseURL }, info) => {
    const resources: { path: string; bytes: number; type: string }[] = [];
    const pending: Promise<void>[] = [];
    // Context events include worker requests, unlike window resource timing.
    context.on('response', (response) => {
      const type = response.request().resourceType();
      if (
        !response.url().startsWith(`${baseURL}/`) ||
        !['script', 'stylesheet', 'fetch', 'xhr'].includes(type)
      )
        return;
      pending.push(
        response.body().then((body) => {
          resources.push({ path: new URL(response.url()).pathname, bytes: body.length, type });
        }),
      );
    });
    await context.route('https://**/*', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: route.request().url().includes('/mathjax@')
          ? 'window.MathJax={startup:{promise:Promise.resolve()},typesetPromise:async()=>{},typesetClear:()=>{}};'
          : '',
      }),
    );
    const response = await page.goto(path);
    const html = await response!.text();
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    if (path.includes('/blog/'))
      await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
    await Promise.all(pending);
    const dom = new JSDOM(html);
    const styles = [...dom.window.document.querySelectorAll('style')].reduce(
      (sum, style) => sum + Buffer.byteLength(style.textContent ?? ''),
      0,
    );
    dom.window.close();
    const initial = [...resources];
    const code = initial.reduce((sum, resource) => sum + resource.bytes, 0);
    let search;
    if (path === '/') {
      const start = performance.now();
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      const input = page.getByRole('combobox', { name: 'Search', exact: true });
      await expect(input).toBeFocused();
      const openMs = performance.now() - start;
      await input.fill('模型');
      await expect(page.getByRole('option').first()).toBeVisible();
      const coldReadyMs = performance.now() - start;
      await Promise.all(pending);
      const coldResources = resources.slice(initial.length);
      const warmStart = performance.now();
      await input.fill('attention');
      await expect(page.getByRole('option').first()).toContainText('Attention');
      const warmQueryMs = performance.now() - warmStart;
      await Promise.all(pending);
      expect(resources.length).toBe(initial.length + coldResources.length);
      search = {
        bytes: coldResources.reduce((sum, resource) => sum + resource.bytes, 0),
        openMs,
        coldReadyMs,
        warmQueryMs,
        resources: coldResources,
      };
    }
    const report = {
      path,
      code,
      html: Buffer.byteLength(html),
      styles,
      search,
      resources: initial,
    };
    const json = JSON.stringify(report, null, 2);
    await writeFile(info.outputPath('resources.json'), json);
    await info.attach('resources', { body: json, contentType: 'application/json' });
    console.log(
      JSON.stringify({
        path,
        code,
        html: report.html,
        styles,
        search: search && { ...search, resources: undefined },
      }),
    );
    expect(code).toBeGreaterThan(0);
    expect(code).toBeLessThanOrEqual(limit(baseline.code));
    expect(report.html).toBeLessThanOrEqual(limit(baseline.html));
    expect(styles).toBeLessThanOrEqual(limit(baseline.styles));
    if (search) {
      expect(search.bytes).toBeGreaterThan(0);
      expect(search.bytes).toBeLessThanOrEqual(limit(searchBaseline));
    }
  });
}
