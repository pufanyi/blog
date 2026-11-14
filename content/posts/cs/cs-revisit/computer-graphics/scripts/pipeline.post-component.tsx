type Point = readonly [number, number];
const original: readonly Point[] = [
  [48, 10],
  [12, 73],
  [86, 73],
];
const transformed: readonly Point[] = [
  [70, 12],
  [12, 57],
  [78, 78],
];
const extra: Point = [94, 35];
const triangles = [transformed, [transformed[0], extra, transformed[2]]] as const;
const stages = [
  {
    name: 'Input assembler',
    kind: 'fixed',
    tag: 'Fixed function',
  },
  {
    name: 'Vertex shader',
    kind: 'shader',
    tag: 'Programmable',
  },
  {
    name: 'Tessellation',
    kind: 'mixed',
    tag: 'Optional · Mixed',
  },
  {
    name: 'Geometry shader',
    kind: 'shader',
    tag: 'Optional · Programmable',
  },
  {
    name: 'Rasterization',
    kind: 'fixed',
    tag: 'Fixed function',
  },
  {
    name: 'Fragment shader',
    kind: 'shader',
    tag: 'Programmable',
  },
  {
    name: 'Color blending',
    kind: 'fixed',
    tag: 'Fixed function',
  },
] as const;
const points = (vertices: readonly Point[]) => vertices.map((p) => p.join(',')).join(' ');
const midpoint = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const midpoints = transformed.map((p, i) => midpoint(p, transformed[(i + 1) % 3]));
function inside(p: Point, triangle: readonly Point[]) {
  const signs = triangle.map((a, i) => {
    const b = triangle[(i + 1) % 3];
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  });
  return signs.every((v) => v >= 0) || signs.every((v) => v <= 0);
}
const cells = Array.from({ length: 100 }, (_, i) => {
  const x = (i % 10) * 10;
  const y = Math.floor(i / 10) * 10;
  return { x, y, covered: triangles.some((t) => inside([x + 5, y + 5], t)) };
});

function Geometry({ stage }: { stage: number }) {
  const vertices = stage === 0 ? original : transformed;
  return (
    <g>
      <polygon points={points(vertices)} className="cg-pipeline-mesh" />
      {stage >= 2 && <polygon points={points(midpoints)} className="cg-pipeline-edge" />}
      {stage === 3 && <polygon points={points(triangles[1])} className="cg-pipeline-mesh" />}
      {[...vertices, ...(stage === 3 ? [extra] : [])].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" className="cg-pipeline-point" />
          <text x={x + (x > 85 ? -10 : 6)} y={y - 5} className="cg-pipeline-vertex">
            {i}
          </text>
        </g>
      ))}
    </g>
  );
}

function Samples({ stage }: { stage: number }) {
  return (
    <g>
      <rect
        width="100"
        height="100"
        className={stage === 6 ? 'cg-pipeline-buffer' : 'cg-pipeline-grid-bg'}
      />
      {cells.map(({ x, y, covered }) => (
        <g key={`${x}-${y}`}>
          {covered && (
            <rect
              x={x}
              y={y}
              width="10"
              height="10"
              className={stage === 4 ? 'cg-pipeline-coverage' : 'cg-pipeline-color'}
              opacity={stage === 4 ? 0.7 : (0.45 + x / 180) * (stage === 6 ? 0.65 : 1)}
            />
          )}
          <rect x={x} y={y} width="10" height="10" className="cg-pipeline-cell" />
        </g>
      ))}
    </g>
  );
}

