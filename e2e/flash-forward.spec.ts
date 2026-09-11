import { expect, test } from '@playwright/test';

const article = '/blog/ml/ml-revisit/infra/flash-attention';

test('forward player supports stepping, reverse scanning, keyboard seeking, and replay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(article);
  const player = page.locator('[data-flash-forward]');
  await expect(player).toHaveAttribute('data-ready', 'true');
  await player.scrollIntoViewIfNeeded();
  const progress = player.getByRole('slider', { name: 'Forward 动画进度' });
  await progress.scrollIntoViewIfNeeded();
  await progress.focus();
  for (let step = 0; step < 8; step++) await progress.press('ArrowRight');
  await expect(player).toHaveAttribute('data-phase', 'rescale');
  await expect(player.locator('[data-merge-value="alpha"]')).toHaveText(['0.25', '0.0625']);
  await expect(page.locator('#flash-forward-rescale')).toHaveAttribute('data-playing-line', '');
  await player.getByRole('button', { name: '下一步' }).click();
  await expect(player.locator('[data-merge-row="0"] [data-merge-value="ell"]')).toHaveText('0.25 × 1.5 + 1.5 = 1.875');
  await player.getByRole('button', { name: '下一步' }).click();
  await expect(player.locator('[data-cell]')).toHaveText(['—', '—', '—', '—']);
  await player.getByRole('button', { name: '下一步' }).click();
  await expect(player.locator('[data-output-row="0"]')).toContainText('3.2667');
  await expect(player.locator('[data-output-row="1"]')).toContainText('3.6824');
  await expect(player.getByRole('button', { name: '下一步' })).toBeDisabled();
  await player.getByRole('checkbox', { name: '反向扫描 KV' }).check();
  await expect(player).toHaveAttribute('data-step', '0');
  await progress.scrollIntoViewIfNeeded();
  await progress.focus();
  for (let step = 0; step < 8; step++) await progress.press('ArrowRight');
  await expect(player.locator('[data-merge-value="alpha"]')).toHaveText(['1', '1']);
  await progress.press('End');
  await expect(player.locator('[data-output-row="0"]')).toContainText('3.2667');
  await player.getByRole('button', { name: '重播' }).click();
  await expect(player.getByRole('button', { name: '暂停' })).toHaveAttribute('aria-pressed', 'true');
  await expect(player).toHaveAttribute('data-step', '1', { timeout: 7000 });
  await player.getByRole('button', { name: '暂停' }).click();
  await player.getByRole('button', { name: '上一步' }).click();
  await expect(player).toHaveAttribute('data-step', '0');
  expect(await player.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

test('the example and algorithm remain readable without JavaScript', async ({ browser, viewport }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport });
  try {
    const page = await context.newPage();
    await page.goto(article);
    await expect(page.locator('#flash-forward-algorithm')).toContainText('FlashAttention forward');
    const player = page.locator('[data-flash-forward]');
    await expect(player).toContainText('完整 attention 核对');
    await expect(player.getByRole('button', { name: '播放' })).not.toBeVisible();
    await player.getByText('逐块数值核对', { exact: true }).click();
    await expect(player.locator('.flash-player-transcript table')).toBeVisible();
    await expect(player.locator('.flash-player-transcript table')).toContainText('6.125');
  } finally {
    await context.close();
  }
});
