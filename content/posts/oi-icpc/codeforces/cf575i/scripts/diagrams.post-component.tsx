interface Point {
  x: number;
  y: number;
}
type DiagramVariant = 'strip' | 'excluded';

const corner = { x: 4, y: 4 };
const length = 4;
const lowerSum = corner.x + corner.y;
const upperSum = lowerSum + length;
const right = { x: corner.x + length, y: corner.y };
const upper = { x: corner.x, y: corner.y + length };
const origin = { x: 50, y: 450 };
const scale = 32;
const project = ({ x, y }: Point): Point => ({
  x: origin.x + scale * x,
  y: origin.y - scale * y,
});
const points = (vertices: Point[]) =>
  vertices
    .map(project)
    .map(({ x, y }) => `${x},${y}`)
    .join(' ');

function MathLabel({
  x,
  y,
  tex,
  width = 110,
  muted = false,
}: {
  x: number;
  y: number;
  tex: string;
  width?: number;
  muted?: boolean;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height="36">
      <div className={`cf575i-label${muted ? ' cf575i-subtract-label' : ''}`}>{`\\(${tex}\\)`}</div>
    </foreignObject>
  );
}

function GeometryDiagram({ variant }: { variant: DiagramVariant }) {
  const excluded = variant === 'excluded';
  const prefix = `cf575i-${variant}`;
  const a = project(corner);
  const b = project(right);
  const c = project(upper);

  return (
    <figure className="cf575i-figure">
      <div className="cf575i-scroll">
        <svg
          viewBox="0 0 520 480"
          width="520"
          height="480"
          className="cf575i-diagram"
          role="img"
          aria-labelledby={`${prefix}-title ${prefix}-desc`}
        >
          <title id={`${prefix}-title`}>
            {excluded ? '减去斜带两端，留下目标三角形' : '先覆盖包含目标三角形的斜带'}
          </title>
          <desc id={`${prefix}-desc`}>
            {excluded
              ? "蓝色三角形为保留区域；两块浅棕色区域分别满足 x' < x 与 y' < y，需要扣除。三角形边界保留。"
              : "斜带满足 x+y ≤ x'+y' ≤ x+y+l。下界经过直角顶点 (x,y)，上界与三角形斜边重合。"}
          </desc>
          <defs>
            <marker
              id={`${prefix}-arrow`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="8"
              markerHeight="8"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M 1 1 L 7 4 L 1 7" className="cf575i-axis" />
            </marker>
          </defs>
          <polygon
            className="cf575i-strip"
            points={points([
              { x: 0, y: lowerSum },
              { x: 0, y: upperSum },
              { x: upperSum, y: 0 },
              { x: lowerSum, y: 0 },
            ])}
          />
          {excluded && (
            <g className="cf575i-excluded">
              <polygon
                points={points([{ x: 0, y: lowerSum }, { x: 0, y: upperSum }, upper, corner])}
              />
              <polygon
                points={points([corner, right, { x: upperSum, y: 0 }, { x: lowerSum, y: 0 }])}
              />
            </g>
          )}
          {[lowerSum, upperSum].map((sum) => (
            <polyline
              key={sum}
              points={points([
                { x: 0, y: sum },
                { x: sum, y: 0 },
              ])}
              className="cf575i-boundary"
            />
          ))}
          <polygon points={points([corner, right, upper])} className="cf575i-target" />
          <path d={`M ${origin.x} 40 V ${origin.y} H 470`} className="cf575i-axis" />
          <path
            d={`M ${origin.x} 60 V 40`}
            className="cf575i-axis"
            markerEnd={`url(#${prefix}-arrow)`}
          />
          <path
            d={`M 450 ${origin.y} H 470`}
            className="cf575i-axis"
            markerEnd={`url(#${prefix}-arrow)`}
          />
          {[a, b, c].map(({ x, y }) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r="2.8" className="cf575i-point" />
          ))}
          <MathLabel x={478} y={435} tex="x'" width={30} />
          <MathLabel x={20} y={19} tex="y'" width={30} />
          <MathLabel x={a.x - 77} y={a.y + 16} tex="(x,y)" width={75} />
          <MathLabel x={b.x + 10} y={b.y - 27} tex="(x+l,y)" />
          <MathLabel x={c.x + 10} y={c.y - 35} tex="(x,y+l)" />
          {excluded && (
            <>
              <MathLabel x={66} y={174} tex="x'<x" width={90} muted />
              <MathLabel x={278} y={382} tex="y'<y" width={90} muted />
            </>
          )}
        </svg>
      </div>
      <figcaption>
        {excluded
          ? String.raw`减去 \(x'<x\) 与 \(y'<y\) 的两块区域，保留蓝色三角形（含边界）。`
          : String.raw`先覆盖斜带：\(x+y\le x'+y'\le x+y+l\)。`}
      </figcaption>
    </figure>
  );
}

function DiagonalStripDiagram() {
  return <GeometryDiagram variant="strip" />;
}

function ExcludedRegionsDiagram() {
  return <GeometryDiagram variant="excluded" />;
}

export const POST_COMPONENTS = { DiagonalStripDiagram, ExcludedRegionsDiagram };
