import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BISHOP_BA6_MAIN,
  CLASSIC_E6_BELTMAN,
  CLASSIC_E6_MINEAR,
  SUICIDE_BD5,
  SUICIDE_MAIN,
  SUICIDE_NA3_BLUNDER,
  SUICIDE_RECAPTURES,
} from '../../content/posts/chess/antichess/openings/classical-defence/scripts/games';
import { E4_B5 } from '../../content/posts/chess/antichess/principles/scripts/games';
import { ChessGame, moveArrows, moveText, parseGame } from '../../content/shared/chess';
import { childrenOf, depthOf, fenAt, moveName, parentOf } from '../../content/shared/chess/model';
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

test('the classical defence opening lines replay to their documented tabiyas', () => {
  assert.equal(SUICIDE_MAIN.plies.length, 40);
  assert.equal(SUICIDE_MAIN.result, '1-0');
  assert.equal(SUICIDE_MAIN.plies[17]?.fen, 'r4nr1/p1p1p1pp/8/8/8/4P3/PPPB1P1P/RN2K1N1 w - - 0 10');
  assert.equal(SUICIDE_NA3_BLUNDER.result, '0-1');
  assert.equal(CLASSIC_E6_BELTMAN.plies.length, 21);
  assert.equal(moveText(CLASSIC_E6_MINEAR, 14, 16), '8.Rxa7 Rxa7');
  assert.equal(BISHOP_BA6_MAIN.plies.length, 27);
  // The move-6 study reaches the same tabiya, with every recapture as a variation.
  assert.equal(fenAt(SUICIDE_RECAPTURES, 18), SUICIDE_MAIN.plies[17]?.fen);
  const options = (node: number) =>
    childrenOf(SUICIDE_RECAPTURES, node).map((child) => moveName(SUICIDE_RECAPTURES, child));
  assert.deepEqual(options(10), ['6.Bxd2!', '6.Bxg8??', '6.Qxd2??', '6.Nxd2', '6.Kxd2']);
  assert.deepEqual(options(11), ['6...Bf3', '6...Bd5??', '6...Be4??']);
  // 6...Bd5?? loses to 7.Bxg8!, whatever Black recaptures with; 7.Bxd5? loses instead.
  assert.equal(SUICIDE_BD5.plies.length, 38);
  assert.equal(SUICIDE_BD5.result, '1-0');
  assert.equal(moveText(SUICIDE_BD5, 10, 12), '6.Bxd2 Bd5');
  const bd5 = (node: number) =>
    childrenOf(SUICIDE_BD5, node).map((child) => moveName(SUICIDE_BD5, child));
  assert.deepEqual(bd5(12), ['7.Bxg8!', '7.Bxd5?']);
  assert.deepEqual(bd5(13), ['7...Rxg8', '7...Bxg8', '7...Bxa2']);
});

test('variations form a tree whose lines continue before their alternatives', () => {
  const source = '1. e4 e5 (1... c5 2. Nf3 (2. c3) 2... d6) (1... e6) 2. Nf3 *';
  const game = parseGame(source);
  assert.deepEqual(
    game.plies.map(({ san }) => san),
    ['e4', 'e5', 'Nf3'],
  );
  // Main-line nodes keep their ply numbers; variation moves follow, line by line.
  assert.deepEqual(
    game.variations?.map(({ san, parent }) => [san, parent]),
    [
      ['c5', 1],
      ['Nf3', 4],
      ['d6', 5],
      ['c3', 4],
      ['e6', 1],
    ],
  );
  assert.deepEqual(childrenOf(game, 1), [2, 4, 8]);
  assert.deepEqual(childrenOf(game, 4), [5, 7]);
  assert.deepEqual(childrenOf(game, 3), []);
  assert.equal(parentOf(game, 7), 4);
  assert.equal(depthOf(game, 6), 4);
  assert.equal(moveName(game, 6), '2...d6');
  assert.equal(moveName(game, 7), '2.c3');
  assert.equal(fenAt(game, 8), 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2');
  // The exported PGN keeps every variation and parses back to the same tree.
  assert.match(
    game.pgn,
    /\n\n1\. e4 e5 \(1\.\.\. c5 2\. Nf3 \(2\. c3\) 2\.\.\. d6\) \(1\.\.\. e6\) 2\. Nf3 \*\n$/,
  );
  assert.deepEqual(parseGame(game.pgn), game);
  // Games without variations keep the compact payload.
  assert.equal('variations' in parseGame('1. e4 e5 *'), false);
});

test('move annotations become glyphs in the move list and the PGN', () => {
  const game = parseGame('1. e4! e5?? 2. Nf3 $14 *');
  assert.equal(game.plies[0]?.glyph, '!');
  assert.equal(game.plies[0]?.san, 'e4');
  // Position assessments such as $14 are not move glyphs.
  assert.equal(game.plies[2]?.glyph, undefined);
  assert.equal(moveText(game, 0, 2), '1.e4! e5??');
  assert.match(game.pgn, /\n\n1\. e4! e5\?\? 2\. Nf3 \*\n$/);
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
  assert.throws(
    () => parseGame('1. e4 (1. d4 Ke7) e5 *'),
    /Illegal or unsupported move 1\.\.\.Ke7 in chess/,
  );
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
  assert.equal('variations' in payload, false);
  // Interactive controls stay hidden until the controller attaches.
  assert.equal(document.querySelector('[data-chess-controls]')?.hasAttribute('hidden'), true);
  assert.equal(document.querySelector('.chess-ground')?.hasAttribute('hidden'), true);
});

test('the static viewer prints variations under the move they replace', () => {
  const game = parseGame('1. e4 e5 (1... c5 { Sicilian. } 2. Nf3 (2. c3)) 2. Nf3 *');
  const html = renderToStaticMarkup(
    createElement(ChessGame, {
      id: 'tree',
      game,
      title: 'Tree',
      description: 'A game with variations.',
      caption: 'Caption',
    }),
  );
  const { document } = new JSDOM(html).window;
  const rows = [...document.querySelectorAll('.chess-moves > li')].map((row) => row.className);
  assert.deepEqual(rows, [
    'chess-moves__row',
    'chess-moves__variations',
    'chess-moves__row',
    'chess-moves__result',
  ]);
  const line = document.querySelector('.chess-moves__variations > .chess-line')!;
  // Numbers resume after a comment, and the nested alternative is its own line.
  assert.deepEqual(
    [...line.children].map((child) => `${child.className}:${child.textContent?.trim()}`),
    [
      'chess-line__number:1...',
      'chess-move:c5',
      'chess-line__comment:Sicilian.',
      'chess-line__number:2.',
      'chess-move:Nf3',
      'chess-line__variations:2.c3',
    ],
  );
  // Moves are separated by spaces so long lines wrap between them.
  assert.equal(line.textContent?.trim(), '1...c5 Sicilian. 2.Nf3 2.c3');
  assert.equal(document.querySelector('[data-ply="4"]')?.getAttribute('aria-label'), '变化 1...c5');
  assert.equal(document.querySelector('[data-ply="3"]')?.getAttribute('aria-label'), '2.Nf3');
  const payload = JSON.parse(document.querySelector('figure')!.dataset['chessGame']!);
  assert.deepEqual(payload.variations, game.variations);
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
