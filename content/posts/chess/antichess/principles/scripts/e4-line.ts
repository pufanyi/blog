// Board model shared by the article's diagrams. Moves are plain from/to
// pairs: the line below contains no castling, en passant, or promotion, so a
// move simply replaces whatever stood on the destination square.

export type Square =
  `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
export type Placement = ReadonlyMap<Square, string>;
export interface Move {
  readonly san: string;
  readonly from: Square;
  readonly to: Square;
}

export const FILES = 'abcdefgh';
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

/** Parses the piece-placement field of a FEN string. */
export function parsePlacement(fen: string): Placement {
  const placement = new Map<Square, string>();
  fen.split('/').forEach((row, rowIndex) => {
    let file = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        file += Number(char);
      } else {
        placement.set(`${FILES[file]}${8 - rowIndex}` as Square, char);
        file += 1;
      }
    }
  });
  return placement;
}

/**
 * 1.e4 b5 and the line in which White recaptures with the king on move 7.
 * Every move was checked for legality under Lichess antichess rules; the
 * final position leaves Black's only piece, the c7 pawn, without a move.
 */
export const E4_REFUTATION: readonly Move[] = [
  { san: 'e4', from: 'e2', to: 'e4' },
  { san: 'b5', from: 'b7', to: 'b5' },
  { san: 'Bxb5', from: 'f1', to: 'b5' },
  { san: 'Nf6', from: 'g8', to: 'f6' },
  { san: 'Bxd7', from: 'b5', to: 'd7' },
  { san: 'Nxe4', from: 'f6', to: 'e4' },
  { san: 'Bxe8', from: 'd7', to: 'e8' },
  { san: 'Nxf2', from: 'e4', to: 'f2' },
  { san: 'Bxf7', from: 'e8', to: 'f7' },
  { san: 'Nxd1', from: 'f2', to: 'd1' },
  { san: 'Kxd1', from: 'e1', to: 'd1' },
  { san: 'Qxd2', from: 'd8', to: 'd2' },
  { san: 'Kxd2', from: 'd1', to: 'd2' },
  { san: 'Rg8', from: 'h8', to: 'g8' },
  { san: 'Bxg8', from: 'f7', to: 'g8' },
  { san: 'e5', from: 'e7', to: 'e5' },
  { san: 'Bxh7', from: 'g8', to: 'h7' },
  { san: 'g6', from: 'g7', to: 'g6' },
  { san: 'Bxg6', from: 'h7', to: 'g6' },
  { san: 'e4', from: 'e5', to: 'e4' },
  { san: 'Bxe4', from: 'g6', to: 'e4' },
  { san: 'Be6', from: 'c8', to: 'e6' },
  { san: 'Bxa8', from: 'e4', to: 'a8' },
  { san: 'Bxa2', from: 'e6', to: 'a2' },
  { san: 'Rxa2', from: 'a1', to: 'a2' },
  { san: 'a5', from: 'a7', to: 'a5' },
  { san: 'Rxa5', from: 'a2', to: 'a5' },
  { san: 'Nc6', from: 'b8', to: 'c6' },
  { san: 'Bxc6', from: 'a8', to: 'c6' },
  { san: 'Bc5', from: 'f8', to: 'c5' },
  { san: 'Rxc5', from: 'a5', to: 'c5' },
];

/** Position after the first `plies` half-moves of `moves`. */
export function placementAfter(moves: readonly Move[], plies: number): Placement {
  const placement = new Map(parsePlacement(START_FEN));
  for (const { from, to } of moves.slice(0, plies)) {
    const piece = placement.get(from);
    if (!piece) throw new Error(`No piece on ${from}`);
    placement.delete(from);
    placement.set(to, piece);
  }
  return placement;
}

/** Numbered SAN for half-moves in [start, end), e.g. "7.Kxd2 Rg8 8.Bxg8". */
export function moveText(moves: readonly Move[], start: number, end: number): string {
  return moves
    .slice(start, end)
    .map((move, offset) => {
      const ply = start + offset;
      const number = Math.floor(ply / 2) + 1;
      if (ply % 2 === 0) return `${number}.${move.san}`;
      return offset === 0 ? `${number}...${move.san}` : move.san;
    })
    .join(' ');
}

/** FEN placement field, for figure descriptions and Markdown exports. */
export function placementFen(placement: Placement): string {
  const rows: string[] = [];
  for (let rank = 8; rank >= 1; rank -= 1) {
    let row = '';
    let empty = 0;
    for (const file of FILES) {
      const piece = placement.get(`${file}${rank}` as Square);
      if (piece) {
        row += `${empty || ''}${piece}`;
        empty = 0;
      } else {
        empty += 1;
      }
    }
    rows.push(row + (empty || ''));
  }
  return rows.join('/');
}
