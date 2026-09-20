import { expect, type Page } from '@playwright/test';
import { openSearch, test } from './fixtures';

const articlePath = '/blog/ml/ml-revisit/diffusion';

// Each scenario performs several full long-document parses under WebKit tracing.
test.beforeEach(() => test.setTimeout(90_000));

async function waitForLayout(page: Page): Promise<void> {
  await expect(page.locator('.post-body')).toHaveAttribute('data-math-ready', 'true');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

for (const fragment of ['', '#flow-matching']) {
  test(`reload restores the reading position after deferred layout${fragment ? ' with an older fragment' : ''}`, async ({
    page,
  }) => {
    await page.goto(`${articlePath}${fragment}`, { waitUntil: 'domcontentloaded' });
    await waitForLayout(page);
    // A deep target crosses many formulas whose heights change during loading.
    const heading = page.locator('.post-body #references');
    await heading.scrollIntoViewIfNeeded();
    const position = await page.evaluate(() => scrollY);
    expect(position).toBeGreaterThan(3000);
    const offset = await heading.evaluate((element) => element.getBoundingClientRect().top);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForLayout(page);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(position);
    await expect
      .poll(async () =>
        Math.abs(
          (await heading.evaluate((element) => element.getBoundingClientRect().top)) - offset,
        ),
      )
      .toBeLessThan(3);

    // A second reload must capture the latest reading position, including zero.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForLayout(page);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  });
}

test('a restored page still supports new articles, history and explicit fragments', async ({
  page,
}) => {
  await page.goto(articlePath, { waitUntil: 'domcontentloaded' });
  await waitForLayout(page);
  await page.evaluate(() => window.scrollTo({ top: 2400, behavior: 'instant' }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForLayout(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(2400);

  const { input } = await openSearch(page);
  await input.fill('Auto Regressive');
  await input.press('Enter');
  await expect(page).toHaveURL('/blog/ml/ml-revisit/ar');
  await waitForLayout(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(articlePath);
  await waitForLayout(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(2400);
  await page.goForward({ waitUntil: 'domcontentloaded' });
  await waitForLayout(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);

  // Return to the already loaded article, then exercise an explicit new fragment.
  // Direct fragment loads are covered by the two cases above; reusing history here
  // keeps this combined scenario focused on router restoration rather than parsing
  // the same multi-megabyte document a fourth time.
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await waitForLayout(page);
  const heading = page.locator('.post-body #references');
  await heading.locator('.heading-permalink').evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page).toHaveURL(`${articlePath}#references`);
  await expect
    .poll(() =>
      heading.evaluate((element) =>
        Math.abs(
          element.getBoundingClientRect().top -
            parseFloat(getComputedStyle(element).scrollMarginTop),
        ),
      ),
    )
    .toBeLessThan(10);
});
