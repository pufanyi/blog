import type { ReactNode } from 'react';

type Point = readonly [number, number];
type Kind = 'fixed' | 'shader';

// One example primitive flows through every stage. Screen-space stages use a
// 100 × 100 viewport, so the clipped polygons below also drive rasterization.
const original: readonly Point[] = [
  [48, 10],
  [12, 73],
  [86, 73],
];
const transformed: readonly Point[] = [
  [62, 14],
  [10, 58],
  [74, 86],
];
// The geometry shader emits a second triangle whose new vertex lies off-screen.
const extra: Point = [109, 42];
const emitted: readonly Point[] = [transformed[0], extra, transformed[2]];
const triangles = [transformed, emitted] as const;

const points = (vertices: readonly Point[]) => vertices.map((p) => p.join(',')).join(' ');
const midpoint = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const midpoints = transformed.map((p, i) => midpoint(p, transformed[(i + 1) % 3]));
const centroid = (vertices: readonly Point[]): Point => [
  vertices.reduce((s, p) => s + p[0], 0) / vertices.length,
  vertices.reduce((s, p) => s + p[1], 0) / vertices.length,
];

// Sutherland–Hodgman clipping against the viewport square [0, 100]².
const viewport = 100;
function clip(polygon: readonly Point[]) {
  const planes: ((p: Point) => number)[] = [
    (p) => p[0],
    (p) => viewport - p[0],
    (p) => p[1],
    (p) => viewport - p[1],
  ];
  return planes.reduce<readonly Point[]>((input, distance) => {
    const output: Point[] = [];
    input.forEach((current, i) => {
      const previous = input[(i + input.length - 1) % input.length];
      const [dc, dp] = [distance(current), distance(previous)];
      if (dc * dp < 0) {
        const t = dp / (dp - dc);
        output.push([
          previous[0] + t * (current[0] - previous[0]),
          previous[1] + t * (current[1] - previous[1]),
        ]);
      }
      if (dc >= 0) output.push(current);
    });
    return output;
  }, polygon);
}
const clipped = triangles.map(clip);

function inside(p: Point, polygon: readonly Point[]) {
  const signs = polygon.map((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  });
  return signs.every((v) => v >= 0) || signs.every((v) => v <= 0);
}

// Blending draws the fragments over existing pixels with this source alpha.
const sourceAlpha = 0.65;

// Pixels are covered when their center sample lies inside a clipped primitive.
const resolution = 12;
const cell = viewport / resolution;
const pixels = Array.from({ length: resolution * resolution }, (_, i) => {
  const x = (i % resolution) * cell;
  const y = Math.floor(i / resolution) * cell;
  const center: Point = [x + cell / 2, y + cell / 2];
  // An illustrative interpolated attribute: brighter toward the top-right vertex.
  const shade = 0.5 + 0.45 * Math.min(1, Math.max(0, (center[0] - center[1] + 40) / 140));
  return {
    x,
    y,
    center,
    covered: clipped.some((polygon) => inside(center, polygon)),
    // Pixels already in the framebuffer from an earlier draw call.
    existing: center[0] < 58 && center[1] > 50,
    shade,
  };
});

const stages: readonly { name: string; kind: Kind; optional?: boolean }[] = [
  { name: 'Input assembler', kind: 'fixed' },
  { name: 'Vertex shader', kind: 'shader' },
  { name: 'Tessellation', kind: 'shader', optional: true },
  { name: 'Geometry shader', kind: 'shader', optional: true },
  { name: 'Clip & viewport', kind: 'fixed' },
  { name: 'Rasterization', kind: 'fixed' },
  { name: 'Fragment shader', kind: 'shader' },
  { name: 'Blending', kind: 'fixed' },
];

