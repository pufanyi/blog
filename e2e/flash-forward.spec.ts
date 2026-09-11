import { expect, test } from '@playwright/test';

const article = '/blog/ml/ml-revisit/infra/flash-attention';

test('forward tiles the full sequence and merges each range into one query output', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(article);
  const player = page.locator('[data-flash-forward]');
  await expect(player).toHaveAttribute('data-ready', 'true');
  const layout = player.locator('[data-layout="4"]');
  const progress = player.getByRole('slider', { name: 'Forward 动画进度' });
  await progress.scrollIntoViewIfNeeded();
  await progress.focus();
  await progress.press('ArrowRight');
  await expect(player).toHaveAttribute('data-phase', 'partition');
  await expect(layout.locator('[data-map-cell]')).toHaveCount(36);
  await progress.press('ArrowRight');
  await expect(layout.locator('[data-query="2"]')).toHaveAttribute('aria-pressed', 'true');
  await progress.press('ArrowRight');
  await expect(layout.locator('[data-map-cell="2-0"]')).toHaveAttribute('data-status', 'current');
  await expect(layout.locator('[data-field="covered"]')).toHaveText('0 / 24');
  await player.getByRole('button', { name: '下一步' }).click();
  await expect(layout.locator('[data-map-cell="2-0"]')).toHaveAttribute('data-status', 'merged');
  await expect(layout.locator('[data-field="covered"]')).toHaveText('4 / 24');
  await expect(layout.locator('[data-field="buffer"]')).toHaveText('临时空间已释放');
  await expect(layout.locator('[data-status="written"]')).toHaveCount(0);
  await progress.scrollIntoViewIfNeeded();
  await progress.focus();
  await progress.press('End');
  await expect(layout.locator('[data-output="2"]')).toHaveAttribute('data-status', 'written');
  await expect(layout.locator('[data-status="written"]')).toHaveCount(1);
  await expect(player.getByRole('button', { name: '下一步' })).toBeDisabled();
  const query = player.getByRole('button', { name: '选择 Q 块 5，token 17–20', exact: true });
  await query.scrollIntoViewIfNeeded();
  await query.click();
  await expect(player).toHaveAttribute('data-phase', 'query');
  await expect(layout.locator('[data-map-cell][data-status="merged"]')).toHaveCount(0);
  await player.getByRole('combobox', { name: '每块 KV 的 token 数' }).selectOption('8');
  const wider = player.locator('[data-layout="8"]');
  await expect(wider).toBeVisible();
  await expect(layout).not.toBeVisible();
  await expect(wider.locator('[data-map-cell]')).toHaveCount(18);
  await expect(progress).toHaveAttribute('max', '9');
  await progress.scrollIntoViewIfNeeded();
  await progress.focus();
  await progress.press('End');
  await expect(wider.locator('[data-field="covered"]')).toHaveText('24 / 24');
  await expect(wider.locator('[data-output="4"]')).toHaveAttribute('data-status', 'written');
  await player.getByRole('button', { name: '重播' }).click();
  await expect(player).toHaveAttribute('data-step', '1', { timeout: 6000 });
  await player.getByRole('button', { name: '暂停' }).click();
  await player.getByRole('button', { name: '上一步' }).click();
  await expect(player).toHaveAttribute('data-step', '0');
  expect(await player.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await player.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  const offsets = await wider.evaluate(element => {
    const grid = element.querySelector('svg')!.getBoundingClientRect();
    return ['[data-query]', '[data-output]'].flatMap(selector => {
      const labels = [...element.querySelectorAll(selector)];
      return labels.map((label, row) => {
        const box = label.getBoundingClientRect();
        return Math.abs(box.top + box.height / 2 - (grid.top + (row + 0.5) * grid.height / labels.length));
      });
    });
  });
  for (const offset of offsets) expect(offset).toBeLessThan(2);
});

test('the partitioned sequence remains readable without JavaScript', async ({ browser, viewport }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport });
  try {
    const page = await context.newPage();
    await page.goto(article);
    const player = page.locator('[data-flash-forward]');
    await expect(player).toHaveAttribute('data-phase', 'partition');
    await expect(player.locator('[data-layout="4"] svg')).toBeVisible();
    await expect(player).toContainText('24 个 token');
    await expect(player).toContainText('分别扫描 6 或 3 次');
    await expect(player.getByRole('button', { name: '播放' })).not.toBeVisible();
    expect(await player.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  } finally { await context.close(); }
});
