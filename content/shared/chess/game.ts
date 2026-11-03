// Build-time PGN parsing. Every move is replayed under the declared variant, so
// an illegal or ambiguous move fails generation instead of reaching readers.
import type { Position } from 'chessops/chess';
import { makeFen } from 'chessops/fen';
import {
  type CommentShape,
  makeComment,
  type Node,
  type PgnNodeData,
  parseComment,
  parsePgn,
  startingPosition,
} from 'chessops/pgn';
import { makeSanAndPlay, parseSan } from 'chessops/san';
import { makeSquare } from 'chessops/util';
import {
  type Arrow,
  type ArrowRole,
  type Branch,
  type Color,
  type GamePayload,
  type Locale,
  type Mark,
  moveNumber,
  type Ply,
  type Square,
  sanText,
} from './model';

export interface ChessGameModel extends GamePayload {
  /** chessops rules name, e.g. `chess` or `antichess`. */
  readonly variant: string;
  /** PGN result token: `1-0`, `0-1`, `1/2-1/2`, or `*`. */
  readonly result: string;
  /** Canonical PGN rebuilt from the validated moves; shown and copied by readers. */
  readonly pgn: string;
}

export interface GameOptions {
  readonly orientation?: Color;
  readonly locale?: Locale;
}

const ARROW_ROLES: Record<CommentShape['color'], ArrowRole> = {
  green: 'path',
  blue: 'option',
  red: 'threat',
  yellow: 'idea',
};
const RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];
/** Seven Tag Roster placeholders that carry no information. */
const EMPTY_TAGS = new Set(['?', '????.??.??']);

/** Splits PGN comments into reader text and board shapes. */
function annotations(comments: readonly string[] | undefined) {
  const parsed = (comments ?? []).map(parseComment);
  const comment = parsed
    .map(({ text }) => text.trim())
    .filter(Boolean)
    .join(' ');
  const shapes = parsed.flatMap((entry) => entry.shapes);
  const arrows: Arrow[] = [];
  const marks: Mark[] = [];
  for (const shape of shapes) {
    const from = makeSquare(shape.from) as Square;
    const to = makeSquare(shape.to) as Square;
    if (from === to) marks.push({ square: from, role: shape.color === 'red' ? 'target' : 'area' });
    else arrows.push({ from, to, role: ARROW_ROLES[shape.color] });
  }
  return {
    ply: {
      ...(comment && { comment }),
      ...(arrows.length && { arrows }),
      ...(marks.length && { marks }),
    },
    // Keep shapes in exported PGN so Lichess shows the same arrows after import.
    pgn: comment || shapes.length ? makeComment({ text: comment, shapes }) : undefined,
  };
}

/** Move glyphs for the PGN NAGs $1-$6; other NAGs are ignored. */
const GLYPHS: Record<number, string> = { 1: '!', 2: '?', 3: '!!', 4: '??', 5: '!?', 6: '?!' };

/** A validated move with the moves that may follow it, continuation first. */
interface Built {
  readonly ply: Ply;
  /** Half-moves from the starting position, as `moveNumber` counts them. */
  readonly depth: number;
  /** Comment for the exported PGN, including Lichess shapes. */
  readonly pgn: string | undefined;
  readonly position: Position;
  readonly children: readonly Built[];
}

