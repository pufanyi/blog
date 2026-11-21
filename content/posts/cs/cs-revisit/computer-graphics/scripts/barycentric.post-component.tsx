import {
  CANVAS,
  CENTROID_I,
  CENTROID_K,
  FOOT_DI,
  FOOT_HI,
  fmt,
  LABEL_J_POS,
  LEADER_J_FROM,
  LEADER_J_TO,
  LEVEL_LEFT,
  LEVEL_RIGHT,
  POINT_X,
  POINT_X_LABEL,
  type Point,
  poly,
  posStyle,
  RIGHT_ANGLE_DI,
  RIGHT_ANGLE_HI,
  VERTEX_I,
  VERTEX_I_LABEL,
  VERTEX_J,
  VERTEX_J_LABEL,
  VERTEX_K,
  VERTEX_K_LABEL,
  WEIGHTS,
} from './barycentric-geometry';

function MathLabel({
  at,
  tex,
  className = '',
  align = 'center',
}: {
  at: Point;
  tex: string;
  className?: string;
  align?: 'center' | 'start' | 'end';
}) {
  return (
    <span className={`cg-bary-tex cg-bary-tex-${align} ${className}`.trim()} style={posStyle(at)}>
      <span className="math-inline">{`\\(${tex}\\)`}</span>
    </span>
  );
}

function AreaRatioPanel() {
  return (
    <div className="cg-bary-panel">
      <div className="cg-bary-title">面积比：对边子三角形占比</div>
      <div className="cg-bary-canvas">
        <svg
          viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
          role="img"
          aria-label="三角形 x_i x_j x_k 被内部点 x 分为三个子三角形，各顶点对应的重心坐标等于其对边子三角形与总三角形的面积比"
        >
          <title>面积比视角：对边子三角形占比</title>
          <desc>
            内部点 x 与三个顶点 x_i、x_j、x_k 相连，将三角形划分为三个子三角形。顶点 x_i 对应的权重
            phi_i = 0.35 等于其对边子三角形 (x, x_j, x_k) 与总三角形的面积比；同理 phi_j =
            0.20，phi_k = 0.45，三者之和为 1。
          </desc>

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

          {/* Callout line from sub-triangle j into the upper-right margin */}
          <line
            className="cg-bary-leader-j"
            x1={fmt(LEADER_J_FROM.x)}
            y1={fmt(LEADER_J_FROM.y)}
            x2={fmt(LEADER_J_TO.x)}
            y2={fmt(LEADER_J_TO.y)}
          />
          <circle
            className="cg-bary-leader-dot-j"
            cx={fmt(LEADER_J_FROM.x)}
            cy={fmt(LEADER_J_FROM.y)}
            r="2.2"
          />

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
        </svg>

        {/* Sub-triangle weight labels */}
        <MathLabel
          at={CENTROID_I}
          tex={String.raw`\phi_i = ${WEIGHTS.i.toFixed(2)}`}
          className="cg-bary-area-label cg-bary-role-i"
        />
        <MathLabel
          at={LABEL_J_POS}
          tex={String.raw`\phi_j = ${WEIGHTS.j.toFixed(2)}`}
          className="cg-bary-area-label cg-bary-role-j"
          align="start"
        />
        <MathLabel
          at={CENTROID_K}
          tex={String.raw`\phi_k = ${WEIGHTS.k.toFixed(2)}`}
          className="cg-bary-area-label cg-bary-role-k"
        />

        {/* Vertex and point labels */}
        <MathLabel at={VERTEX_I_LABEL} tex="x_i" className="cg-bary-vertex-label cg-bary-role-i" />
        <MathLabel at={VERTEX_J_LABEL} tex="x_j" className="cg-bary-vertex-label cg-bary-role-j" />
        <MathLabel at={VERTEX_K_LABEL} tex="x_k" className="cg-bary-vertex-label cg-bary-role-k" />
        <MathLabel at={POINT_X_LABEL} tex="x" className="cg-bary-point-label" />
      </div>

      <div className="cg-bary-summary">
        <p className="cg-bary-summary-accent">
          <span className="math-inline">
            {String.raw`\(\phi_i = \mathrm{area}(x, x_j, x_k) / \mathrm{area}(x_i, x_j, x_k) = ${WEIGHTS.i.toFixed(2)}\)`}
          </span>
        </p>
        <p className="cg-bary-summary-text">
          <span className="math-inline">
            {String.raw`\(\phi_i + \phi_j + \phi_k = ${WEIGHTS.i.toFixed(2)} + ${WEIGHTS.j.toFixed(2)} + ${WEIGHTS.k.toFixed(2)} = 1\)`}
          </span>
        </p>
      </div>
    </div>
  );
}

function HeightRatioPanel() {
  const hiLabel: Point = {
    x: (VERTEX_I.x + FOOT_HI.x) / 2 - 8,
    y: (VERTEX_I.y + FOOT_HI.y) / 2 - 4,
  };
  const diLabel: Point = {
    x: (POINT_X.x + FOOT_DI.x) / 2 + 8,
    y: (POINT_X.y + FOOT_DI.y) / 2 + 2,
  };

  return (
    <div className="cg-bary-panel">
      <div className="cg-bary-title">高度比：同底化为垂距比</div>
      <div className="cg-bary-canvas">
        <svg
          viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
          role="img"
          aria-label="子三角形 (x, x_j, x_k) 与总三角形 (x_i, x_j, x_k) 共享底边 x_j x_k，因此面积比化简为垂距比 d_i(x) / h_i"
        >
          <title>高度比视角：同底化为垂距比</title>
          <desc>
            高亮共享底边 x_j x_k 以及子三角形 (x, x_j, x_k)。从顶点 x_i 到底边的高为 h_i，从点 x
            到底边的垂距为 d_i(x)，过 x 平行于底边的虚线上所有点具有相同的 phi_i = d_i(x) / h_i。
          </desc>

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
        </svg>

        {/* Altitude, distance, and level-set labels */}
        <MathLabel at={hiLabel} tex="h_i" className="cg-bary-measure-label" align="end" />
        <MathLabel at={diLabel} tex="d_i(x)" className="cg-bary-measure-accent" align="start" />
        <span
          className="cg-bary-tex cg-bary-tex-start cg-bary-level-note"
          style={posStyle({ x: LEVEL_RIGHT.x + 6, y: LEVEL_RIGHT.y })}
        >
          <span className="math-inline">{String.raw`\(\phi_i\)`}</span> 等值线
        </span>

        {/* Vertex and point labels */}
        <MathLabel at={VERTEX_I_LABEL} tex="x_i" className="cg-bary-vertex-label cg-bary-role-i" />
        <MathLabel at={VERTEX_J_LABEL} tex="x_j" className="cg-bary-vertex-label" />
        <MathLabel at={VERTEX_K_LABEL} tex="x_k" className="cg-bary-vertex-label" />
        <MathLabel at={POINT_X_LABEL} tex="x" className="cg-bary-point-label" />
      </div>

      <div className="cg-bary-summary">
        <p className="cg-bary-summary-accent">
          共享底边 <span className="math-inline">{String.raw`\(x_j x_k\)`}</span>
          ，面积比约去底边长 <span className="math-inline">{String.raw`\(= d_i(x) / h_i\)`}</span>
        </p>
        <p className="cg-bary-summary-text">
          边上 <span className="math-inline">{String.raw`\(\phi_i = 0\)`}</span>，顶点{' '}
          <span className="math-inline">{String.raw`\(x_i\)`}</span> 处{' '}
          <span className="math-inline">{String.raw`\(\phi_i = 1\)`}</span>，沿高线性变化
        </p>
      </div>
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
