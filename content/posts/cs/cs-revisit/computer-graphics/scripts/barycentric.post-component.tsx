interface Point {
  readonly x: number;
  readonly y: number;
}

const VERTEX_I: Point = { x: 116, y: 50 };
const VERTEX_J: Point = { x: 38, y: 184 };
const VERTEX_K: Point = { x: 274, y: 168 };

// Exact barycentric weights (phi_i + phi_j + phi_k = 1) used as the single source of truth.
const WEIGHTS = {
  i: 0.35,
  j: 0.2,
  k: 0.45,
} as const;

const POINT_X: Point = {
  x: WEIGHTS.i * VERTEX_I.x + WEIGHTS.j * VERTEX_J.x + WEIGHTS.k * VERTEX_K.x,
  y: WEIGHTS.i * VERTEX_I.y + WEIGHTS.j * VERTEX_J.y + WEIGHTS.k * VERTEX_K.y,
};

function fmt(value: number): string {
  return value.toFixed(1);
}

function pt(p: Point): string {
  return `${fmt(p.x)},${fmt(p.y)}`;
}

function poly(...points: readonly Point[]): string {
  return points.map(pt).join(' ');
}

function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function projectOntoLine(p: Point, a: Point, b: Point): Point {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  const t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
  return {
    x: a.x + abx * t,
    y: a.y + aby * t,
  };
}

function rightAnglePolyline(
  foot: Point,
  towardPoint: Point,
  alongBaseDir: Point,
  size = 7,
): string {
  const nx = towardPoint.x - foot.x;
  const ny = towardPoint.y - foot.y;
  const nLen = Math.hypot(nx, ny);
  const ux = nx / nLen;
  const uy = ny / nLen;

  const bLen = Math.hypot(alongBaseDir.x, alongBaseDir.y);
  const bx = alongBaseDir.x / bLen;
  const by = alongBaseDir.y / bLen;

  const c1: Point = { x: foot.x + bx * size, y: foot.y + by * size };
  const c2: Point = { x: foot.x + bx * size + ux * size, y: foot.y + by * size + uy * size };
  const c3: Point = { x: foot.x + ux * size, y: foot.y + uy * size };
  return poly(c1, c2, c3);
}

const FOOT_HI = projectOntoLine(VERTEX_I, VERTEX_J, VERTEX_K);
const FOOT_DI = projectOntoLine(POINT_X, VERTEX_J, VERTEX_K);

// Level set of constant phi_i passing through POINT_X, parallel to edge x_j x_k.
const LEVEL_LEFT = lerp(VERTEX_J, VERTEX_I, WEIGHTS.i);
const LEVEL_RIGHT = lerp(VERTEX_K, VERTEX_I, WEIGHTS.i);

const BASE_DIR: Point = { x: VERTEX_K.x - VERTEX_J.x, y: VERTEX_K.y - VERTEX_J.y };
const BASE_DIR_REV: Point = { x: -BASE_DIR.x, y: -BASE_DIR.y };

const RIGHT_ANGLE_HI = rightAnglePolyline(FOOT_HI, VERTEX_I, BASE_DIR, 7);
const RIGHT_ANGLE_DI = rightAnglePolyline(FOOT_DI, POINT_X, BASE_DIR_REV, 7);

// Label anchors inside each sub-triangle (derived from sub-triangle centroids).
const CENTROID_I: Point = {
  x: (POINT_X.x + VERTEX_J.x + VERTEX_K.x) / 3,
  y: (POINT_X.y + VERTEX_J.y + VERTEX_K.y) / 3 + 3,
};
const CENTROID_J: Point = {
  x: (POINT_X.x + VERTEX_K.x + VERTEX_I.x) / 3 + 7,
  y: (POINT_X.y + VERTEX_K.y + VERTEX_I.y) / 3 - 2,
};
const CENTROID_K: Point = {
  x: (POINT_X.x + VERTEX_I.x + VERTEX_J.x) / 3 - 2,
  y: (POINT_X.y + VERTEX_I.y + VERTEX_J.y) / 3 + 2,
};

