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
  /** PGN comment after the move, without its `[%...]` commands. */
  readonly comment?: string;
  readonly arrows?: readonly Arrow[];
  readonly marks?: readonly Mark[];
}

/** Everything the browser needs to replay a game; serialized into the figure. */
export interface GamePayload {
  /** Full FEN of the starting position. */
  readonly fen: string;
  /** Half-moves played before the starting position: 0 for White's first move. */
  readonly startPly: number;
  readonly orientation: Color;
  readonly locale: Locale;
  readonly plies: readonly Ply[];
}

export const FILES = 'abcdefgh';

/** Full FEN of the position after the first `ply` half-moves of `plies`. */
export function fenAt(game: Pick<GamePayload, 'fen' | 'plies'>, ply: number): string {
  return ply === 0 ? game.fen : game.plies[ply - 1].fen;
}

/** Side to move in a full FEN. */
export function turnOf(fen: string): Color {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white';
}

/** Move number of the half-move that leads to position `ply`, e.g. 2 for 2.Bxb5. */
export function moveNumber(game: Pick<GamePayload, 'startPly'>, ply: number): number {
  return Math.floor((game.startPly + ply - 1) / 2) + 1;
}

/**
 * Numbered SAN for the half-moves between positions `from` and `to`,
 * e.g. "7.Kxd2 Rg8 8.Bxg8", or "6...Qxd2" when it starts with Black.
 */
export function moveText(
  game: Pick<GamePayload, 'startPly' | 'plies'>,
  from: number,
  to: number,
): string {
  return game.plies
    .slice(from, to)
    .map(({ san }, offset) => {
      const ply = from + offset + 1;
      const number = moveNumber(game, ply);
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
    step: (ply: number, total: number) => `move ${ply} of ${total}`,
    turn: (color: Color) => `${color === 'white' ? 'White' : 'Black'} to move`,
    describe: (position: string, step: string, state: string) => `${position}, ${step}. ${state}`,
  },
} as const;
