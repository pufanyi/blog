interface Point {
  x: number;
  y: number;
}

const scale = 72;
const origin = { x: 125, y: 294 };
const project = ({ x, y }: Point): Point => ({
  x: origin.x + scale * x,
  y: origin.y - scale * y,
});

const a = 5 / 4;
const b = -1 / a;
const sum = a + b;
// Choose a configuration satisfying |RN|² = |PN| · |QN|, with 0 < ON < OF.
const ratio = Math.abs(sum - 1) / Math.sqrt(sum * sum + 3);
const intercept = (1 - ratio) / (1 + ratio);
const slopeMA = (2 * a) / (a * a + 1);
const slopeMB = (2 * b) / (b * b + 1);
const onParabola = (y: number): Point => ({ x: (y * y) / 4, y });
const onL = (y: number): Point => ({ x: intercept + y / 2, y });
const onRay = (slope: number, y: number): Point => ({ x: y / slope - 1, y });

const points = {
  M: { x: -1, y: 0 },
  O: { x: 0, y: 0 },
  F: { x: 1, y: 0 },
  N: onL(0),
  A: onParabola(2 * a),
  B: onParabola(2 * b),
  P: onL((2 * slopeMA * (intercept + 1)) / (2 - slopeMA)),
  Q: onL((2 * slopeMB * (intercept + 1)) / (2 - slopeMB)),
  R: onL((2 * intercept - 2) / (sum - 1)),
} satisfies Record<string, Point>;

const labels = [
  { name: 'M', dx: -10, dy: 25 },
  { name: 'O', dx: -16, dy: 25 },
  { name: 'F', dx: 13, dy: 25 },
  { name: 'N', dx: -11, dy: -14 },
  { name: 'A', dx: -17, dy: -10 },
  { name: 'B', dx: -15, dy: 26 },
  { name: 'P', dx: 20, dy: 19 },
  { name: 'Q', dx: -24, dy: 19 },
  { name: 'R', dx: 16, dy: 5 },
] as const;

function Segment({
  from,
  to,
  className,
}: {
  from: Point;
  to: Point;
  className: string;
}) {
  const start = project(from);
  const end = project(to);
  return <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={className} />;
}

function parabolaPath(lowerY: number, upperY: number): string {
  const start = project(onParabola(lowerY));
  const end = project(onParabola(upperY));
  // This quadratic Bézier traces x = y² / 4 exactly, including the vertex.
  const control = project({ x: (lowerY * upperY) / 4, y: (lowerY + upperY) / 2 });
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}

function ConicsDiagram() {
  const lLabel = project(onL(3.5));

  return (
    <figure className="conics-diagram-shell">
      <div className="conics-diagram-scroll">
        <svg
          className="conics-diagram"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 550"
          width="400"
          height="550"
          role="img"
          aria-labelledby="conics-diagram-title conics-diagram-desc"
        >
          <title id="conics-diagram-title">抛物线与焦点弦的题目示意图</title>
          <desc id="conics-diagram-desc">
            等比例直角坐标系中，抛物线 y² = 4x 的顶点为 O，焦点为 F(1, 0)，准线与 x
            轴交于 M(−1, 0)。弦 AB 经过 F。斜率为 2 的直线 l 分别与 MA、MB、AB、x
            轴交于 P、Q、R、N，且 RN² = PN · QN。N 位于 O 与 F 之间。
          </desc>
          <defs>
            <marker
              id="conics-axis-arrow"
              viewBox="0 0 10 8"
              refX="9"
              refY="4"
              markerWidth="8"
              markerHeight="7"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 10 4 L 0 8 L 2.5 4 Z" className="conics-diagram-arrow" />
            </marker>
          </defs>
          <g className="conics-diagram-axes">
            <Segment
              from={{ x: -1.5, y: 0 }}
              to={{ x: 3.45, y: 0 }}
              className="conics-diagram-axis"
            />
            <Segment
              from={{ x: 0, y: -3.1 }}
              to={{ x: 0, y: 3.8 }}
              className="conics-diagram-axis"
            />
          </g>
          <path d={parabolaPath(-3.1, 3.5)} className="conics-diagram-parabola" />
          <Segment
            from={points.M}
            to={onRay(slopeMA, 3.3)}
            className="conics-diagram-construction"
          />
          <Segment
            from={points.M}
            to={onRay(slopeMB, -3.1)}
            className="conics-diagram-construction"
          />
          <Segment from={points.A} to={points.B} className="conics-diagram-chord" />
          <Segment from={onL(-2.4)} to={onL(3.5)} className="conics-diagram-line" />
          <g className="conics-diagram-points">
            {labels.map(({ name, dx, dy }) => {
              const point = project(points[name]);
              return (
                <g key={name}>
                  <circle cx={point.x} cy={point.y} r="2.5" className="conics-diagram-point" />
                  <text x={point.x + dx} y={point.y + dy} className="conics-diagram-label">
                    {name}
                  </text>
                </g>
              );
            })}
          </g>
          <g className="conics-diagram-label">
            <text x="384" y={origin.y + 6}>
              x
            </text>
            <text x={origin.x - 16} y="24">
              y
            </text>
            <text x={lLabel.x + 16} y={lLabel.y} className="conics-diagram-line-label">
              l
            </text>
          </g>
        </svg>
      </div>
      <figcaption>
        抛物线、焦点弦与直线 <i>l</i> 的位置关系
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { ConicsDiagram };