function AreaRatioPanel() {
  return (
    <div className="cg-bary-panel">
      <svg
        viewBox="0 0 320 252"
        role="img"
        aria-label="三角形 x_i x_j x_k 被内部点 x 分为三个子三角形，各顶点对应的重心坐标等于其对边子三角形与总三角形的面积比"
      >
        <title>面积比视角：对边子三角形占比</title>
        <desc>
          内部点 x 与三个顶点 x_i、x_j、x_k 相连，将三角形划分为三个子三角形。顶点 x_i 对应的权重
          phi_i = 0.35 等于其对边子三角形 (x, x_j, x_k) 与总三角形的面积比；同理 phi_j = 0.20，phi_k
          = 0.45，三者之和为 1。
        </desc>

        <text className="cg-bary-title" x="14" y="22">
          面积比：对边子三角形占比
        </text>

        {/* Three sub-triangles tinted to match their opposite vertex */}
        <polygon className="cg-bary-sub-i" points={poly(POINT_X, VERTEX_J, VERTEX_K)} />
        <polygon className="cg-bary-sub-j" points={poly(POINT_X, VERTEX_K, VERTEX_I)} />
        <polygon className="cg-bary-sub-k" points={poly(POINT_X, VERTEX_I, VERTEX_J)} />

        {/* Internal rays from x to each vertex */}
        <line
          className="cg-bary-ray"
          x1={fmt(POINT_X.x)}
          y1={fmt(POINT_X.y)}
          x2={fmt(VERTEX_I.x)}
          y2={fmt(VERTEX_I.y)}
        />
        <line
          className="cg-bary-ray"
          x1={fmt(POINT_X.x)}
          y1={fmt(POINT_X.y)}
          x2={fmt(VERTEX_J.x)}
          y2={fmt(VERTEX_J.y)}
        />
        <line
          className="cg-bary-ray"
          x1={fmt(POINT_X.x)}
          y1={fmt(POINT_X.y)}
          x2={fmt(VERTEX_K.x)}
          y2={fmt(VERTEX_K.y)}
        />

        {/* Outer triangle border */}
        <polygon className="cg-bary-outline" points={poly(VERTEX_I, VERTEX_J, VERTEX_K)} />

        {/* Sub-triangle weight labels */}
        <text
          className="cg-bary-area-label cg-bary-role-i"
          x={fmt(CENTROID_I.x)}
          y={fmt(CENTROID_I.y)}
          textAnchor="middle"
        >
          <tspan className="cg-bary-var">φ</tspan>
          <tspan className="cg-bary-sub" dy="3">
            i
          </tspan>
          <tspan className="cg-bary-num" dy="-3">
            {' '}
            = {WEIGHTS.i.toFixed(2)}
          </tspan>
        </text>
        <text
          className="cg-bary-area-label cg-bary-role-j"
          x={fmt(CENTROID_J.x)}
          y={fmt(CENTROID_J.y)}
          textAnchor="middle"
        >
          <tspan className="cg-bary-var">φ</tspan>
          <tspan className="cg-bary-sub" dy="3">
            j
          </tspan>
          <tspan className="cg-bary-num" dy="-3">
            {' '}
            = {WEIGHTS.j.toFixed(2)}
          </tspan>
        </text>
        <text
          className="cg-bary-area-label cg-bary-role-k"
          x={fmt(CENTROID_K.x)}
          y={fmt(CENTROID_K.y)}
          textAnchor="middle"
        >
          <tspan className="cg-bary-var">φ</tspan>
          <tspan className="cg-bary-sub" dy="3">
            k
          </tspan>
          <tspan className="cg-bary-num" dy="-3">
            {' '}
            = {WEIGHTS.k.toFixed(2)}
          </tspan>
        </text>

        {/* Vertices and interior point x */}
        <circle
          className="cg-bary-vertex cg-bary-vertex-i"
          cx={fmt(VERTEX_I.x)}
          cy={fmt(VERTEX_I.y)}
          r="4.2"
        />
        <circle
          className="cg-bary-vertex cg-bary-vertex-j"
          cx={fmt(VERTEX_J.x)}
          cy={fmt(VERTEX_J.y)}
          r="4.2"
        />
        <circle
          className="cg-bary-vertex cg-bary-vertex-k"
          cx={fmt(VERTEX_K.x)}
          cy={fmt(VERTEX_K.y)}
          r="4.2"
        />
        <circle className="cg-bary-point-x" cx={fmt(POINT_X.x)} cy={fmt(POINT_X.y)} r="4.2" />

        {/* Vertex and point labels */}
        <text
          className="cg-bary-vertex-label cg-bary-role-i"
          x={fmt(VERTEX_I.x)}
          y={fmt(VERTEX_I.y - 10)}
          textAnchor="middle"
        >
          x
          <tspan className="cg-bary-sub" dy="3">
            i
          </tspan>
        </text>
        <text
          className="cg-bary-vertex-label cg-bary-role-j"
          x={fmt(VERTEX_J.x - 13)}
          y={fmt(VERTEX_J.y + 5)}
          textAnchor="middle"
        >
          x
          <tspan className="cg-bary-sub" dy="3">
            j
          </tspan>
        </text>
        <text
          className="cg-bary-vertex-label cg-bary-role-k"
          x={fmt(VERTEX_K.x + 14)}
          y={fmt(VERTEX_K.y + 5)}
          textAnchor="middle"
        >
          x
          <tspan className="cg-bary-sub" dy="3">
            k
          </tspan>
        </text>
        <text
          className="cg-bary-point-label"
          x={fmt(POINT_X.x - 2)}
          y={fmt(POINT_X.y - 10)}
          textAnchor="middle"
        >
          x
        </text>

        {/* Bottom summary strip */}
        <rect className="cg-bary-summary-bg" x="14" y="204" width="292" height="38" rx="7" />
        <text className="cg-bary-summary-accent" x="24" y="219">
          <tspan className="cg-bary-var-sm">φ</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            i
          </tspan>
          <tspan dy="-2.5"> = area(x, x</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            j
          </tspan>
          <tspan dy="-2.5">, x</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            k
          </tspan>
          <tspan dy="-2.5">) / area(x</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            i
          </tspan>
          <tspan dy="-2.5">, x</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            j
          </tspan>
          <tspan dy="-2.5">, x</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            k
          </tspan>
          <tspan dy="-2.5">) = {WEIGHTS.i.toFixed(2)}</tspan>
        </text>
        <text className="cg-bary-summary-text" x="24" y="235">
          <tspan className="cg-bary-var-sm">φ</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            i
          </tspan>
          <tspan dy="-2.5"> + </tspan>
          <tspan className="cg-bary-var-sm">φ</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            j
          </tspan>
          <tspan dy="-2.5"> + </tspan>
          <tspan className="cg-bary-var-sm">φ</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            k
          </tspan>
          <tspan dy="-2.5">
            {' '}
            = {WEIGHTS.i.toFixed(2)} + {WEIGHTS.j.toFixed(2)} + {WEIGHTS.k.toFixed(2)} = 1
          </tspan>
        </text>
      </svg>
    </div>
  );
}