/** Replays every move below `parent`, so a variation's illegal move fails too. */
function build(
  parent: Node<PgnNodeData>,
  position: Position,
  depth: number,
  context: { startPly: number },
): Built[] {
  return parent.children.map((node) => {
    const { data } = node;
    const next = position.clone();
    const number = moveNumber(context, depth + 1);
    const name = `${number}${next.turn === 'white' ? '.' : '...'}${data.san}`;
    const move = parseSan(next, data.san);
    if (!move || !('from' in move))
      throw new Error(`Illegal or unsupported move ${name} in ${next.rules}`);
    let san = makeSanAndPlay(next, move);
    // Antichess has no check; chessops still marks a won game with "#".
    if (next.rules === 'antichess') san = san.replace(/[+#]$/, '');
    const glyph = data.nags?.map((nag) => GLYPHS[nag]).find(Boolean);
    const notes = annotations(data.comments);
    return {
      ply: {
        san,
        from: makeSquare(move.from) as Square,
        to: makeSquare(move.to) as Square,
        fen: makeFen(next.toSetup()),
        ...(next.isCheck() && next.rules !== 'antichess' && { check: true as const }),
        ...(glyph && { glyph }),
        ...notes.ply,
      },
      depth: depth + 1,
      pgn: notes.pgn,
      position: next,
      children: build(node, next, depth + 1, context),
    };
  });
}

/**
 * PGN movetext for the line that starts with `choices[0]`. Alternatives follow
 * the move they replace in parentheses, and a move number resumes after them.
 */
function movetext(choices: readonly Built[], startPly: number): string[] {
  const tokens: string[] = [];
  let resume = true;
  for (let options = choices; options.length > 0; options = options[0].children) {
    const [main, ...alternatives] = options;
    const white = (startPly + main.depth) % 2 === 1;
    const number = moveNumber({ startPly }, main.depth);
    const prefix = white ? `${number}.` : resume ? `${number}...` : '';
    const san = sanText(main.ply);
    tokens.push(prefix ? `${prefix} ${san}` : san, ...(main.pgn ? [`{ ${main.pgn} }`] : []));
    resume = main.pgn !== undefined;
    for (const alternative of alternatives) {
      tokens.push(`(${movetext([alternative], startPly).join(' ')})`);
      resume = true;
    }
  }
  return tokens;
}

/** Parses exactly one PGN game. Throws with the move number of the first illegal move. */
export function parseGame(source: string, options: GameOptions = {}): ChessGameModel {
  const games = parsePgn(source);
  if (games.length !== 1) throw new Error(`Expected one PGN game, found ${games.length}`);
  const [game] = games;
  const setup = startingPosition(game.headers);
  if (setup.isErr) throw new Error(`Invalid PGN starting position: ${setup.error.message}`);
  const start = setup.value;
  const fen = makeFen(start.toSetup());
  const startPly = (start.fullmoves - 1) * 2 + (start.turn === 'black' ? 1 : 0);
  const roots = build(game.moves, start, 0, { startPly });

  const mainline: Built[] = [];
  for (let options: readonly Built[] = roots; options.length > 0; options = options[0].children)
    mainline.push(options[0]);
  // Number each line before its alternatives, so a node's first child continues its line.
  const variations: Branch[] = [];
  const addLine = (first: Built, parent: number) => {
    const line: [number, Built][] = [];
    let previous = parent;
    for (let node: Built | undefined = first; node; node = node.children[0]) {
      variations.push({ ...node.ply, parent: previous });
      previous = mainline.length + variations.length;
      line.push([previous, node]);
    }
    for (const [id, node] of line) for (const branch of node.children.slice(1)) addLine(branch, id);
  };
  for (const branch of roots.slice(1)) addLine(branch, 0);
  mainline.forEach((node, index) => {
    for (const branch of node.children.slice(1)) addLine(branch, index + 1);
  });

  const declared = game.headers.get('Result') ?? '*';
  if (!RESULTS.includes(declared)) throw new Error(`Invalid PGN result ${declared}`);
  const outcome = (mainline.at(-1)?.position ?? start).outcome();
  const reached =
    outcome && (outcome.winner === 'white' ? '1-0' : outcome.winner ? '0-1' : '1/2-1/2');
  if (reached && declared !== '*' && declared !== reached)
    throw new Error(`PGN result ${declared} contradicts the final position (${reached})`);
  const result = declared === '*' && reached ? reached : declared;

  const headers = [...game.headers]
    .filter(([name, value]) => name !== 'Result' && !EMPTY_TAGS.has(value))
    .map(([name, value]) => `[${name} "${value.replace(/[\\"]/g, '\\$&')}"]`);
  return {
    variant: start.rules,
    result,
    fen,
    startPly,
    orientation: options.orientation ?? 'white',
    locale: options.locale ?? 'zh',
    plies: mainline.map(({ ply }) => ply),
    ...(variations.length > 0 && { variations }),
    // One movetext line, as Lichess exports it; readers' panels wrap it softly.
    pgn: `${[...headers, `[Result "${result}"]`].join('\n')}\n\n${[...movetext(roots, startPly), result].join(' ')}\n`,
  };
}

/**
 * Arrows for the half-moves that lead to the given positions, so diagrams
 * derive from the game. Several arrows are numbered to show their order.
 */
export function moveArrows(
  game: GamePayload,
  plies: readonly number[],
  role: ArrowRole = 'path',
): Arrow[] {
  return plies.map((ply) => {
    const { from, to } = game.plies[ply - 1];
    return {
      from,
      to,
      role,
      ...(plies.length > 1 && { label: String(moveNumber(game, ply)) }),
    };
  });
}
