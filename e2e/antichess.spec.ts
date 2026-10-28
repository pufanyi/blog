import { expect, test } from '@playwright/test';

const article = '/blog/chess/antichess/principles';

test('Antichess main line replays locally and resets', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(article);
  const player = page.locator('[data-anti-player]');
  await player.scrollIntoViewIfNeeded();
  await expect(player).toHaveAttribute('data-ply', '0');
  await expect(player.locator('cg-board piece')).toHaveCount(32);
  await expect(player.getByRole('button', { name: '上一步' })).toBeDisabled();
  await player.getByRole('button', { name: '下一步' }).click();
  await expect(player).toHaveAttribute('data-ply', '1');
  await expect(player.getByRole('status')).toContainText('轮到黑方');
  await player.locator('.anti-moves [data-step="3"]').click();
  await expect(player.locator('cg-board piece')).toHaveCount(31);
  await player.getByRole('button', { name: '终局', exact: true }).click();
  await expect(player.getByRole('status')).toContainText('黑方获胜');
  await expect(player.locator('cg-board piece.black')).toHaveCount(1);
  await expect(player.getByRole('button', { name: '下一步' })).toBeDisabled();
  await player.getByRole('button', { name: '重置' }).click();
  await expect(player.locator('cg-board piece')).toHaveCount(32);
  await expect(player.locator('square.last-move:visible')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Antichess remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(article);
  await expect(page.locator('[data-anti-player] .anti-board')).toBeVisible();
  await expect(page.locator('[data-anti-controls]')).toBeHidden();
  await expect(page.locator('[data-anti-player] image')).toHaveCount(32);
  await context.close();
});
