import { writeFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { test } from './fixtures';

interface RuntimeSample {
  tasks: { start: number; duration: number }[];
  headingReads: number;
}
declare global {
  interface Window {
    longArticleSample: RuntimeSample;
  }
}

for (const slug of ['rl', 'diffusion', 'ssl']) {
  test(`long article runtime and growth: ${slug}`, async ({ page, context }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const sample = (window.longArticleSample = { tasks: [], headingReads: 0 } as RuntimeSample);
      new PerformanceObserver((list) => {
        sample.tasks.push(
          ...list
            .getEntries()
            .map((entry) => ({ start: entry.startTime, duration: entry.duration })),
        );
      }).observe({ type: 'longtask', buffered: true });
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        if (/^H[23]$/.test(this.tagName)) sample.headingReads++;
        return original.call(this);
      };
    });
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const scripts: Promise<string>[] = [];
    let engines = 0;
    page.on('request', (request) => {
      if (request.url().includes('/mathjax@')) engines++;
    });
    page.on('response', (response) => {
      if (response.request().resourceType() === 'script') scripts.push(response.text());
    });
    await page.goto(`/blog/ml/ml-revisit/${slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true', {
      timeout: 30_000,
    });
    await page.evaluate(() => document.fonts.ready);
    expect(
      (await Promise.all(scripts)).filter((script) => /contentHtml:\s*["'`]</.test(script)),
    ).toHaveLength(0);
    expect(engines).toBe(0);
    await expect(page.locator('mjx-merror, [data-mjx-error]')).toHaveCount(0);
    const phases = [];
    for (const growth of [1, 2]) {
      if (growth === 2) {
        // Test-only doubled DOM, not a public article or a second maintained corpus.
        await page.evaluate(() => {
          const article = document.querySelector<HTMLElement>('.post-body')!;
          const copy = article.cloneNode(true) as HTMLElement;
          copy.removeAttribute('id');
          copy.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
          article.append(copy);
          window.dispatchEvent(new Event('resize'));
        });
      }
      await page.waitForTimeout(500);
      phases.push(
        await page.evaluate(async (growth) => {
          const sample = window.longArticleSample;
          const start = performance.now();
          const reads = sample.headingReads;
          const max = document.documentElement.scrollHeight - innerHeight;
          for (let step = 0; step < 90; step++) {
            scrollTo({ top: (max * step) / 89, behavior: 'instant' });
            await new Promise(requestAnimationFrame);
          }
          const end = performance.now();
          await new Promise((resolve) => setTimeout(resolve, 100));
          const tasks = sample.tasks.filter((task) => task.start >= start && task.start < end);
          return {
            growth,
            start,
            end,
            headingReads: sample.headingReads - reads,
            elements: document.querySelectorAll('.post-body *').length,
            longTasks: tasks.length,
            maxTaskMs: Math.max(0, ...tasks.map((task) => task.duration)),
          };
        }, growth),
      );
    }
    const initialTasks = await page.evaluate(
      (end) => window.longArticleSample.tasks.filter((task) => task.start < end),
      phases[0]!.start,
    );
    const report = JSON.stringify(
      { slug, cpuSlowdown: 4, viewport: page.viewportSize(), initialTasks, phases },
      null,
      2,
    );
    await writeFile(info.outputPath('runtime.json'), report);
    await info.attach('runtime', {
      body: report,
      contentType: 'application/json',
    });
    // Host timings are diagnostic; engine/body loading and geometry behavior are gates.
    expect(engines).toBe(0);
    expect(phases[1]!.elements).toBeGreaterThan(phases[0]!.elements);
  });
}
