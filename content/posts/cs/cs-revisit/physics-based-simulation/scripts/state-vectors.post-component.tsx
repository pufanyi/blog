interface Point {
  readonly x: number;
  readonly y: number;
}

const CANVAS = { width: 692, height: 264 } as const;

const MESH_VERTICES = {
  topLeft: { x: 38, y: 78 },
  topRight: { x: 168, y: 78 },
  center: { x: 103, y: 143 },
  bottomLeft: { x: 38, y: 208 },
  bottomRight: { x: 168, y: 208 },
} as const satisfies Record<string, Point>;

const MESH_TRIANGLES: readonly (readonly [Point, Point, Point])[] = [
  [MESH_VERTICES.topLeft, MESH_VERTICES.center, MESH_VERTICES.bottomLeft],
  [MESH_VERTICES.topLeft, MESH_VERTICES.topRight, MESH_VERTICES.center],
  [MESH_VERTICES.bottomLeft, MESH_VERTICES.center, MESH_VERTICES.bottomRight],
];

const NEUTRAL_VERTICES: readonly Point[] = [
  MESH_VERTICES.topLeft,
  MESH_VERTICES.center,
  MESH_VERTICES.bottomLeft,
];

const VECTOR_ROWS = {
  y1x: 68,
  y1y: 100,
  y2x: 138,
  y2y: 170,
  yDots: 210,
  midY: 139,
  topBracket: 46,
  bottomBracket: 234,
  pill1Y: 52,
  pill2Y: 122,
  pillHeight: 64,
} as const;

const POS_VEC = {
  eqX: 338,
  leftX: 348,
  centerX: 384,
  rightX: 420,
  pillX: 356,
  pillW: 56,
  spaceX: 430,
} as const;

const VEL_VEC = {
  eqX: 544,
  leftX: 554,
  centerX: 590,
  rightX: 626,
  pillX: 562,
  pillW: 56,
  spaceX: 636,
} as const;

function pt(p: Point): string {
  return `${p.x},${p.y}`;
}

function poly(points: readonly [Point, Point, Point]): string {
  return points.map(pt).join(' ');
}

function posStyle(p: Point): { left: string; top: string } {
  return {
    left: `${((p.x / CANVAS.width) * 100).toFixed(2)}%`,
    top: `${((p.y / CANVAS.height) * 100).toFixed(2)}%`,
  };
}

function bracketPath(x: number, side: 'left' | 'right'): string {
  const tick = side === 'left' ? 8 : -8;
  return `M ${x + tick} ${VECTOR_ROWS.topBracket} L ${x} ${VECTOR_ROWS.topBracket} L ${x} ${VECTOR_ROWS.bottomBracket} L ${x + tick} ${VECTOR_ROWS.bottomBracket}`;
}

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
    <span className={`pbs-sv-tex pbs-sv-tex-${align} ${className}`.trim()} style={posStyle(at)}>
      <span className="math-inline">{`\\(${tex}\\)`}</span>
    </span>
  );
}

function VectorBrackets({
  leftX,
  rightX,
  pillX,
  pillW,
}: {
  leftX: number;
  rightX: number;
  pillX: number;
  pillW: number;
}) {
  return (
    <g>
      <rect
        className="pbs-sv-pill pbs-sv-pill-v1"
        x={pillX}
        y={VECTOR_ROWS.pill1Y}
        width={pillW}
        height={VECTOR_ROWS.pillHeight}
        rx="8"
      />
      <rect
        className="pbs-sv-pill pbs-sv-pill-v2"
        x={pillX}
        y={VECTOR_ROWS.pill2Y}
        width={pillW}
        height={VECTOR_ROWS.pillHeight}
        rx="8"
      />
      <path className="pbs-sv-bracket" d={bracketPath(leftX, 'left')} />
      <path className="pbs-sv-bracket" d={bracketPath(rightX, 'right')} />
    </g>
  );
}

