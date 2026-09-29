import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { test as base, expect } from '@playwright/test';
import type {} from '../src/app/utils/mathjax';
import { serveMathJaxWorker } from './mathjax-assets';

const test = base.extend<{
  mathWorker: Awaited<ReturnType<typeof serveMathJaxWorker>>;
}>({
  // Playwright requires destructuring even when a fixture has no dependencies.
  // eslint-disable-next-line no-empty-pattern
  mathWorker: async ({}, use) => {
    const worker = await serveMathJaxWorker();
    try {
      await use(worker);
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
                `window.MathJax.options = { ...window.MathJax.options, worker: { path: ${JSON.stringify(mathWorker.url)}, maps: ${JSON.stringify(mathWorker.url + '/mathmaps')} } };\n`,
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
    /https:\/\/(www\.googletagmanager\.com|.*google-analytics\.com|giscus\.app|fonts\.googleapis\.com|fonts\.gstatic\.com)\//,
    (route) => route.fulfill({ body: '', contentType: 'text/javascript' }),
  );
});

test('static formulas remain readable and copy as TeX without browser MathJax', async ({
  page,
}) => {
  let browserMathRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/mathjax@')) browserMathRequests++;
  });
  await page.goto('/blog/ml/ml-revisit/rl-policy-gradient');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await page.locator('.post-body details').evaluateAll((elements) => {
    elements.forEach((element) => {
      (element as HTMLDetailsElement).open = true;
    });
  });
  expect(await page.locator('mjx-container[data-static-math]').count()).toBeGreaterThan(20);
  const formula = page.locator('.math-inline mjx-container[data-static-math]').first();
  await formula.scrollIntoViewIfNeeded();
  const copied = await formula.evaluate((element) => {
    const selection = document.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(element.querySelector('mjx-math')!);
    selection.removeAllRanges();
    selection.addRange(range);
    const clipboardData = new DataTransfer();
    const event = new ClipboardEvent('copy', {
      bubbles: true,
      cancelable: true,
      clipboardData,
    });
    element.dispatchEvent(event);
    selection.removeAllRanges();
    return {
      prevented: event.defaultPrevented,
      text: clipboardData.getData('text/plain'),
      expected: `\\(${element.dataset['tex']}\\)`,
    };
  });
  expect(copied.prevented).toBe(true);
  expect(copied.text).toBe(copied.expected);
  await expect(formula).toBeVisible();
  expect(await page.evaluate(() => !!window.MathJax)).toBe(false);
  expect(browserMathRequests).toBe(0);
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

test('right-clicking static math preserves its geometry and reading position', async ({ page }) => {
  await page.goto('/blog/ml/ml-revisit/diffusion');
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
  const formulas = page.locator('.math-display mjx-container[data-static-math]');
  const formula = formulas.nth(Math.floor((await formulas.count()) / 2));
  await formula.scrollIntoViewIfNeeded();
  const beforeScroll = await page.evaluate(() => scrollY);
  const beforeRect = await formula.boundingBox();
  expect(beforeScroll).toBeGreaterThan(5000);
  expect(await formula.getAttribute('tabindex')).toBeNull();
  expect(await formula.getAttribute('title')).toBeNull();

  await formula.click({ button: 'right' });
  const afterRect = await formula.boundingBox();
  expect(afterRect).toEqual(beforeRect);
  await expect(page.locator('[role="menu"]')).toHaveCount(0);
  expect(await page.evaluate(() => !!window.MathJax)).toBe(false);
  await expect
    .poll(async () => Math.abs((await page.evaluate(() => scrollY)) - beforeScroll))
    .toBeLessThan(10);
});

test('static math matches browser typesetting across surrounding fonts and sizes', async ({
  page,
}) => {
  await page.goto('/blog/ml/ml-revisit/rl-policy-gradient');
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
  // Keep the same static nodes as their typography changes, including a font
  // change after initial display. Only the reference column is re-typeset.
  const fixtureHtml = await page.evaluate(() => {
    const fixture = document.createElement('section');
    fixture.id = 'font-matching-fixture';
    const samples = [
      document.querySelector('.math-inline mjx-container[data-static-math]')!,
      document.querySelector('.math-display mjx-container[data-static-math]')!,
    ];
    for (const sample of samples) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; gap:20px';
      for (const name of ['static', 'reference']) {
        const cell = document.createElement('div');
        cell.className = name;
        cell.style.width = '600px';
        if (name === 'static') cell.append(sample.cloneNode(true));
        row.append(cell);
      }
      fixture.append(row);
    }
    return document.querySelector('[data-post-math-style]')!.outerHTML + fixture.outerHTML;
  });
  // Use the production loader, including its WebKit worker compatibility fix.
  await page.goto('/missing-formula-test');
  await expect(page.locator('.math-symbol mjx-container').first()).toBeVisible();
  await page.evaluate((html) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
  }, fixtureHtml);
  for (const font of ['serif', 'sans-serif', 'monospace']) {
    for (const size of [14, 24]) {
      const measurements = await page.evaluate(
        async ({ font, size }) => {
          const api = window.MathJax!;
          await api.startup!.promise;
          const fixture = document.getElementById('font-matching-fixture')!;
          fixture.style.fontFamily = font;
          fixture.style.fontSize = `${size}px`;
          for (const row of fixture.children) {
            const formula = row.querySelector<HTMLElement>('[data-static-math]')!;
            const reference = row.querySelector<HTMLElement>('.reference')!;
            api.typesetClear?.([reference]);
            reference.textContent = formula.hasAttribute('display')
              ? `\\[${formula.dataset['tex']}\\]`
              : `\\(${formula.dataset['tex']}\\)`;
            await api.typesetPromise!([reference]);
          }
          await document.fonts.ready;
          return Array.from(fixture.children, (row) => {
            const measure = (name: string) => {
              const container = row.querySelector<HTMLElement>(`.${name} mjx-container`)!;
              const box = container.querySelector('mjx-math')!.getBoundingClientRect();
              return { size: parseFloat(getComputedStyle(container).fontSize), width: box.width };
            };
            return { actual: measure('static'), expected: measure('reference') };
          });
        },
        { font, size },
      );
      for (const { actual, expected } of measurements) {
        expect(Math.abs(actual.size / expected.size - 1), `${font} ${size}px size`).toBeLessThan(
          0.005,
        );
        expect(Math.abs(actual.width / expected.width - 1), `${font} ${size}px width`).toBeLessThan(
          0.01,
        );
      }
    }
  }
});

test('runtime MathJax renders dynamic formulas without a custom context menu', async ({
  page,
  mathWorker,
}) => {
  await page.goto('/missing-formula-test');
  await page.waitForFunction(() => !!window.MathJax?.typesetPromise);
  const runtimeFormula = page.locator('.math-symbol mjx-container').first();
  await expect(runtimeFormula).toBeVisible();
  await runtimeFormula.click({ button: 'right' });
  await expect(page.locator('[role="menu"]')).toHaveCount(0);
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
    const article = document.createElement('section');
    article.style.width = 'min(320px, 100%)';
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
    document.body.append(article);
    article.append(details);
    // Also cover formulas typeset while their disclosure is still closed.
    await window.MathJax!.typesetPromise!([article]);
    article.querySelectorAll('details').forEach((element) => {
      element.open = true;
    });
    await document.fonts.ready;
  }, formulas);
  await expect(page.locator('mjx-merror')).toHaveCount(0);
  await expect(page.locator('[data-math-fixture] mjx-container[display="true"]')).toHaveCount(4);
  await expect.poll(() => mathWorker.requests).toContain('/speech-worker.js');

  const verticalOverflows = await page
    .locator('section:has([data-math-fixture])')
    .evaluate((article) =>
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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

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
