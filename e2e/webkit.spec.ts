import { expect } from '@playwright/test';
import { openSearch, test } from './fixtures';

test('WebKit search contains focus, navigates to an article, and releases the dialog', async ({
  page,
}) => {
  await page.goto('/');
  const { input, trigger } = await openSearch(page);
  await input.fill('模型');
  const options = page.getByRole('option');
  await expect(options.first()).toBeVisible();
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-1');
  await input.press('Escape');
  await expect(trigger).toBeFocused();
  const reopened = await openSearch(page);
  await reopened.input.fill('attention');
  await expect(options.first()).toBeVisible();
  await reopened.input.press('Enter');
  await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
  await expect(page.getByRole('dialog', { name: 'Search posts' })).toHaveCount(0);
  expect(await page.locator('body').evaluate((element) => element.style.overflow)).not.toBe(
    'hidden',
  );
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.locator('.post-body')).toHaveCount(0);
});
