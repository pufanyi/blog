// Data shared by the build-time renderers and the browser controller. Keep this
// module free of chessops so the browser bundle receives only Chessground.

export type Square =
  `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
export type Color = 'white' | 'black';

/**
 * Arrow roles differ by pattern as well as hue. They mirror the four Lichess
 * brush colors, so `[%cal]` comments map onto them: G path, B option, R threat,
 * Y idea.
 */
export type ArrowRole = 'path' | 'option' | 'threat' | 'idea';
export interface Arrow {
  readonly from: Square;
  readonly to: Square;
  readonly role: ArrowRole;
  /** Short label drawn where the shaft meets the head, such as a move number. */
  readonly label?: string;
}
/** `target` outlines a square (Lichess red `[%csl]`); `area` tints it (other colors). */
export type MarkRole = 'target' | 'area';
export interface Mark {
  readonly square: Square;
  readonly role: MarkRole;
}

export interface Ply {
  readonly san: string;
  readonly from: Square;
  readonly to: Square;
  /** Full FEN after the move. */
  readonly fen: string;
  readonly check?: true;
  /** Move annotation from a PGN NAG $1-$6, such as `!` or `??`. */
  readonly glyph?: string;
  /** PGN comment after the move, without its `[%...]` commands. */
  readonly comment?: string;
  readonly arrows?: readonly Arrow[];
  readonly marks?: readonly Mark[];
}

/** A move off the main line, following node `parent`. */
export interface Branch extends Ply {
  readonly parent: number;
}

/**
 * Everything the browser needs to replay a game; serialized into the figure.
 *
 * Positions form a tree of numbered nodes. Node 0 is the starting position,
 * nodes 1..plies.length follow the main line (so a main-line node is its ply),
 * and variation moves continue the numbering in `variations` order. Within
 * each line the continuation comes before its alternatives, so the first child
 * of a node is always its main continuation.
 */
export interface GamePayload {
  /** Full FEN of the starting position. */
  readonly fen: string;
  /** Half-moves played before the starting position: 0 for White's first move. */
  readonly startPly: number;
  readonly orientation: Color;
  readonly locale: Locale;
  readonly plies: readonly Ply[];
  /** Variation moves, numbered after the main line; absent when there are none. */
  readonly variations?: readonly Branch[];
}

type Tree = Pick<GamePayload, 'plies' | 'variations'>;

export const FILES = 'abcdefgh';

/** The move that leads to `node`; undefined for the starting position. */
export function plyAt(game: Tree, node: number): Ply | undefined {
  const { plies } = game;
  return node <= plies.length ? plies[node - 1] : game.variations?.[node - plies.length - 1];
}

/** The node a move follows: the previous ply on the main line, or a branch's parent. */
export function parentOf(game: Tree, node: number): number {
  const { plies } = game;
  return node > plies.length ? game.variations![node - plies.length - 1].parent : node - 1;
}

/** Moves that may follow `node`: its continuation first, then the alternatives. */
export function childrenOf(game: Tree, node: number): number[] {
  const { plies } = game;
  const children = node < plies.length ? [node + 1] : [];
  game.variations?.forEach((branch, index) => {
    if (branch.parent === node) children.push(plies.length + 1 + index);
  });
  return children;
}

/** Half-moves from the starting position to `node`. */
export function depthOf(game: Tree, node: number): number {
  let steps = 0;
  let current = node;
  for (; current > game.plies.length; steps++) current = parentOf(game, current);
  return current + steps;
}

/** Full FEN at `node`; on the main line, after the first `node` half-moves. */
export function fenAt(
  game: Pick<GamePayload, 'fen' | 'plies' | 'variations'>,
  node: number,
): string {
  return node === 0 ? game.fen : plyAt(game, node)!.fen;
}

/** Side to move in a full FEN. */
export function turnOf(fen: string): Color {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white';
}

/** Move number of the half-move that leads to position `ply`, e.g. 2 for 2.Bxb5. */
export function moveNumber(game: Pick<GamePayload, 'startPly'>, ply: number): number {
  return Math.floor((game.startPly + ply - 1) / 2) + 1;
}

/** SAN with its annotation glyph, e.g. `Bxg8??`. */
export function sanText(ply: Pick<Ply, 'san' | 'glyph'>): string {
  return ply.san + (ply.glyph ?? '');
}

/** Numbered SAN of the move that leads to `node`, e.g. "6...Rxg8". */
export function moveName(game: Pick<GamePayload, 'startPly'> & Tree, node: number): string {
  const ply = depthOf(game, node);
  const white = (game.startPly + ply) % 2 === 1;
  return `${moveNumber(game, ply)}${white ? '.' : '...'}${sanText(plyAt(game, node)!)}`;
}

/**
 * Numbered SAN for the main-line half-moves between positions `from` and `to`,
 * e.g. "7.Kxd2 Rg8 8.Bxg8", or "6...Qxd2" when it starts with Black.
 */
export function moveText(
  game: Pick<GamePayload, 'startPly' | 'plies'>,
  from: number,
  to: number,
): string {
  return game.plies
    .slice(from, to)
    .map((move, offset) => {
      const ply = from + offset + 1;
      const number = moveNumber(game, ply);
      const san = sanText(move);
      if ((game.startPly + ply) % 2 === 1) return `${number}.${san}`;
      return offset === 0 ? `${number}...${san}` : san;
    })
    .join(' ');
}

export type Locale = 'zh' | 'en';
export const LABELS = {
  zh: {
    moves: '棋谱，选择走法查看局面',
    board: '棋盘（左右方向键逐步查看）：',
    first: '开局',
    previous: '上一步',
    next: '下一步',
    last: '终局',
    pgn: 'PGN',
    start: '初始局面',
    variation: (move: string) => `变化 ${move}`,
    step: (ply: number, total: number) => `第 ${ply} / ${total} 步`,
    turn: (color: Color) => `轮到${color === 'white' ? '白' : '黑'}方走棋`,
    describe: (position: string, step: string, state: string) => `${position}，${step}。${state}`,
  },
  en: {
    moves: 'Moves; choose one to show its position',
    board: 'Board (use the arrow keys to step through the game): ',
    first: 'Start',
    previous: 'Previous move',
    next: 'Next move',
    last: 'End',
    pgn: 'PGN',
    start: 'Starting position',
    variation: (move: string) => `Variation ${move}`,
    step: (ply: number, total: number) => `move ${ply} of ${total}`,
    turn: (color: Color) => `${color === 'white' ? 'White' : 'Black'} to move`,
    describe: (position: string, step: string, state: string) => `${position}, ${step}. ${state}`,
  },
} as const;
