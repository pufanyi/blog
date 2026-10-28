import type { ReactNode } from 'react';
import {
  E4_REFUTATION,
  FILES,
  type Move,
  moveText,
  type Placement,
  parsePlacement,
  placementAfter,
  placementFen,
  type Square,
} from './e4-line';

const CELL = 40;
const MARGIN = 18;
const VIEW = MARGIN + CELL * 8 + 4;

// Filled glyphs for both colors; CSS supplies fill and outline per side.
// U+FE0E requests text presentation so the pawn is not drawn as an emoji.
const GLYPHS: Record<string, string> = {
  k: '♚︎',
  q: '♛︎',
  r: '♜︎',
  b: '♝︎',
  n: '♞︎',
  p: '♟︎',
};

type ArrowRole = 'path' | 'option';
interface Arrow {
  readonly from: Square;
  readonly to: Square;
  readonly role: ArrowRole;
}
type MarkRole = 'target' | 'area';
interface Mark {
  readonly square: Square;
  readonly role: MarkRole;
}

function corner(square: Square): [number, number] {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]);
  return [MARGIN + file * CELL, (8 - rank) * CELL];
}

function center(square: Square): [number, number] {
  const [x, y] = corner(square);
  return [x + CELL / 2, y + CELL / 2];
}

function ArrowLine({ id, arrow }: { id: string; arrow: Arrow }) {
  const [x1, y1] = center(arrow.from);
  const [x2, y2] = center(arrow.to);
  const length = Math.hypot(x2 - x1, y2 - y1);
  // Stop short of the destination center so the head does not hide the piece.
  const trim = Math.min(15, length / 3);
  const ex = x2 - ((x2 - x1) / length) * trim;
  const ey = y2 - ((y2 - y1) / length) * trim;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={ex}
      y2={ey}
      className={`anti-arrow anti-arrow-${arrow.role}`}
      markerEnd={`url(#${id}-head-${arrow.role})`}
    />
  );
}

function Board({
  id,
  title,
  description,
  caption,
  placement,
  arrows = [],
  marks = [],
}: {
  id: string;
  title: string;
  description: string;
  caption: ReactNode;
  placement: Placement;
  arrows?: readonly Arrow[];
  marks?: readonly Mark[];
}) {
  const squares: ReactNode[] = [];
  for (let rank = 8; rank >= 1; rank -= 1) {
    for (const file of FILES) {
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
          className={dark ? 'anti-square-dark' : 'anti-square-light'}
        />,
      );
    }
  }
  return (
    <figure className="anti-figure">
      <svg
        className="anti-board"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>{title}</title>
        <desc id={`${id}-desc`}>{`${description} FEN: ${placementFen(placement)}`}</desc>
        <defs>
          {(['path', 'option'] as const).map((role) => (
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
              <path d="M 0 0 L 10 5 L 0 10 z" className={`anti-head-${role}`} />
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
              className={`anti-mark-${role}`}
            />
          );
        })}
        {/* Coordinates and glyphs repeat the FEN in <desc>; keep them out of Markdown exports. */}
        <g data-agent-omit="">
          {[...FILES].map((file, index) => (
            <text
              key={`file-${file}`}
              x={MARGIN + index * CELL + CELL / 2}
              y={CELL * 8 + 13}
              className="anti-coord"
            >
              {file}
            </text>
          ))}
          {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
            <text
              key={`rank-${rank}`}
              x={MARGIN / 2}
              y={(8 - rank) * CELL + CELL / 2 + 4}
              className="anti-coord"
            >
              {rank}
            </text>
          ))}
          {[...placement].map(([square, piece]) => {
            const [x, y] = center(square);
            const white = piece === piece.toUpperCase();
            return (
              <text
                key={`piece-${square}`}
                x={x}
                y={y}
                className={`anti-piece ${white ? 'anti-piece-white' : 'anti-piece-black'}`}
              >
                {GLYPHS[piece.toLowerCase()]}
              </text>
            );
          })}
        </g>
        {arrows.map((arrow) => (
          <ArrowLine key={`${arrow.role}-${arrow.from}-${arrow.to}`} id={id} arrow={arrow} />
        ))}
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