function GraphicsPipelineFigure() {
  return (
    <figure className="cg-pipeline">
      <div
        className="cg-pipeline-scroll"
        tabIndex={0}
        role="region"
        aria-label="Graphics pipeline; scroll horizontally"
      >
        <svg
          viewBox="0 0 760 480"
          width="760"
          height="480"
          role="img"
          aria-labelledby="cg-pipeline-title cg-pipeline-desc"
        >
          <title id="cg-pipeline-title">From vertices to a framebuffer</title>
          <desc id="cg-pipeline-desc">
            Read the top row left to right, then the bottom row right to left. Vertices and
            primitives pass through geometry processing, clipping, perspective division and viewport
            mapping. Rasterization generates screen-space fragments, which are shaded and blended
            into framebuffer pixels. Screen-space processing retains depth and interpolated
            attributes. Tessellation and geometry shaders are optional; tessellation combines
            programmable and fixed-function stages.
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
              <path d="M0 0L10 5L0 10Z" className="cg-pipeline-point" />
            </marker>
          </defs>
          <rect
            x="8"
            y="8"
            width="744"
            height="220"
            rx="10"
            className="cg-pipeline-space-geometry"
          />
          <rect
            x="8"
            y="286"
            width="744"
            height="184"
            rx="10"
            className="cg-pipeline-space-screen"
          />
          <text x="22" y="34" className="cg-pipeline-heading">
            3D geometry
          </text>
          <text x="190" y="34" className="cg-pipeline-label">
            Object / world / camera → clip space
          </text>
          <text x="22" y="62" className="cg-pipeline-label">
            Vertex / index buffers ↓
          </text>
          <text x="22" y="309" className="cg-pipeline-heading">
            Screen space
          </text>
          <text x="190" y="309" className="cg-pipeline-label">
            2D + depth · fragments → pixels
          </text>
          {stages.map(({ name, kind, tag }, i) => {
            const top = i < 4;
            const column = top ? i : 7 - i;
            const x = 18 + column * 185;
            const y = top ? 76 : 324;
            return (
              <g key={name}>
                <rect
                  x={x}
                  y={y}
                  width="165"
                  height="140"
                  rx="8"
                  className={`cg-pipeline-stage cg-pipeline-${kind}`}
                />
                <text
                  x={x + 82.5}
                  y={y + 23}
                  textAnchor="middle"
                  className="cg-pipeline-card-title"
                >
                  {name}
                </text>
                <text x={x + 82.5} y={y + 43} textAnchor="middle" className="cg-pipeline-card-tag">
                  {tag}
                </text>
                <g transform={`translate(${x + 50} ${y + 59}) scale(0.65)`}>
                  {top ? <Geometry stage={i} /> : <Samples stage={i} />}
                </g>
                {top && i < 3 && (
                  <path
                    d={`M${x + 168} ${y + 76}H${x + 181}`}
                    className="cg-pipeline-edge"
                    markerEnd="url(#cg-pipeline-arrow)"
                  />
                )}
                {!top && (
                  <path
                    d={`M${x - 3} ${y + 76}H${x - 17}`}
                    className="cg-pipeline-edge"
                    markerEnd="url(#cg-pipeline-arrow)"
                  />
                )}
              </g>
            );
          })}
          <path d="M655 219V239" className="cg-pipeline-edge" markerEnd="url(#cg-pipeline-arrow)" />
          <rect
            x="18"
            y="242"
            width="720"
            height="36"
            rx="6"
            className="cg-pipeline-stage cg-pipeline-fixed"
          />
          <text x="378" y="265" textAnchor="middle" className="cg-pipeline-label">
            Clipping → Perspective divide → NDC → Viewport mapping
          </text>
          <path d="M655 281V320" className="cg-pipeline-edge" markerEnd="url(#cg-pipeline-arrow)" />
          <rect x="18" y="324" width="165" height="140" rx="8" className="cg-pipeline-output" />
          <text x="100.5" y="347" textAnchor="middle" className="cg-pipeline-card-title">
            Framebuffer
          </text>
          <text x="100.5" y="367" textAnchor="middle" className="cg-pipeline-card-tag">
            2D image
          </text>
          <g transform="translate(68 383) scale(0.65)">
            <Samples stage={6} />
          </g>
        </svg>
      </div>
      <figcaption>
        3D geometry → screen-space fragments → 2D image. Depth/stencil tests omitted. Adapted from
        the{' '}
        <a href="https://docs.vulkan.org/tutorial/latest/03_Drawing_a_triangle/02_Graphics_pipeline_basics/00_Introduction.html">
          Vulkan Tutorial
        </a>
        .
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { GraphicsPipelineFigure };
