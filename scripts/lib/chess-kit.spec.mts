import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { E4_B5 } from '../../content/posts/chess/antichess/principles/scripts/games';
import { ChessGame, moveArrows, moveText, parseGame } from '../../content/shared/chess';
import { postClientModules, postKits, postStyles } from './post-assets.mts';

test('the antichess main line replays under antichess rules', () => {
  assert.equal(E4_B5.variant, 'antichess');
  assert.equal(E4_B5.plies.length, 31);
  assert.equal(E4_B5.result, '0-1');
  // chessops marks the winning capture with "#"; antichess has no check.
  assert.equal(E4_B5.plies.at(-1)?.san, 'Rxc5');
  assert.equal(moveText(E4_B5, 9, 12), '5...Nxd1 6.Kxd1 Qxd2');
  assert.match(E4_B5.pgn, /^\[Variant "Antichess"\]\n\[Result "0-1"\]\n\n1\. e4 b5 2\. Bxb5 /);
  assert.match(E4_B5.pgn, / 16\. Rxc5 0-1\n$/);
  // Seven Tag Roster placeholders are dropped from the canonical PGN.
  assert.doesNotMatch(E4_B5.pgn, /\[Event|\?/);
});

test('invalid games fail the build with the offending move', () => {
  assert.throws(
    () => parseGame('1. e4 e5 2. Ke3 *'),
    /Illegal or unsupported move 2\.Ke3 in chess/,
  );
  assert.throws(
    () => parseGame('[Variant "Antichess"]\n\n1. e4 b5 2. Nf3 *'),
    /2\.Nf3 in antichess/,
  );
  assert.throws(
    () => parseGame('[Result "1-0"]\n\n1. f3 e5 2. g4 Qh4# 1-0'),
    /contradicts the final position \(0-1\)/,
  );
  assert.throws(() => parseGame('1. e4 (1. d4) e5 *'), /variations are not supported/);
  assert.throws(() => parseGame('1. e4 *\n\n1. d4 *'), /Expected one PGN game, found 2/);
});

test('a finished game without a declared result takes it from the final position', () => {
  const game = parseGame('1. f3 e5 2. g4 Qh4# *');
  assert.equal(game.result, '0-1');
  assert.equal(game.plies.at(-1)?.san, 'Qh4#');
  assert.equal(game.plies.at(-1)?.check, true);
});

test('comments become reader text and Lichess shapes become arrows and marks', () => {
  const game = parseGame('1. e4 { Opens the bishop. [%cal Gf1b5,Bd1h5] [%csl Re4] } e5 *');
  assert.deepEqual(game.plies[0], {
    san: 'e4',
    from: 'e2',
    to: 'e4',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    comment: 'Opens the bishop.',
    arrows: [
      { from: 'f1', to: 'b5', role: 'path' },
      { from: 'd1', to: 'h5', role: 'option' },
    ],
    marks: [{ square: 'e4', role: 'target' }],
  });
  // Exported PGN keeps the shapes for Lichess and resumes Black's move after the comment.
  assert.match(
    game.pgn,
    /1\. e4 \{ Opens the bishop\. \[%csl Re4\] \[%cal Gf1b5,Bd1h5\] \} 1\.\.\. e5 \*/,
  );
});

test('games may start from a FEN with Black to move', () => {
  const game = parseGame(
    '[SetUp "1"]\n[FEN "4k3/8/8/8/8/8/4P3/4K3 b - - 0 10"]\n\n10... Kd7 11. e4 *',
    { orientation: 'black' },
  );
  assert.equal(game.startPly, 19);
  assert.equal(game.orientation, 'black');
  assert.equal(moveText(game, 0, 2), '10...Kd7 11.e4');
  assert.match(game.pgn, /\n\n10\.\.\. Kd7 11\. e4 \*\n$/);
  assert.deepEqual(moveArrows(game, [1, 2]), [
    { from: 'e8', to: 'd7', role: 'path', label: '10' },
    { from: 'e2', to: 'e4', role: 'path', label: '11' },
  ]);
});

test('the static viewer is a complete reading of the game', () => {
  const game = parseGame('1. e4 { Center. } e5 2. Nf3 *');
  const html = renderToStaticMarkup(
    createElement(ChessGame, {
      id: 'demo',
      game,
      title: 'Demo',
      description: 'A short game.',
      caption: 'Caption',
      result: 'Unfinished',
    }),
  );
  const { document } = new JSDOM(html).window;
  const rows = [...document.querySelectorAll('.chess-moves > li')].map((row) =>
    row.children.length
      ? [...row.children].map((cell) => cell.textContent).join('|')
      : row.textContent,
  );
  // A comment ends its row; Black's reply resumes after an ellipsis, as in Lichess.
  assert.deepEqual(rows, ['1|e4|', 'Center.', '1|…|e5', '2|Nf3|', '*|Unfinished']);
  assert.equal(document.querySelector('[data-ply="3"]')?.getAttribute('aria-label'), '2.Nf3');
  assert.equal(document.querySelector('code.language-pgn')?.textContent, game.pgn);
  const payload = JSON.parse(document.querySelector('figure')!.dataset['chessGame']!);
  assert.deepEqual(Object.keys(payload).sort(), [
    'fen',
    'locale',
    'orientation',
    'plies',
    'startPly',
  ]);
  // Interactive controls stay hidden until the controller attaches.
  assert.equal(document.querySelector('[data-chess-controls]')?.hasAttribute('hidden'), true);
  assert.equal(document.querySelector('.chess-ground')?.hasAttribute('hidden'), true);
});

test('shared kits follow imports into exactly the articles that use them', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'blog-kits-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (path: string, text: string) => {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  write('content/shared/board/index.ts', "export { piece } from './piece';\n");
  write('content/shared/board/piece.ts', "export const piece = 'p';\n");
  write('content/shared/board/styles.css', '.kit {}\n');
  write('content/shared/board/board.post-client.ts', 'export {};\n');
  write('content/shared/loose.tsx', 'export const loose = 1;\n');
  write('content/posts/uses/index.mdx', '# Uses\n');
  write('content/posts/uses/styles.css', '.article {}\n');
  write('content/posts/uses/scripts/model.ts', "export { piece } from '../../../shared/board';\n");
  write(
    'content/posts/uses/scripts/a.post-component.tsx',
    "import { piece } from './model';\nexport const POST_COMPONENTS = { piece };\n",
  );
  write('content/posts/plain/index.mdx', '# Plain\n');
  write(
    'content/posts/plain/scripts/b.post-component.tsx',
    "import { loose } from '../../../shared/loose';\nexport const POST_COMPONENTS = { loose };\n",
  );
  const uses = join(root, 'content/posts/uses/index.mdx');
  const plain = join(root, 'content/posts/plain/index.mdx');

  assert.deepEqual(postKits(uses), [join(root, 'content/shared/board')]);
  assert.equal(postStyles(uses), '<style data-post-style>.kit {}\n\n.article {}\n</style>');
  assert.deepEqual(postClientModules(uses), [
    join(root, 'content/shared/board/board.post-client.ts'),
  ]);
  // A file directly under content/shared is a plain helper, not a kit.
  assert.deepEqual(postKits(plain), []);
  assert.equal(postStyles(plain), '');
  assert.deepEqual(postClientModules(plain), []);
});
