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
  await player.locator('.anti-moves [data-step="3"]').press('ArrowRight');
  await expect(player).toHaveAttribute('data-ply', '4');
  await player.locator('.anti-moves [data-step="3"]').press('Home');
  await expect(player).toHaveAttribute('data-ply', '0');
  await player.getByRole('button', { name: '终局', exact: true }).click();
  await expect(player.getByRole('status')).toContainText('黑方获胜');
  await expect(player.locator('cg-board piece.black')).toHaveCount(1);
  await expect(player.getByRole('button', { name: '下一步' })).toBeDisabled();
  await player.getByRole('button', { name: '重置' }).click();
  await expect(player.locator('cg-board piece')).toHaveCount(32);
  await expect(player.locator('square.last-move:visible')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Antichess move table sits right of the board except on phones', async ({ page }) => {
  await page.goto(article);
  const player = page.locator('[data-anti-player]');
  await player.scrollIntoViewIfNeeded();
  await expect(player).toHaveAttribute('data-ply', '0');
  const board = (await player.locator('.anti-ground').boundingBox())!;
  const panel = (await player.locator('.anti-panel').boundingBox())!;
  if ((page.viewportSize()?.width ?? 0) >= 1000) {
    // Lichess-style: the panel matches the board height and its move list scrolls.
    expect(panel.x).toBeGreaterThan(board.x + board.width);
    expect(Math.abs(panel.height - board.height)).toBeLessThan(2);
    await player.locator('.anti-moves [data-step="31"]').click();
    await expect(player.locator('.anti-result')).toBeInViewport();
    // Narrower laptop columns shrink the board instead of stacking the table under it.
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(async () => {
      const narrowBoard = (await player.locator('.anti-ground').boundingBox())!;
      const narrowPanel = (await player.locator('.anti-panel').boundingBox())!;
      expect(narrowPanel.x).toBeGreaterThan(narrowBoard.x + narrowBoard.width);
    }).toPass();
  } else {
    expect(panel.y).toBeGreaterThan(board.y + board.height);
  }
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
