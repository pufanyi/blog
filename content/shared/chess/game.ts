// Build-time PGN parsing. Every move is replayed under the declared variant, so
// an illegal or ambiguous move fails generation instead of reaching readers.
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
  type Color,
  type GamePayload,
  type Locale,
  type Mark,
  moveNumber,
  type Ply,
  type Square,
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

function hasVariations(node: Node<PgnNodeData>): boolean {
  return node.children.length > 1 || node.children.some(hasVariations);
}

/** Parses exactly one PGN game. Throws with the move number of the first illegal move. */
export function parseGame(source: string, options: GameOptions = {}): ChessGameModel {
  const games = parsePgn(source);
  if (games.length !== 1) throw new Error(`Expected one PGN game, found ${games.length}`);
  const [game] = games;
  if (hasVariations(game.moves))
    throw new Error('PGN variations are not supported yet; keep only the main line');
  const setup = startingPosition(game.headers);
  if (setup.isErr) throw new Error(`Invalid PGN starting position: ${setup.error.message}`);
  const position = setup.value;
  const fen = makeFen(position.toSetup());
  const startPly = (position.fullmoves - 1) * 2 + (position.turn === 'black' ? 1 : 0);
  const context = { startPly };

  const plies: Ply[] = [];
  const movetext: string[] = [];
  let resume = true;
  for (const node of game.moves.mainline()) {
    const ply = plies.length + 1;
    const number = moveNumber(context, ply);
    const white = position.turn === 'white';
    const prefix = white ? `${number}.` : resume ? `${number}...` : '';
    const move = parseSan(position, node.san);
    if (!move || !('from' in move))
      throw new Error(`Illegal or unsupported move ${prefix}${node.san} in ${position.rules}`);
    let san = makeSanAndPlay(position, move);
    // Antichess has no check; chessops still marks a won game with "#".
    if (position.rules === 'antichess') san = san.replace(/[+#]$/, '');
    const notes = annotations(node.comments);
    plies.push({
      san,
      from: makeSquare(move.from) as Square,
      to: makeSquare(move.to) as Square,
      fen: makeFen(position.toSetup()),
      ...(position.isCheck() && position.rules !== 'antichess' && { check: true as const }),
      ...notes.ply,
    });
    movetext.push(prefix ? `${prefix} ${san}` : san, ...(notes.pgn ? [`{ ${notes.pgn} }`] : []));
    resume = notes.pgn !== undefined;
  }

  const declared = game.headers.get('Result') ?? '*';
  if (!RESULTS.includes(declared)) throw new Error(`Invalid PGN result ${declared}`);
  const outcome = position.outcome();
  const reached =
    outcome && (outcome.winner === 'white' ? '1-0' : outcome.winner ? '0-1' : '1/2-1/2');
  if (reached && declared !== '*' && declared !== reached)
    throw new Error(`PGN result ${declared} contradicts the final position (${reached})`);
  const result = declared === '*' && reached ? reached : declared;

  const headers = [...game.headers]
    .filter(([name, value]) => name !== 'Result' && !EMPTY_TAGS.has(value))
    .map(([name, value]) => `[${name} "${value.replace(/[\\"]/g, '\\$&')}"]`);
  return {
    variant: position.rules,
    result,
    fen,
    startPly,
    orientation: options.orientation ?? 'white',
    locale: options.locale ?? 'zh',
    plies,
    // One movetext line, as Lichess exports it; readers' panels wrap it softly.
    pgn: `${[...headers, `[Result "${result}"]`].join('\n')}\n\n${[...movetext, result].join(' ')}\n`,
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