function StateVectorsFigure() {
  return (
    <figure className="pbs-sv">
      <div className="pbs-sv-panel">
        <div className="pbs-sv-scroll">
          <div className="pbs-sv-stage">
            <svg
              viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
              role="img"
              aria-label="二维三角网格的顶点坐标与速度按顶点顺序堆叠为大列向量 x 和 v，均属于 R^{2n}"
            >
              <title>将网格各顶点坐标与速度展开堆叠为全局状态向量</title>
              <desc>
                左侧为一个包含 n 个顶点的二维三角网格，其中两个代表性顶点分别标记为 (x_1x, x_1y)
                和 (x_2x, x_2y)。两条曲线箭头将它们的坐标依次映射到中间的位置列向量 x = [x_1x,
                x_1y, x_2x, x_2y, ...]^T，属于 R^{'{2n}'}；右侧以完全相同的顶点顺序并列给出速度列向量
                v = [v_1x, v_1y, v_2x, v_2y, ...]^T，同样属于 R^{'{2n}'}。
              </desc>

              <defs>
                <marker
                  id="pbs-sv-arrow-v1"
                  viewBox="0 0 10 10"
                  refX="8.2"
                  refY="5"
                  markerWidth="6.5"
                  markerHeight="6.5"
                  orient="auto-start-reverse"
                >
                  <path className="pbs-sv-arrowhead-v1" d="M 1 1.8 L 9 5 L 1 8.2 L 2.8 5 Z" />
                </marker>
                <marker
                  id="pbs-sv-arrow-v2"
                  viewBox="0 0 10 10"
                  refX="8.2"
                  refY="5"
                  markerWidth="6.5"
                  markerHeight="6.5"
                  orient="auto-start-reverse"
                >
                  <path className="pbs-sv-arrowhead-v2" d="M 1 1.8 L 9 5 L 1 8.2 L 2.8 5 Z" />
                </marker>
              </defs>

              {/* Column headers */}
              <text className="pbs-sv-heading" x="103" y="20" textAnchor="middle">
                2D Mesh
              </text>
              <text className="pbs-sv-heading" x={POS_VEC.centerX} y="20" textAnchor="middle">
                Position
              </text>
              <text className="pbs-sv-heading" x={VEL_VEC.centerX} y="20" textAnchor="middle">
                Velocity
              </text>

              {/* 2D triangular mesh */}
              {MESH_TRIANGLES.map((tri, idx) => (
                <polygon
                  key={`tri-${idx}`}
                  className={idx === 0 ? 'pbs-sv-mesh-fill-alt' : 'pbs-sv-mesh-fill'}
                  points={poly(tri)}
                />
              ))}
              {MESH_TRIANGLES.map((tri, idx) => (
                <polygon key={`edge-${idx}`} className="pbs-sv-mesh-edge" points={poly(tri)} />
              ))}

              {/* Neutral vertices */}
              {NEUTRAL_VERTICES.map((v, idx) => (
                <circle
                  key={`nv-${idx}`}
                  className="pbs-sv-vertex pbs-sv-vertex-neutral"
                  cx={v.x}
                  cy={v.y}
                  r="4.2"
                />
              ))}

              {/* Highlighted vertices 1 and 2 */}
              <circle
                className="pbs-sv-halo pbs-sv-halo-v1"
                cx={MESH_VERTICES.topRight.x}
                cy={MESH_VERTICES.topRight.y}
                r="9.5"
              />
              <circle
                className="pbs-sv-vertex pbs-sv-vertex-v1"
                cx={MESH_VERTICES.topRight.x}
                cy={MESH_VERTICES.topRight.y}
                r="5.2"
              />

              <circle
                className="pbs-sv-halo pbs-sv-halo-v2"
                cx={MESH_VERTICES.bottomRight.x}
                cy={MESH_VERTICES.bottomRight.y}
                r="9.5"
              />
              <circle
                className="pbs-sv-vertex pbs-sv-vertex-v2"
                cx={MESH_VERTICES.bottomRight.x}
                cy={MESH_VERTICES.bottomRight.y}
                r="5.2"
              />

              {/* Curved mapping arrows from vertices to stacked position vector */}
              <path
                className="pbs-sv-arrow pbs-sv-arrow-v1"
                d="M 216 52 C 260 34, 304 44, 342 78"
                markerEnd="url(#pbs-sv-arrow-v1)"
              />
              <path
                className="pbs-sv-arrow pbs-sv-arrow-v2"
                d="M 216 232 C 260 226, 298 190, 342 162"
                markerEnd="url(#pbs-sv-arrow-v2)"
              />

              {/* Position and velocity vector brackets and node-grouping pills */}
              <VectorBrackets
                leftX={POS_VEC.leftX}
                rightX={POS_VEC.rightX}
                pillX={POS_VEC.pillX}
                pillW={POS_VEC.pillW}
              />
              <VectorBrackets
                leftX={VEL_VEC.leftX}
                rightX={VEL_VEC.rightX}
                pillX={VEL_VEC.pillX}
                pillW={VEL_VEC.pillW}
              />
            </svg>

            {/* Mesh vertex coordinate labels */}
            <MathLabel
              at={{ x: MESH_VERTICES.topRight.x, y: 52 }}
              tex="(x_{1x}, x_{1y})"
              className="pbs-sv-label pbs-sv-role-v1"
            />
            <MathLabel
              at={{ x: MESH_VERTICES.bottomRight.x, y: 234 }}
              tex="(x_{2x}, x_{2y})"
              className="pbs-sv-label pbs-sv-role-v2"
            />

            {/* Position vector labels */}
            <MathLabel
              at={{ x: POS_VEC.eqX, y: VECTOR_ROWS.midY }}
              tex="x ="
              className="pbs-sv-eq"
              align="end"
            />
            <MathLabel
              at={{ x: POS_VEC.centerX, y: VECTOR_ROWS.y1x }}
              tex="x_{1x}"
              className="pbs-sv-entry pbs-sv-role-v1"
            />
            <MathLabel
              at={{ x: POS_VEC.centerX, y: VECTOR_ROWS.y1y }}
              tex="x_{1y}"
              className="pbs-sv-entry pbs-sv-role-v1"
            />
            <MathLabel
              at={{ x: POS_VEC.centerX, y: VECTOR_ROWS.y2x }}
              tex="x_{2x}"
              className="pbs-sv-entry pbs-sv-role-v2"
            />
            <MathLabel
              at={{ x: POS_VEC.centerX, y: VECTOR_ROWS.y2y }}
              tex="x_{2y}"
              className="pbs-sv-entry pbs-sv-role-v2"
            />
            <MathLabel
              at={{ x: POS_VEC.centerX, y: VECTOR_ROWS.yDots }}
              tex={String.raw`\vdots`}
              className="pbs-sv-dots"
            />
            <MathLabel
              at={{ x: POS_VEC.spaceX, y: VECTOR_ROWS.midY }}
              tex={String.raw`\in \mathbb{R}^{2n}`}
              className="pbs-sv-space"
              align="start"
            />

            {/* Velocity vector labels */}
            <MathLabel
              at={{ x: VEL_VEC.eqX, y: VECTOR_ROWS.midY }}
              tex="v ="
              className="pbs-sv-eq"
              align="end"
            />
            <MathLabel
              at={{ x: VEL_VEC.centerX, y: VECTOR_ROWS.y1x }}
              tex="v_{1x}"
              className="pbs-sv-entry pbs-sv-role-v1"
            />
            <MathLabel
              at={{ x: VEL_VEC.centerX, y: VECTOR_ROWS.y1y }}
              tex="v_{1y}"
              className="pbs-sv-entry pbs-sv-role-v1"
            />
            <MathLabel
              at={{ x: VEL_VEC.centerX, y: VECTOR_ROWS.y2x }}
              tex="v_{2x}"
              className="pbs-sv-entry pbs-sv-role-v2"
            />
            <MathLabel
              at={{ x: VEL_VEC.centerX, y: VECTOR_ROWS.y2y }}
              tex="v_{2y}"
              className="pbs-sv-entry pbs-sv-role-v2"
            />
            <MathLabel
              at={{ x: VEL_VEC.centerX, y: VECTOR_ROWS.yDots }}
              tex={String.raw`\vdots`}
              className="pbs-sv-dots"
            />
            <MathLabel
              at={{ x: VEL_VEC.spaceX, y: VECTOR_ROWS.midY }}
              tex={String.raw`\in \mathbb{R}^{2n}`}
              className="pbs-sv-space"
              align="start"
            />
          </div>
        </div>
      </div>

      <figcaption>
        以二维三角网格（<span className="math-inline">{String.raw`\(n\)`}</span>{' '}
        个顶点）为例：将每个顶点的位置分量依次堆叠为全局位置向量{' '}
        <span className="math-inline">{String.raw`\(x \in \mathbb{R}^{2n}\)`}</span>
        ，并以相同顺序堆叠各顶点速度得到{' '}
        <span className="math-inline">{String.raw`\(v \in \mathbb{R}^{2n}\)`}</span>
        （三维情形对应 <span className="math-inline">{String.raw`\(\mathbb{R}^{3n}\)`}</span>）。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { StateVectorsFigure };
