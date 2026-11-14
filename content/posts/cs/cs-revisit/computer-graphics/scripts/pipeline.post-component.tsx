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
          viewBox="0 0 600 1130"
          width="600"
          height="1130"
          role="img"
          aria-labelledby="cg-pipeline-title cg-pipeline-desc"
        >
          <title id="cg-pipeline-title">From vertices to a framebuffer</title>
          <desc id="cg-pipeline-desc">
            Vertices and primitives pass through geometry processing, clipping, perspective division
            and viewport mapping. Rasterization generates screen-space fragments, which are shaded
            and blended into framebuffer pixels. Screen-space processing retains depth and
            interpolated attributes. Tessellation and geometry shaders are optional; tessellation
            combines programmable and fixed-function stages.
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
            y="48"
            width="584"
            height="588"
            rx="12"
            className="cg-pipeline-space-geometry"
          />
          <rect
            x="8"
            y="652"
            width="584"
            height="424"
            rx="12"
            className="cg-pipeline-space-screen"
          />
          <path d="M20 644H580" className="cg-pipeline-divider" />
          <text x="24" y="82" className="cg-pipeline-heading">
            3D scene
          </text>
          <text x="24" y="112" className="cg-pipeline-label">
            Object / world /
          </text>
          <text x="24" y="134" className="cg-pipeline-label">
            camera space
          </text>
          <text x="24" y="170" className="cg-pipeline-label">
            ↓ projection
          </text>
          <text x="24" y="198" className="cg-pipeline-label">
            Clip space
          </text>
          <text x="24" y="252" className="cg-pipeline-heading">
            Vertices
          </text>
          <path d="M30 266V312" className="cg-pipeline-edge" markerEnd="url(#cg-pipeline-arrow)" />
          <text x="24" y="340" className="cg-pipeline-heading">
            Primitives
          </text>
          <text x="24" y="688" className="cg-pipeline-heading">
            Screen space
          </text>
          <text x="24" y="716" className="cg-pipeline-label">
            2D + depth
          </text>
          <text x="24" y="798" className="cg-pipeline-heading">
            Fragments
          </text>
          <path d="M30 814V992" className="cg-pipeline-edge" markerEnd="url(#cg-pipeline-arrow)" />
          <text x="24" y="1024" className="cg-pipeline-heading">
            Pixels
          </text>
          <g transform="translate(160 0)">
            <text x="135" y="26" textAnchor="middle" className="cg-pipeline-heading">
              Vertex / index buffers
            </text>
            <text x="338" y="26" textAnchor="middle" className="cg-pipeline-label">
              Output
            </text>
            <path d="M135 38V65" className="cg-pipeline-edge" markerEnd="url(#cg-pipeline-arrow)" />
            {stages.map(({ name, kind, tag }, i) => {
              const y = 76 + i * 116 + (i >= 4 ? 140 : 0);
              return (
                <g key={name}>
                  <rect
                    x="20"
                    y={y}
                    width="230"
                    height="78"
                    rx="10"
                    className={`cg-pipeline-stage cg-pipeline-${kind}`}
                  />
                  <text x="135" y={y + 31} textAnchor="middle" className="cg-pipeline-heading">
                    {name}
                  </text>
                  <text x="135" y={y + 57} textAnchor="middle" className="cg-pipeline-label">
                    {tag}
                  </text>
                  <path
                    d={`M135 ${y + 82}V${y + 106}`}
                    className="cg-pipeline-edge"
                    markerEnd="url(#cg-pipeline-arrow)"
                  />
                  <path
                    d={`M258 ${y + 39}H277`}
                    className="cg-pipeline-edge"
                    markerEnd="url(#cg-pipeline-arrow)"
                  />
                  <g transform={`translate(288 ${y - 7})`}>
                    {i < 4 ? <Geometry stage={i} /> : <Samples stage={i} />}
                  </g>
                </g>
              );
            })}
            <path
              d="M135 530V543"
              className="cg-pipeline-edge"
              markerEnd="url(#cg-pipeline-arrow)"
            />
            <rect
              x="20"
              y="548"
              width="414"
              height="74"
              rx="10"
              className="cg-pipeline-stage cg-pipeline-fixed"
            />
            <text x="36" y="576" className="cg-pipeline-heading">
              Clipping → Perspective divide
            </text>
            <text x="36" y="602" className="cg-pipeline-label">
              NDC → Viewport mapping
            </text>
            <path
              d="M135 626V670"
              className="cg-pipeline-edge"
              markerEnd="url(#cg-pipeline-arrow)"
            />
            <text x="135" y="1050" textAnchor="middle" className="cg-pipeline-heading">
              Framebuffer · 2D image
            </text>
          </g>
          <text x="300" y="1110" textAnchor="middle" className="cg-pipeline-label">
            Screen space: local work · parallel execution
          </text>
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
