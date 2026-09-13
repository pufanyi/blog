import { expect, type Page } from '@playwright/test';
import { openSearch, test } from './fixtures';

const articlePath = '/blog/ml/ml-revisit/diffusion';

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
    await page.goto(`${articlePath}${fragment}`);
    await waitForLayout(page);
    // A deep target crosses many formulas whose heights change during loading.
    const heading = page.locator('.post-body #references');
    await heading.scrollIntoViewIfNeeded();
    const position = await page.evaluate(() => scrollY);
    expect(position).toBeGreaterThan(3000);
    const offset = await heading.evaluate((element) => element.getBoundingClientRect().top);

    await page.reload();
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
    await page.reload();
    await waitForLayout(page);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  });
}

test('a restored page still supports new articles, history and explicit fragments', async ({
  page,
}) => {
  await page.goto(articlePath);
  await waitForLayout(page);
  await page.evaluate(() => window.scrollTo({ top: 2400, behavior: 'instant' }));
  await page.reload();
  await waitForLayout(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(2400);

  const { input } = await openSearch(page);
  await input.fill('Auto Regressive');
  await input.press('Enter');
  await expect(page).toHaveURL('/blog/ml/ml-revisit/ar');
  await waitForLayout(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goBack();
  await expect(page).toHaveURL(articlePath);
  await waitForLayout(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(2400);
  await page.goForward();
  await waitForLayout(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);

  await page.goto(`${articlePath}#references`);
  await waitForLayout(page);
  await expect
    .poll(() =>
      page
        .locator('.post-body #references')
        .evaluate((element) =>
          Math.abs(
            element.getBoundingClientRect().top -
              parseFloat(getComputedStyle(element).scrollMarginTop),
          ),
        ),
    )
    .toBeLessThan(3);
});
