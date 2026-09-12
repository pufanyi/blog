import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { test as base, expect } from '@playwright/test';
import type {} from '../src/app/utils/mathjax';
import { serveMathJaxWorker } from './mathjax-assets';

const test = base.extend<{ mathWorker: string }>({
  // Playwright requires destructuring even when a fixture has no dependencies.
  // eslint-disable-next-line no-empty-pattern
  mathWorker: async ({}, use) => {
    const worker = await serveMathJaxWorker();
    try {
      await use(worker.url);
    } finally {
      await worker.close();
    }
  },
});

const resolveDependency = createRequire(join(process.cwd(), 'package.json'));
const mathjaxPackage = resolveDependency.resolve('mathjax/package.json');
const fontPackage = createRequire(mathjaxPackage).resolve(
  '@mathjax/mathjax-newcm-font/package.json',
);
const packages = [mathjaxPackage, fontPackage].map((path) => {
  const { name, version } = JSON.parse(readFileSync(path, 'utf8')) as {
    name: string;
    version: string;
  };
  return { name, version, root: dirname(path) };
});

test.beforeEach(async ({ page, context, mathWorker }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Exercise the exact CDN renderer and fonts without relying on a CDN in CI.
  await context.route('https://cdn.jsdelivr.net/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const dependency = packages.find(({ name, version }) =>
      path.startsWith(`/npm/${name}@${version}/`),
    );
    if (!dependency) throw new Error(`Unpinned MathJax resource: ${path}`);
    const asset = path.slice(`/npm/${dependency.name}@${dependency.version}/`.length);
    await route.fulfill({
      body:
        asset === 'tex-chtml.js'
          ? Buffer.concat([
              Buffer.from(
                `window.MathJax.options = { worker: { path: ${JSON.stringify(mathWorker)}, maps: ${JSON.stringify(mathWorker + '/mathmaps')} } };\n`,
              ),
              readFileSync(join(dependency.root, asset)),
            ])
          : readFileSync(join(dependency.root, asset)),
      contentType: asset.endsWith('.woff2')
        ? 'font/woff2'
        : asset.endsWith('.json')
          ? 'application/json'
          : 'text/javascript',
      headers: { 'access-control-allow-origin': '*' },
    });
  });
  await page.route(
    /https:\/\/(www\.googletagmanager\.com|.*google-analytics\.com|giscus\.app)\//,
    (route) => route.fulfill({ body: '', contentType: 'text/javascript' }),
  );
});

test('unrendered formulas wrap when MathJax is unavailable', async ({ page }) => {
  await page.route('**/mathjax@*/tex-chtml.js', (route) => route.abort('internetdisconnected'));
  await page.goto('/blog/ml/ml-revisit/rl');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await page.locator('.post-body details').evaluateAll((elements) => {
    elements.forEach((element) => {
      (element as HTMLDetailsElement).open = true;
    });
  });
  await expect(page.locator('mjx-container')).toHaveCount(0);
  expect(await page.locator('.math-display').count()).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page
      .locator('.math-display')
      .evaluateAll(
        (elements) =>
          elements.filter((element) => element.scrollWidth > element.clientWidth).length,
      ),
  ).toBe(0);
});

for (const slug of ['rl', 'ssl']) {
  test(`display math in ${slug} grows vertically and scrolls horizontally`, async ({ page }) => {
    await page.goto(`/blog/ml/ml-revisit/${slug}`);
    await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
    await page.waitForFunction(() => !!window.MathJax?.typesetPromise);
    const formulas = [
      // This three-row brace reproduced a 1–2 px vertical scrollbar in RL.
      String.raw`\operatorname{clip}(x,l,u)=\begin{cases}l,&x<l,\\x,&l\le x\le u,\\u,&x>u.\end{cases}`,
      String.raw`\left[\begin{matrix}\frac{a_1^2}{b_1}&\sqrt{x}\\\sum_{i=1}^{n}i&\int_0^\infty e^{-t}\,dt\\x_{i_j}^{2^k}&\underbrace{a+b+c}_{\text{three terms}}\end{matrix}\right]`,
      String.raw`\begin{aligned}f(x)&=\frac{\partial^2}{\partial x^2}\left(\frac{x^2+1}{\sqrt{x^2+2}}\right)\\g(x)&=\sum_{i=1}^n\frac{x_i}{1+x_i^2}\end{aligned}`,
      Array.from(
        { length: 16 },
        () => String.raw`\frac{\sum_{i=1}^{n}x_i^2}{\sqrt{1+\alpha^2}}`,
      ).join('+'),
    ];
    await page.evaluate(async (formulas) => {
      await window.MathJax!.startup?.promise;
      const article = document.querySelector<HTMLElement>('.post-body')!;
      const details = document.createElement('details');
      details.innerHTML =
        '<summary>Formula regression examples</summary><div class="details-content"></div>';
      formulas.forEach((tex, index) => {
        const block = document.createElement('div');
        block.className = 'math-display';
        block.dataset['mathFixture'] = String(index);
        block.textContent = `\\[${tex}\\]`;
        details.lastElementChild!.append(block);
      });
      article.append(details);
      // Also cover formulas typeset while their disclosure is still closed.
      await window.MathJax!.typesetPromise!([article]);
      article.querySelectorAll('details').forEach((element) => {
        element.open = true;
      });
      await document.fonts.ready;
    }, formulas);
    await expect(page.locator('mjx-merror')).toHaveCount(0);
    expect(await page.locator('mjx-container[display="true"]').count()).toBeGreaterThan(40);

    const verticalOverflows = await page.locator('.post-body').evaluate((article) =>
      Array.from(
        article.querySelectorAll<HTMLElement>('.math-display, mjx-container, mjx-container *'),
      )
        .filter(
          (element) =>
            /auto|scroll/.test(getComputedStyle(element).overflowY) &&
            element.clientHeight > 0 &&
            element.scrollHeight > element.clientHeight,
        )
        .map((element) => ({
          tag: element.tagName,
          height: element.clientHeight,
          content: element.scrollHeight,
        })),
    );
    expect(verticalOverflows).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );

    const wide = page.locator('[data-math-fixture="3"]');
    await wide.scrollIntoViewIfNeeded();
    const horizontal = await wide.evaluate((block) => {
      const scrollers = [block, ...block.querySelectorAll<HTMLElement>('*')].filter(
        (element) =>
          /auto|scroll/.test(getComputedStyle(element).overflowX) &&
          element.scrollWidth > element.clientWidth,
      );
      for (const element of scrollers) element.scrollLeft = element.scrollWidth;
      return scrollers.map((element) => ({ left: element.scrollLeft, top: element.scrollTop }));
    });
    expect(horizontal).toHaveLength(1);
    expect(horizontal[0]!.left).toBeGreaterThan(0);
    expect(horizontal[0]!.top).toBe(0);
    await page.screenshot({ path: test.info().outputPath('wide-formula.png') });
  });
}
