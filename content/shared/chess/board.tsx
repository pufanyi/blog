import type { ReactNode } from 'react';
import {
  type Arrow,
  type ArrowRole,
  type Color,
  FILES,
  fenAt,
  type GamePayload,
  type Mark,
  type Square,
} from './model';

const CELL = 40;
const MARGIN = 18;
const VIEW = MARGIN + CELL * 8 + 4;
const ARROW_ROLES: readonly ArrowRole[] = ['path', 'option', 'threat', 'idea'];
const PIECES: Record<string, string> = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
};
/** Cburnett pieces shared by the static boards and Chessground styles. */
export const PIECE_URL = '/assets/chess/pieces';

/** Pieces from the placement field of a FEN. */
function placement(fen: string): [Square, string][] {
  return fen
    .split(' ')[0]
    .split('/')
    .flatMap((row, rowIndex) => {
      let file = 0;
      return [...row].flatMap((char): [Square, string][] => {
        if (/\d/.test(char)) {
          file += Number(char);
          return [];
        }
        file += 1;
        return [[`${FILES[file - 1]}${8 - rowIndex}` as Square, char]];
      });
    });
}

function geometry(orientation: Color) {
  const flip = orientation === 'black';
  const corner = (square: Square): [number, number] => {
    const file = FILES.indexOf(square[0]);
    const rank = Number(square[1]);
    return [MARGIN + (flip ? 7 - file : file) * CELL, (flip ? rank - 1 : 8 - rank) * CELL];
  };
  const center = (square: Square): [number, number] => {
    const [x, y] = corner(square);
    return [x + CELL / 2, y + CELL / 2];
  };
  return { flip, corner, center };
}

function ArrowLine({
  id,
  arrow,
  center,
}: {
  id: string;
  arrow: Arrow;
  center: (square: Square) => [number, number];
}) {
  const [x1, y1] = center(arrow.from);
  const [x2, y2] = center(arrow.to);
  const length = Math.hypot(x2 - x1, y2 - y1);
  // Stop short of the destination center so the head does not hide the piece.
  const trim = Math.min(15, length / 3);
  const back = (distance: number) => [
    x2 - ((x2 - x1) / length) * distance,
    y2 - ((y2 - y1) / length) * distance,
  ];
  const [ex, ey] = back(trim);
  // Like Chessground, place the label where the shaft meets the head.
  const [lx, ly] = back(trim + 6);
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={ex}
        y2={ey}
        className={`chess-arrow chess-arrow-${arrow.role}`}
        markerEnd={`url(#${id}-head-${arrow.role})`}
      />
      {arrow.label && (
        <g
          className={`chess-arrow-label chess-arrow-label-${arrow.role}`}
          transform={`translate(${lx} ${ly})`}
        >
          <circle r="7" />
          <text dy="0.35em">{arrow.label}</text>
        </g>
      )}
    </>
  );
}

/**
 * Static SVG board: the no-JavaScript, print, and Markdown representation.
 * The FEN in `<desc>` carries the position for readers who cannot see it.
 */
export function BoardSvg({
  id,
  title,
  description,
  fen,
  orientation = 'white',
  arrows = [],
  marks = [],
}: {
  id: string;
  title: string;
  description: string;
  fen: string;
  orientation?: Color;
  arrows?: readonly Arrow[];
  marks?: readonly Mark[];
}) {
  const { flip, corner, center } = geometry(orientation);
  const files = flip ? [...FILES].reverse() : [...FILES];
  const ranks = flip ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const squares: ReactNode[] = [];
  for (const rank of ranks) {
    for (const file of files) {
      const square = `${file}${rank}` as Square;
      const [x, y] = corner(square);
      const dark = (FILES.indexOf(file) + rank) % 2 === 1;
      squares.push(
        <rect
          key={square}
          x={x}
          y={y}
          width={CELL}
          height={CELL}
          className={dark ? 'chess-square-dark' : 'chess-square-light'}
        />,
      );
    }
  }
  return (
    <svg
      className="chess-board"
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
    >
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{`${description} FEN: ${fen}`}</desc>
      <defs>
        {ARROW_ROLES.map((role) => (
          <marker
            key={role}
            id={`${id}-head-${role}`}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="3.2"
            markerHeight="3.2"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className={`chess-head-${role}`} />
          </marker>
        ))}
      </defs>
      {squares}
      {marks.map(({ square, role }) => {
        const [x, y] = corner(square);
        return (
          <rect
            key={`mark-${square}`}
            x={x + 2}
            y={y + 2}
            width={CELL - 4}
            height={CELL - 4}
            className={`chess-mark-${role}`}
          />
        );
      })}
      {/* Coordinates and glyphs repeat the FEN in <desc>; keep them out of Markdown exports. */}
      <g data-agent-omit="">
        {files.map((file, index) => (
          <text
            key={`file-${file}`}
            x={MARGIN + index * CELL + CELL / 2}
            y={CELL * 8 + 13}
            className="chess-coord"
          >
            {file}
          </text>
        ))}
        {ranks.map((rank, index) => (
          <text
            key={`rank-${rank}`}
            x={MARGIN / 2}
            y={index * CELL + CELL / 2 + 4}
            className="chess-coord"
          >
            {rank}
          </text>
        ))}
        {placement(fen).map(([square, piece]) => {
          const [x, y] = corner(square);
          const white = piece === piece.toUpperCase();
          return (
            <image
              key={`piece-${square}`}
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              href={`${PIECE_URL}/${white ? 'white' : 'black'}-${PIECES[piece.toLowerCase()]}.svg`}
            />
          );
        })}
      </g>
      {arrows.map((arrow) => (
        <ArrowLine
          key={`${arrow.role}-${arrow.from}-${arrow.to}`}
          id={id}
          arrow={arrow}
          center={center}
        />
      ))}
    </svg>
  );
}

/** Chessground mount point; the browser controller reveals it and hides the SVG. */
export function GroundHost({ label }: { label: string }) {
  return <div className="chess-ground" hidden role="img" aria-label={label} />;
}

type DiagramPosition =
  | { readonly game: GamePayload; readonly ply: number; readonly fen?: never }
  | { readonly fen: string; readonly game?: never; readonly ply?: never };

/**
 * A captioned position with optional arrows and marks. Pass a game and ply to
 * derive the position from a parsed game, or a FEN for a standalone position.
 */
export function ChessDiagram({
  id,
  title,
  description,
  caption,
  orientation,
  arrows = [],
  marks = [],
  ...position
}: {
  id: string;
  title: string;
  description: string;
  caption: ReactNode;
  orientation?: Color;
  arrows?: readonly Arrow[];
  marks?: readonly Mark[];
} & DiagramPosition) {
  const fen = position.game ? fenAt(position.game, position.ply) : position.fen;
  const side = orientation ?? position.game?.orientation ?? 'white';
  return (
    <figure
      className="chess-diagram"
      data-post-enhancement="chess"
      data-chess-diagram=""
      data-fen={fen}
      data-orientation={side}
      data-arrows={JSON.stringify(arrows)}
      data-marks={JSON.stringify(marks)}
    >
      <div className="chess-diagram__board">
        <GroundHost label={description} />
        <BoardSvg
          id={id}
          title={title}
          description={description}
          fen={fen}
          orientation={side}
          arrows={arrows}
          marks={marks}
        />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