function HeightRatioPanel() {
  const hiLabelX = (VERTEX_I.x + FOOT_HI.x) / 2 - 14;
  const hiLabelY = (VERTEX_I.y + FOOT_HI.y) / 2 - 2;
  const diLabelX = (POINT_X.x + FOOT_DI.x) / 2 + 10;
  const diLabelY = (POINT_X.y + FOOT_DI.y) / 2 + 4;

  return (
    <div className="cg-bary-panel">
      <svg
        viewBox="0 0 320 252"
        role="img"
        aria-label="子三角形 (x, x_j, x_k) 与总三角形 (x_i, x_j, x_k) 共享底边 x_j x_k，因此面积比化简为垂距比 d_i(x) / h_i"
      >
        <title>高度比视角：同底化为垂距比</title>
        <desc>
          高亮共享底边 x_j x_k 以及子三角形 (x, x_j, x_k)。从顶点 x_i 到底边的高为 h_i，从点 x
          到底边的垂距为 d_i(x)，过 x 平行于底边的虚线上所有点具有相同的 phi_i = d_i(x) / h_i。
        </desc>

        <text className="cg-bary-title" x="14" y="22">
          高度比：同底化为垂距比
        </text>

        {/* Base triangle fill + highlighted opposite sub-triangle */}
        <polygon className="cg-bary-tri-neutral" points={poly(VERTEX_I, VERTEX_J, VERTEX_K)} />
        <polygon className="cg-bary-sub-i" points={poly(POINT_X, VERTEX_J, VERTEX_K)} />

        {/* Level set line through x parallel to base x_j x_k */}
        <line
          className="cg-bary-level-line"
          x1={fmt(LEVEL_LEFT.x)}
          y1={fmt(LEVEL_LEFT.y)}
          x2={fmt(LEVEL_RIGHT.x)}
          y2={fmt(LEVEL_RIGHT.y)}
        />

        {/* Sub-triangle edges x-x_j and x-x_k */}
        <line
          className="cg-bary-ray-soft"
          x1={fmt(POINT_X.x)}
          y1={fmt(POINT_X.y)}
          x2={fmt(VERTEX_J.x)}
          y2={fmt(VERTEX_J.y)}
        />
        <line
          className="cg-bary-ray-soft"
          x1={fmt(POINT_X.x)}
          y1={fmt(POINT_X.y)}
          x2={fmt(VERTEX_K.x)}
          y2={fmt(VERTEX_K.y)}
        />

        {/* Outer triangle border + emphasized shared base x_j x_k */}
        <polygon className="cg-bary-outline" points={poly(VERTEX_I, VERTEX_J, VERTEX_K)} />
        <line
          className="cg-bary-shared-base"
          x1={fmt(VERTEX_J.x)}
          y1={fmt(VERTEX_J.y)}
          x2={fmt(VERTEX_K.x)}
          y2={fmt(VERTEX_K.y)}
        />

        {/* Altitude h_i and perpendicular distance d_i(x) */}
        <line
          className="cg-bary-altitude"
          x1={fmt(VERTEX_I.x)}
          y1={fmt(VERTEX_I.y)}
          x2={fmt(FOOT_HI.x)}
          y2={fmt(FOOT_HI.y)}
        />
        <polyline className="cg-bary-right-angle" points={RIGHT_ANGLE_HI} />

        <line
          className="cg-bary-distance"
          x1={fmt(POINT_X.x)}
          y1={fmt(POINT_X.y)}
          x2={fmt(FOOT_DI.x)}
          y2={fmt(FOOT_DI.y)}
        />
        <polyline className="cg-bary-right-angle-accent" points={RIGHT_ANGLE_DI} />

        {/* Altitude and distance labels */}
        <text
          className="cg-bary-measure-label"
          x={fmt(hiLabelX)}
          y={fmt(hiLabelY)}
          textAnchor="end"
        >
          h
          <tspan className="cg-bary-sub" dy="3">
            i
          </tspan>
        </text>
        <text
          className="cg-bary-measure-accent"
          x={fmt(diLabelX)}
          y={fmt(diLabelY)}
          textAnchor="start"
        >
          d
          <tspan className="cg-bary-sub" dy="3">
            i
          </tspan>
          <tspan className="cg-bary-paren" dy="-3">
            (
          </tspan>
          x<tspan className="cg-bary-paren">)</tspan>
        </text>

        {/* Subtle level-set note */}
        <text
          className="cg-bary-level-note"
          x={fmt(LEVEL_RIGHT.x + 6)}
          y={fmt(LEVEL_RIGHT.y + 3)}
          textAnchor="start"
        >
          <tspan className="cg-bary-var-xs">φ</tspan>
          <tspan className="cg-bary-sub-xs" dy="2.5">
            i
          </tspan>
          <tspan dy="-2.5"> 等值线</tspan>
        </text>

        {/* Vertices and interior point x */}
        <circle
          className="cg-bary-vertex cg-bary-vertex-i"
          cx={fmt(VERTEX_I.x)}
          cy={fmt(VERTEX_I.y)}
          r="4.2"
        />
        <circle
          className="cg-bary-vertex cg-bary-vertex-neutral"
          cx={fmt(VERTEX_J.x)}
          cy={fmt(VERTEX_J.y)}
          r="3.8"
        />
        <circle
          className="cg-bary-vertex cg-bary-vertex-neutral"
          cx={fmt(VERTEX_K.x)}
          cy={fmt(VERTEX_K.y)}
          r="3.8"
        />
        <circle className="cg-bary-point-x" cx={fmt(POINT_X.x)} cy={fmt(POINT_X.y)} r="4.2" />

        {/* Vertex and point labels */}
        <text
          className="cg-bary-vertex-label cg-bary-role-i"
          x={fmt(VERTEX_I.x)}
          y={fmt(VERTEX_I.y - 10)}
          textAnchor="middle"
        >
          x
          <tspan className="cg-bary-sub" dy="3">
            i
          </tspan>
        </text>
        <text
          className="cg-bary-vertex-label"
          x={fmt(VERTEX_J.x - 13)}
          y={fmt(VERTEX_J.y + 5)}
          textAnchor="middle"
        >
          x
          <tspan className="cg-bary-sub" dy="3">
            j
          </tspan>
        </text>
        <text
          className="cg-bary-vertex-label"
          x={fmt(VERTEX_K.x + 14)}
          y={fmt(VERTEX_K.y + 5)}
          textAnchor="middle"
        >
          x
          <tspan className="cg-bary-sub" dy="3">
            k
          </tspan>
        </text>
        <text
          className="cg-bary-point-label"
          x={fmt(POINT_X.x + 2)}
          y={fmt(POINT_X.y - 10)}
          textAnchor="middle"
        >
          x
        </text>

        {/* Bottom summary strip */}
        <rect className="cg-bary-summary-bg" x="14" y="204" width="292" height="38" rx="7" />
        <text className="cg-bary-summary-accent" x="24" y="219">
          <tspan>共享底边 </tspan>
          <tspan className="cg-bary-var-sm">x</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            j
          </tspan>
          <tspan className="cg-bary-var-sm" dy="-2.5">
            x
          </tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            k
          </tspan>
          <tspan dy="-2.5">，面积比约去底边长 = </tspan>
          <tspan className="cg-bary-var-sm">d</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            i
          </tspan>
          <tspan dy="-2.5">(x) / </tspan>
          <tspan className="cg-bary-var-sm">h</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            i
          </tspan>
        </text>
        <text className="cg-bary-summary-text" x="24" y="235">
          <tspan>边上 </tspan>
          <tspan className="cg-bary-var-sm">φ</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            i
          </tspan>
          <tspan dy="-2.5"> = 0，顶点 </tspan>
          <tspan className="cg-bary-var-sm">x</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            i
          </tspan>
          <tspan dy="-2.5"> 处 </tspan>
          <tspan className="cg-bary-var-sm">φ</tspan>
          <tspan className="cg-bary-sub-sm" dy="2.5">
            i
          </tspan>
          <tspan dy="-2.5"> = 1，沿高线性变化</tspan>
        </text>
      </svg>
    </div>
  );
}

function BarycentricCoordinatesFigure() {
  return (
    <figure className="cg-bary">
      <div className="cg-bary-panels">
        <AreaRatioPanel />
        <HeightRatioPanel />
      </div>
      <figcaption>
        Barycentric Coordinates 的两种等价几何解释（以{' '}
        <span className="math-inline">
          {String.raw`\((\phi_i, \phi_j, \phi_k) = (0.35, 0.20, 0.45)\)`}
        </span>{' '}
        为例）。左图：内部点 <span className="math-inline">{String.raw`\(x\)`}</span>{' '}
        将三角形分成三个子三角形，每个顶点的权重等于其对边子三角形的面积占比；右图：子三角形{' '}
        <span className="math-inline">{String.raw`\((x, x_j, x_k)\)`}</span> 与总三角形共享底边{' '}
        <span className="math-inline">{String.raw`\(x_j x_k\)`}</span>，因此面积比直接化简为垂距比{' '}
        <span className="math-inline">{String.raw`\(d_i(x) / h_i\)`}</span>，且平行于底边的直线构成{' '}
        <span className="math-inline">{String.raw`\(\phi_i\)`}</span> 的线性等值线。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { BarycentricCoordinatesFigure };
