import { expect } from '@playwright/test';
import { test } from './fixtures';

const chapters = [
  ['generalized-advantage-estimation', 'rl-policy-gradient'],
  ['proximal-policy-optimization', 'rl-policy-updates'],
  ['group-relative-policy-optimization', 'rl-llm'],
  ['center-the-score-under-the-sampler', 'rl-score-centering'],
] as const;

test('legacy RL fragments lead to the corresponding series chapters', async ({ page }) => {
  for (const [fragment, slug] of chapters) {
    await page.goto(`/blog/ml/ml-revisit/rl#${fragment}`);
    await expect(page.locator('.post-body')).toHaveAttribute('data-rendered', 'true');
    const link = page.locator(`.post-body a[href="/blog/ml/ml-revisit/${slug}#${fragment}"]`);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(`/blog/ml/ml-revisit/${slug}#${fragment}`);
    await expect(page.locator(`.post-body #${fragment}`)).toBeVisible();
    await page
      .locator('.post-body')
      .getByRole('link', { name: '系列导读', exact: true })
      .first()
      .click();
    await expect(page).toHaveURL('/blog/ml/ml-revisit/rl');
  }
});

test('the earlier policy-gradient article URL redirects to the foundations article', async ({
  page,
}) => {
  await page.goto('/blog/ml/ml-revisit/rl/policy-gradient');
  await expect(page).toHaveURL('/blog/ml/ml-revisit/rl-policy-gradient#policy-gradient-algorithms');
  await expect(page.locator('.post-body #policy-gradient-algorithms')).toBeVisible();
});