const line = E4_REFUTATION;
/** Arrows for the given half-moves of the line, so diagrams cannot drift from it. */
const pathArrows = (plies: readonly number[]): Arrow[] =>
  plies.map((ply) => ({ from: line[ply].from, to: line[ply].to, role: 'path' }));

function E4Threat() {
  return (
    <Board
      id="anti-e4-threat"
      title="1.e4 b5 之后的局面"
      description="1.e4 打开了 f1 象的斜线，黑方把 b 兵放在这条斜线上的 b5。白方唯一合法着法是 2.Bxb5。"
      placement={placementAfter(line, 2)}
      arrows={pathArrows([2])}
      marks={[{ square: 'b5', role: 'target' }]}
      caption={`${moveText(line, 0, 2)} 之后：b5 兵在 f1 象的斜线上，2.Bxb5 是白方唯一合法着法。`}
    />
  );
}

function BishopRun() {
  return (
    <Board
      id="anti-bishop-run"
      title="白方 f1 象被迫连续吃子的路线"
      description="白象依次吃 b5、d7、e8、f7。每一步之后，象的新位置都正对下一个黑子。"
      placement={placementAfter(line, 9)}
      arrows={pathArrows([2, 4, 6, 8])}
      caption={`${moveText(line, 2, 9)}：白象每吃一次，就停在下一个必须吃的位置上。`}
    />
  );
}

function ForcedRecapture() {
  const options: Move[] = [
    line[12],
    { san: 'Nxd2', from: 'b1', to: 'd2' },
    { san: 'Bxd2', from: 'c1', to: 'd2' },
  ];
  return (
    <Board
      id="anti-recapture"
      title="6...Qxd2 之后白方的三种吃法"
      description="黑后在 d2，白方必须用王、b1 马或 c1 象吃掉它。"
      placement={placementAfter(line, 12)}
      arrows={options.map(({ from, to }) => ({ from, to, role: 'option' }))}
      marks={[{ square: 'd2', role: 'target' }]}
      caption={`${moveText(line, 9, 12)} 之后：白方只能在 Kxd2、Nxd2、Bxd2 中选择，三种都输。`}
    />
  );
}

function BishopReturn() {
  return (
    <Board
      id="anti-bishop-return"
      title="白象第二段被迫吃子路线"
      description="黑方先后把 g8 车、h7 兵、g6 兵、e4 兵送到白象面前，白象从 f7 走到 e4，之后还要吃 a8 车。"
      placement={placementAfter(line, 21)}
      arrows={pathArrows([14, 16, 18, 20])}
      marks={[{ square: 'a8', role: 'target' }]}
      caption={`${moveText(line, 12, 21)}：黑方用车和兵把白象一路引到 e4，下一步白象只能吃 a8 车。`}
    />
  );
}

function FinalStalemate() {
  return (
    <Board
      id="anti-final"
      title="终局：黑方最后一个兵被堵住"
      description="白方 Rxc5 吃掉黑方最后的象。黑方只剩 c7 兵，c6 被白象挡住，b6 和 d6 没有可吃的子，黑方没有合法着法，因此获胜。"
      placement={placementAfter(line, line.length)}
      arrows={pathArrows([line.length - 1])}
      marks={[
        { square: 'c7', role: 'target' },
        { square: 'c6', role: 'area' },
      ]}
      caption={`${moveText(line, 21, line.length)}：黑方只剩 c7 兵，前方 c6 被白象堵住，黑方无子可动而获胜。`}
    />
  );
}

function PawnGap() {
  const gap: Square[] = ['a3', 'a4', 'a5', 'a6'];
  return (
    <Board
      id="anti-pawn-gap"
      title="同一直线上相向的两个兵"
      description="白兵 a2，黑兵 a7，中间有 a3 到 a6 四个空格。无论轮到哪一方走，走棋方都输。"
      placement={parsePlacement('8/p7/8/8/8/8/P7/8')}
      marks={gap.map((square) => ({ square, role: 'area' }))}
      caption="a2 对 a7，中间四个空格。双方都不能吃子，谁先把空格走完，谁就让对方无棋可走。"
    />
  );
}

export const POST_COMPONENTS = {
  E4Threat,
  BishopRun,
  ForcedRecapture,
  BishopReturn,
  FinalStalemate,
  PawnGap,
};
