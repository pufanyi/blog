import { expect, test } from '@playwright/test';

const article = '/blog/chess/antichess/principles';

const tacticalBoards = [
  { id: 'anti-capture-order', pieces: 5, fen: '8/8/8/8/p1n5/B7/8/r1R5 w - - 0 1' },
  { id: 'anti-relay', pieces: 5, fen: 'r7/8/8/4R3/8/8/2K2n2/7R w - - 0 1' },
  { id: 'anti-intermediate', pieces: 6, fen: '1R6/7p/8/8/2n2K2/4P3/8/5N2 w - - 0 1' },
];

test('Antichess tactical diagrams use the shared chess kit', async ({ page }) => {
  await page.goto(article);
  for (const { id, pieces, fen } of tacticalBoards) {
    const figure = page.locator(`#${id}-title`).locator('xpath=ancestor::figure');
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveAttribute('data-ready', 'true');
    await expect(figure.locator('cg-board piece')).toHaveCount(pieces);
    await expect(figure.locator('desc')).toContainText(fen);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Antichess main line replays locally and resets', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(article);
  const game = page.locator('.chess-game');
  await game.scrollIntoViewIfNeeded();
  await expect(game).toHaveAttribute('data-ready', 'true');
  await expect(game).toHaveAttribute('data-ply', '0');
  await expect(game.locator('cg-board piece')).toHaveCount(32);
  await expect(game.getByRole('button', { name: '上一步' })).toBeDisabled();
  await game.getByRole('button', { name: '下一步' }).click();
  await expect(game).toHaveAttribute('data-ply', '1');
  await expect(game.getByRole('status')).toContainText('轮到黑方走棋');
  await game.getByRole('button', { name: '2.Bxb5' }).click();
  await expect(game.locator('cg-board piece')).toHaveCount(31);
  // Arrow keys step from the move list, and focus follows the current move.
  await game.getByRole('button', { name: '2.Bxb5' }).press('ArrowRight');
  await expect(game).toHaveAttribute('data-ply', '4');
  await expect(game.getByRole('button', { name: '2...Nf6' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(game).toHaveAttribute('data-ply', '0');
  await game.getByRole('button', { name: '终局', exact: true }).click();
  await expect(game.getByRole('status')).toContainText('黑方无棋可走');
  await expect(game.locator('cg-board piece.black')).toHaveCount(1);
  await expect(game.getByRole('button', { name: '下一步' })).toBeDisabled();
  await game.getByRole('button', { name: '开局' }).click();
  await expect(game.locator('cg-board piece')).toHaveCount(32);
  await expect(game.locator('square.last-move:visible')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Antichess viewer keeps keyboard focus and scrolling inside itself', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(article);
  const game = page.locator('.chess-game');
  await game.scrollIntoViewIfNeeded();
  await expect(game).toHaveAttribute('data-ready', 'true');
  const board = game.locator('.chess-ground');
  await board.click();
  await expect(board).toBeFocused();
  const pageScroll = await page.evaluate(() => scrollY);
  // ↓ moves a full move; End reaches the result, which the move pane scrolls into view.
  await page.keyboard.press('ArrowDown');
  await expect(game).toHaveAttribute('data-ply', '2');
  await page.keyboard.press('End');
  await expect(game).toHaveAttribute('data-ply', '31');
  await expect(game.locator('.chess-moves__result')).toBeInViewport();
  expect(await page.evaluate(() => scrollY)).toBe(pageScroll);
  // The whole move list is a single tab stop, on the current move.
  await page.keyboard.press('Tab');
  await expect(game.getByRole('button', { name: '16.Rxc5' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(game.getByRole('button', { name: '开局' })).toBeFocused();
});

test('Antichess move panel sits right of the board except on phones', async ({ page }) => {
  await page.goto(article);
  const game = page.locator('.chess-game');
  await game.scrollIntoViewIfNeeded();
  await expect(game).toHaveAttribute('data-ready', 'true');
  const board = (await game.locator('.chess-ground').boundingBox())!;
  const panel = (await game.locator('.chess-game__panel').boundingBox())!;
  if ((page.viewportSize()?.width ?? 0) >= 1000) {
    // Lichess-style: the panel matches the board height and its move pane scrolls.
    expect(panel.x).toBeGreaterThan(board.x + board.width);
    expect(Math.abs(panel.height - board.height)).toBeLessThan(2);
    // Narrower laptop columns shrink the board instead of stacking the panel under it.
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(async () => {
      const narrowBoard = (await game.locator('.chess-ground').boundingBox())!;
      const narrowPanel = (await game.locator('.chess-game__panel').boundingBox())!;
      expect(narrowPanel.x).toBeGreaterThan(narrowBoard.x + narrowBoard.width);
    }).toPass();
  } else {
    // Phones: controls, then a single line of moves that scrolls sideways.
    expect(panel.y).toBeGreaterThan(board.y + board.height);
    const pane = (await game.locator('.chess-game__moves').boundingBox())!;
    expect(pane.height).toBeLessThan(48);
  }
});

test('Antichess PGN opens inside the move panel', async ({ page }) => {
  await page.goto(article);
  const game = page.locator('.chess-game');
  await game.scrollIntoViewIfNeeded();
  await expect(game).toHaveAttribute('data-ready', 'true');
  const toggle = game.getByRole('button', { name: 'PGN' });
  await expect(game.locator('.chess-pgn > summary')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(game.locator('.chess-pgn code')).toContainText('16. Rxc5 0-1');
  await expect(game.locator('.chess-pgn .code-copy')).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) >= 1000)
    await expect(game.locator('.chess-game__moves')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(game.locator('.chess-game__moves')).toBeVisible();
});

test('Antichess remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(article);
  const game = page.locator('.chess-game');
  await expect(game.locator('.chess-board')).toBeVisible();
  await expect(game.locator('image')).toHaveCount(32);
  await expect(game.locator('[data-chess-controls]')).toBeHidden();
  await expect(game.locator('.chess-move[data-ply]')).toHaveCount(31);
  await expect(game.locator('.chess-pgn > summary')).toBeVisible();
  for (const { id, pieces } of tacticalBoards) {
    const figure = page.locator(`#${id}-title`).locator('xpath=ancestor::figure');
    await expect(figure.locator('.chess-board')).toBeVisible();
    await expect(figure.locator('image')).toHaveCount(pieces);
  }
  await context.close();
});