function Vertices({ vertices }: { vertices: readonly Point[] }) {
  const [cx, cy] = centroid(vertices);
  return (
    <g>
      {vertices.map(([x, y], i) => {
        const length = Math.hypot(x - cx, y - cy);
        // Keep the off-screen vertex label inside the card, below its outgoing edges.
        const [dx, dy] = x > viewport ? [-0.2, 1.1] : [(x - cx) / length, (y - cy) / length];
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="3.2" className="cg-pipeline-point" />
            <text
              x={x + dx * 11}
              y={y + dy * 11 + 4}
              textAnchor="middle"
              className="cg-pipeline-vertex"
            >
              {i}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Geometry({ stage }: { stage: number }) {
  if (stage === 0) {
    return (
      <g>
        <polygon points={points(original)} className="cg-pipeline-mesh" />
        <Vertices vertices={original} />
      </g>
    );
  }
  if (stage === 4) {
    return (
      <g>
        <rect width={viewport} height={viewport} className="cg-pipeline-viewport" />
        {triangles.map((t, i) => (
          <polygon key={`full-${i}`} points={points(t)} className="cg-pipeline-discarded" />
        ))}
        {clipped.map((t, i) => (
          <polygon key={i} points={points(t)} className="cg-pipeline-mesh" />
        ))}
        <polygon points={points(midpoints)} className="cg-pipeline-subdivision" />
      </g>
    );
  }
  return (
    <g>
      {stage === 1 && <polygon points={points(original)} className="cg-pipeline-ghost" />}
      <polygon points={points(transformed)} className="cg-pipeline-mesh" />
      {stage >= 2 && <polygon points={points(midpoints)} className="cg-pipeline-subdivision" />}
      {stage === 3 && <polygon points={points(emitted)} className="cg-pipeline-mesh-new" />}
      <Vertices vertices={stage === 3 ? [...transformed, extra] : transformed} />
    </g>
  );
}

function Pixels({ stage }: { stage: number }) {
  const blend = stage >= 7;
  return (
    <g>
      <rect width={viewport} height={viewport} className="cg-pipeline-canvas" />
      {pixels.map(({ x, y, covered, existing, shade }) => (
        <g key={`${x}-${y}`}>
          {blend && existing && (
            <rect x={x} y={y} width={cell} height={cell} className="cg-pipeline-existing" />
          )}
          {covered && (
            <rect
              x={x}
              y={y}
              width={cell}
              height={cell}
              className={stage === 5 ? 'cg-pipeline-coverage' : 'cg-pipeline-fragment'}
              opacity={stage === 5 ? undefined : blend ? shade * sourceAlpha : shade}
            />
          )}
        </g>
      ))}
      {stage < 8 &&
        Array.from({ length: resolution - 1 }, (_, i) => (i + 1) * cell).map((v) => (
          <path key={v} d={`M${v} 0V${viewport}M0 ${v}H${viewport}`} className="cg-pipeline-cell" />
        ))}
      {stage === 5 && (
        <g>
          {clipped.map((t, i) => (
            <polygon key={i} points={points(t)} className="cg-pipeline-outline" />
          ))}
          {pixels
            .filter((p) => p.covered)
            .map(({ center: [x, y] }) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1" className="cg-pipeline-sample" />
            ))}
        </g>
      )}
      <rect width={viewport} height={viewport} className="cg-pipeline-frame" />
    </g>
  );
}

// Layout: five columns. The geometry row holds stages 0–4; the screen row
// starts in column 1 because column 0 carries its heading and the legend.
const column = (i: number) => 18 + i * 148.5;
const cardWidth = 130;
const cardHeight = 146;
const rows = { geometry: 52, screen: 288 };
const thumbnail = { x: 15, y: 38, scale: 1 };

function Card({
  x,
  y,
  title,
  className,
  children,
}: {
  x: number;
  y: number;
  title: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <g>
      <rect x={x} y={y} width={cardWidth} height={cardHeight} rx="8" className={className} />
      <text x={x + cardWidth / 2} y={y + 24} textAnchor="middle" className="cg-pipeline-card-title">
        {title}
      </text>
      <g transform={`translate(${x + thumbnail.x} ${y + thumbnail.y})`}>{children}</g>
    </g>
  );
}

const stageClass = ({ kind, optional }: (typeof stages)[number]) =>
  `cg-pipeline-stage cg-pipeline-${kind}${optional ? ' cg-pipeline-optional' : ''}`;

function Arrow({ from, to, y }: { from: number; to: number; y: number }) {
  return (
    <path
      d={`M${from + 2} ${y}H${to - 3}`}
      className="cg-pipeline-edge"
      markerEnd="url(#cg-pipeline-arrow)"
    />
  );
}

const legend = [
  { label: 'Fixed function', className: 'cg-pipeline-stage cg-pipeline-fixed' },
  { label: 'Programmable', className: 'cg-pipeline-stage cg-pipeline-shader' },
  { label: 'Optional', className: 'cg-pipeline-stage cg-pipeline-legend-optional' },
];

function GraphicsPipelineFigure() {
  const geometryStages = stages.slice(0, 5);
  const screenStages = stages.slice(5);
  const midGeometry = rows.geometry + thumbnail.y + 50;
  const midScreen = rows.screen + thumbnail.y + 50;
  const wrapY = 228;
  const output = column(4);
  return (
    <figure className="cg-pipeline">
      <div
        className="cg-pipeline-scroll"
        tabIndex={0}
        role="region"
        aria-label="Graphics pipeline; scroll horizontally"
      >
        <svg
          viewBox="0 0 760 452"
          width="760"
          height="452"
          role="img"
          aria-labelledby="cg-pipeline-title cg-pipeline-desc"
        >
          <title id="cg-pipeline-title">From vertices to a framebuffer</title>
          <desc id="cg-pipeline-desc">
            One triangle passes through the pipeline. In 3D geometry, the input assembler builds the
            triangle from vertices 0, 1 and 2; the vertex shader moves it; optional tessellation
            subdivides it; an optional geometry shader emits a second triangle whose vertex 3 lies
            outside the screen; clipping, perspective division and viewport mapping trim the
            geometry to the viewport. In screen space, rasterization marks the pixels whose centers
            lie inside the clipped triangles, the fragment shader computes their colors from
            interpolated attributes, and blending combines those colors with pixels already in the
            framebuffer, producing the final 2D image. Tessellation combines programmable and
            fixed-function stages.
          </desc>
          <defs>
            <marker
              id="cg-pipeline-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0 0L10 5L0 10Z" className="cg-pipeline-arrowhead" />
            </marker>
          </defs>
          <rect
            x="8"
            y="8"
            width="744"
            height="202"
            rx="10"
            className="cg-pipeline-space-geometry"
          />
          <rect
            x="8"
            y="244"
            width="744"
            height="200"
            rx="10"
            className="cg-pipeline-space-screen"
          />
          <text x="22" y="34" className="cg-pipeline-heading">
            3D geometry
          </text>
          <text x="134" y="34" className="cg-pipeline-label">
            vertices and triangles · object → world → camera → clip space
          </text>
          <text x="22" y="272" className="cg-pipeline-heading">
            Screen space
          </text>
          <text x="22" y="292" className="cg-pipeline-label">
            fragments → pixels
          </text>
          {geometryStages.map((stage, i) => (
            <g key={stage.name}>
              <Card
                x={column(i)}
                y={rows.geometry}
                title={stage.name}
                className={stageClass(stage)}
              >
                <Geometry stage={i} />
              </Card>
              {i < 4 && <Arrow from={column(i) + cardWidth} to={column(i + 1)} y={midGeometry} />}
            </g>
          ))}
          <path
            d={`M${output + cardWidth / 2} ${rows.geometry + cardHeight + 2}V${wrapY}H${column(1) + cardWidth / 2}V${rows.screen - 3}`}
            className="cg-pipeline-edge"
            markerEnd="url(#cg-pipeline-arrow)"
          />
          <text
            x={(column(1) + output + cardWidth) / 2}
            y={wrapY - 7}
            textAnchor="middle"
            className="cg-pipeline-wrap-label"
          >
            screen-space triangles: (x, y) + depth
          </text>
          {screenStages.map((stage, i) => (
            <g key={stage.name}>
              <Card
                x={column(i + 1)}
                y={rows.screen}
                title={stage.name}
                className={stageClass(stage)}
              >
                <Pixels stage={i + 5} />
              </Card>
              <Arrow from={column(i + 1) + cardWidth} to={column(i + 2)} y={midScreen} />
            </g>
          ))}
          <Card x={output} y={rows.screen} title="Framebuffer" className="cg-pipeline-output">
            <Pixels stage={8} />
          </Card>
          {legend.map(({ label, className }, i) => (
            <g key={label} transform={`translate(22 ${rows.screen + 44 + i * 26})`}>
              <rect width="22" height="15" rx="3" className={className} />
              <text x="32" y="12" className="cg-pipeline-legend">
                {label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption>
        One triangle from vertex buffer to framebuffer. Clip &amp; viewport = clipping, perspective
        divide to NDC, and viewport mapping. Tessellation mixes programmable and fixed stages; depth
        and stencil tests are omitted. Adapted from the{' '}
        <a href="https://docs.vulkan.org/tutorial/latest/03_Drawing_a_triangle/02_Graphics_pipeline_basics/00_Introduction.html">
          Vulkan Tutorial
        </a>
        .
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { GraphicsPipelineFigure };
