type Point3 = readonly [number, number, number];
const subtract = (a: Point3, b: Point3): Point3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Point3, b: Point3) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const cross = (a: Point3, b: Point3): Point3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v: Point3): Point3 => {
  const length = Math.sqrt(dot(v, v));
  return [v[0] / length, v[1] / length, v[2] / length];
};
// Both panels share one viewBox size, so their labels render at the same scale.
const viewBox = { width: 400, height: 320 };

// One pinhole camera preserves straight lines and equal world-space units.
const camera: Point3 = [5, -8, 8];
const forward = normalize(subtract([0.8, 0.8, 0.9], camera));
const right = normalize(cross(forward, [0, 0, 1]));
const up = cross(right, forward);
const focal = 900;
const project = (point: Point3) => {
  const relative = subtract(point, camera);
  const depth = dot(relative, forward);
  return [(focal * dot(relative, right)) / depth, (-focal * dot(relative, up)) / depth];
};
const rayViewBox = `-165 -162 ${viewBox.width} ${viewBox.height}`;
const line = (a: number[], b: number[]) => `M${a.join(' ')}L${b.join(' ')}`;
const plane = [
  [-0.5, -0.5, 1],
  [2.7, -0.5, 1],
  [2.7, 2.7, 1],
  [-0.5, 2.7, 1],
] as const;
const planeOutline = plane.map((point) => project(point).join(',')).join(' ');
const origin = project([0, 0, 0]);
const normalized = project([1, 1, 1]);
const planeLabel = project([2.55, -0.3, 1]);
const axes = [
  { end: [3.2, 0, 0] as Point3, label: 'a', dx: 10, dy: 0 },
  { end: [0, 5.7, 0] as Point3, label: 'b', dx: 8, dy: -4 },
  { end: [0, 0, 2.7] as Point3, label: 'c', dx: 9, dy: 4 },
];
// Labels sit below-right of the ray, which rises to the upper right.
const representatives = [
  { point: [1, 1, 1] as Point3, label: 'Q', dx: 14, dy: 20 },
  { point: [2, 2, 2] as Point3, label: 'P', dx: 12, dy: 20 },
];

// The b = 0 cross-section uses equal units on both axes.
const unit = 75;
const sectionOrigin = [42, 270] as const;
const section = (a: number, c: number, sheared = false) => [
  sectionOrigin[0] + unit * (a + (sheared ? c : 0)),
  sectionOrigin[1] - unit * c,
];
const triangle = (c: number) =>
  [section(0, 0), section(c, c), section(c, c, true)].map((p) => p.join(',')).join(' ');
// A direction has c = 0, so the shear (a, c) ↦ (a + c, c) leaves it unchanged.
const direction = 1.6;

function Arrowhead({ id, size = 6 }: { id: string; size?: number }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth={size}
      markerHeight={size}
      orient="auto"
    >
      <path d="M0 0L10 5L0 10Z" className="cg-homogeneous-arrow" />
    </marker>
  );
}

function HomogeneousCoordinatesFigure() {
  const [ox, oy] = sectionOrigin;
  const [dx] = section(direction, 0);
  return (
    <figure className="cg-homogeneous">
      <div className="cg-homogeneous-panels">
        <div className="cg-homogeneous-panel">
          <div className="cg-homogeneous-kicker">01 / Normalize</div>
          <div className="cg-homogeneous-panel-title">One point, many representatives</div>
          <div
            className="cg-homogeneous-scroll"
            tabIndex={0}
            role="region"
            aria-label="Homogeneous coordinates diagram; scroll horizontally"
          >
            <svg
              viewBox={rayViewBox}
              width={viewBox.width}
              height={viewBox.height}
              role="img"
              aria-labelledby="cg-homogeneous-ray-title cg-homogeneous-ray-desc"
            >
              <title id="cg-homogeneous-ray-title">
                A line through the origin meets the plane c = 1
              </title>
              <desc id="cg-homogeneous-ray-desc">
                P = (2, 2, 2) and Q = (1, 1, 1) lie on the same line through the origin O. The line
                crosses the plane c = 1 at Q, so dividing by the last coordinate maps both
                representatives to the two-dimensional point (1, 1). Parts of the axes and line
                below the plane are dashed. Only the positive half of the line is shown.
              </desc>
              <defs>
                <Arrowhead id="cg-homogeneous-arrow" />
                <clipPath id="cg-homogeneous-plane-clip">
                  <polygon points={planeOutline} />
                </clipPath>
                <linearGradient id="cg-homogeneous-plane-light" x1="0" y1="0" x2="0.4" y2="1">
                  <stop offset="0" className="cg-homogeneous-plane-far" />
                  <stop offset="1" className="cg-homogeneous-plane-near" />
                </linearGradient>
              </defs>
              {axes.map(({ end, label, dx: lx, dy: ly }) => {
                const p = project(end);
                return (
                  <g key={label}>
                    <path
                      d={line(origin, p)}
                      className="cg-homogeneous-axis"
                      markerEnd="url(#cg-homogeneous-arrow)"
                    />
                    <text x={p[0] + lx} y={p[1] + ly} className="cg-homogeneous-symbol">
                      {label}
                    </text>
                  </g>
                );
              })}
              <path d={line(origin, normalized)} className="cg-homogeneous-ray" />
              <polygon points={planeOutline} className="cg-homogeneous-perspective-plane" />
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <path
                    d={line(project([i, -0.5, 1]), project([i, 2.7, 1]))}
                    className="cg-homogeneous-perspective-grid"
                  />
                  <path
                    d={line(project([-0.5, i, 1]), project([2.7, i, 1]))}
                    className="cg-homogeneous-perspective-grid"
                  />
                </g>
              ))}
              <g clipPath="url(#cg-homogeneous-plane-clip)">
                <path
                  d={line(origin, project([0, 5.7, 0]))}
                  className="cg-homogeneous-axis cg-homogeneous-occluded"
                />
                <path
                  d={line(origin, project([0, 0, 1]))}
                  className="cg-homogeneous-axis cg-homogeneous-occluded"
                />
                <path
                  d={line(origin, normalized)}
                  className="cg-homogeneous-ray cg-homogeneous-occluded"
                />
              </g>
              <path
                d={line(project([0, 0, 1]), project([0, 0, 2.7]))}
                className="cg-homogeneous-axis"
                markerEnd="url(#cg-homogeneous-arrow)"
              />
              <path d={line(normalized, project([2.7, 2.7, 2.7]))} className="cg-homogeneous-ray" />
              <circle
                cx={normalized[0]}
                cy={normalized[1]}
                r="9"
                className="cg-homogeneous-contact"
              />
              <text
                x={planeLabel[0]}
                y={planeLabel[1]}
                textAnchor="end"
                className="cg-homogeneous-plane-label"
              >
                c = 1
              </text>
              {representatives.map(({ point, label, dx: lx, dy: ly }) => {
                const [x, y] = project(point);
                return (
                  <g key={label}>
                    <circle cx={x} cy={y} r="5" className="cg-homogeneous-node" />
                    <text x={x + lx} y={y + ly} className="cg-homogeneous-symbol">
                      {label}
                    </text>
                  </g>
                );
              })}
              <circle cx={origin[0]} cy={origin[1]} r="4" className="cg-homogeneous-origin" />
              <text x={origin[0] - 18} y={origin[1] + 22} className="cg-homogeneous-symbol">
                O
              </text>
            </svg>
          </div>
          <p>{String.raw`\((2,2,2)\sim(1,1,1)\mapsto(1,1).\)`}</p>
        </div>
        <div className="cg-homogeneous-panel">
          <div className="cg-homogeneous-kicker">02 / Transform</div>
          <div className="cg-homogeneous-panel-title">Translation as a shear</div>
          <div
            className="cg-homogeneous-scroll"
            tabIndex={0}
            role="region"
            aria-label="Translation as shear diagram; scroll horizontally"
          >
            <svg
              viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
              width={viewBox.width}
              height={viewBox.height}
              role="img"
              aria-labelledby="cg-homogeneous-shear-title cg-homogeneous-shear-desc"
            >
              <title id="cg-homogeneous-shear-title">Shear a by c; translate x by one</title>
              <desc id="cg-homogeneous-shear-desc">
                In the b = 0 cross-section, the shear maps (a, c) to (a + c, c). At c = 1 the point
                Q moves by one to Q′, while at c = 2 the point P moves by two to P′. The triangles
                OQQ′ and OPP′ are similar, so dividing by c gives the same two-dimensional
                translation x to x + 1. On the c = 0 axis the shear moves nothing: a direction
                vector is not translated.
              </desc>
              <defs>
                <Arrowhead id="cg-homogeneous-shear-arrow" />
                {/* Marker size scales with stroke width; keep the thick vector's head comparable. */}
                <Arrowhead id="cg-homogeneous-direction-arrow" size={3.4} />
              </defs>
              <polygon points={triangle(2)} className="cg-homogeneous-triangle-large" />
              <polygon points={triangle(1)} className="cg-homogeneous-triangle-small" />
              <path d={`M${ox} ${oy - unit}H${ox + unit * 4.4}`} className="cg-homogeneous-slice" />
              <text
                x={ox + unit * 4.4}
                y={oy - unit + 22}
                textAnchor="end"
                className="cg-homogeneous-label"
              >
                c = 1
              </text>
              <path
                d={`M${ox - 14} ${oy}H${ox + unit * 4.45}`}
                className="cg-homogeneous-axis"
                markerEnd="url(#cg-homogeneous-shear-arrow)"
              />
              <path
                d={`M${ox} ${oy + 14}V${oy - unit * 2.6}`}
                className="cg-homogeneous-axis"
                markerEnd="url(#cg-homogeneous-shear-arrow)"
              />
              <text x={ox + unit * 4.45 + 6} y={oy + 5} className="cg-homogeneous-symbol">
                a
              </text>
              <text x={ox - 5} y={oy - unit * 2.6 - 10} className="cg-homogeneous-symbol">
                c
              </text>
              <path
                d={line(section(0, 0), section(2.15, 2.15))}
                className="cg-homogeneous-before"
              />
              <path
                d={line(section(0, 0), section(2.15, 2.15, true))}
                className="cg-homogeneous-after"
              />
              <path
                d={`M${ox} ${oy}H${dx}`}
                className="cg-homogeneous-direction"
                markerEnd="url(#cg-homogeneous-direction-arrow)"
              />
              <text
                x={(ox + dx) / 2 + 6}
                y={oy + 24}
                textAnchor="middle"
                className="cg-homogeneous-label"
              >
                c = 0: unchanged
              </text>
              {[1, 2].map((c) => {
                const [x, y] = section(c, c);
                const [next] = section(c, c, true);
                return (
                  <g key={c}>
                    <path
                      d={`M${x + 7} ${y}H${next - 8}`}
                      className="cg-homogeneous-shift"
                      markerEnd="url(#cg-homogeneous-shear-arrow)"
                    />
                    <circle cx={x} cy={y} r="5" className="cg-homogeneous-original-dot" />
                    <circle cx={next} cy={y} r="5" className="cg-homogeneous-node" />
                    <text x={x - 9} y={y - 12} textAnchor="end" className="cg-homogeneous-symbol">
                      {c === 1 ? 'Q' : 'P'}
                    </text>
                    <text x={next + 9} y={y - 12} className="cg-homogeneous-symbol">
                      {c === 1 ? 'Q′' : 'P′'}
                    </text>
                    <text
                      x={(x + next) / 2}
                      y={y - 10}
                      textAnchor="middle"
                      className="cg-homogeneous-displacement"
                    >
                      +{c}
                    </text>
                    <text x={ox - 12} y={y + 5} textAnchor="end" className="cg-homogeneous-label">
                      {c}
                    </text>
                  </g>
                );
              })}
              <circle cx={ox} cy={oy} r="4" className="cg-homogeneous-origin" />
              <text x={ox - 12} y={oy + 22} textAnchor="end" className="cg-homogeneous-symbol">
                O
              </text>
              <g transform="translate(150 28)">
                <path d="M0 0H26" className="cg-homogeneous-before" />
                <text x="34" y="5" className="cg-homogeneous-label">
                  Before
                </text>
                <path d="M110 0H136" className="cg-homogeneous-after" />
                <text x="144" y="5" className="cg-homogeneous-label">
                  After
                </text>
              </g>
            </svg>
          </div>
          <p>{String.raw`\(\triangle OQQ^{\prime}\sim\triangle OPP^{\prime},\qquad \Delta a/c=1.\)`}</p>
        </div>
      </div>
      <div className="cg-homogeneous-equation">
        {String.raw`\[\begin{pmatrix}1&0&t_x\\0&1&t_y\\0&0&1\end{pmatrix}\begin{pmatrix}a\\b\\c\end{pmatrix}=\begin{pmatrix}a+t_xc\\b+t_yc\\c\end{pmatrix}\quad\longmapsto\quad\begin{pmatrix}x+t_x\\y+t_y\end{pmatrix}.\]`}
      </div>
      <figcaption>
        Left: every point on a line through O except O itself represents the same 2D point; dividing
        by c ≠ 0 picks the one on c = 1. Right: the b = 0 slice under translation (1, 0). The shift
        grows with c, so it is exactly one unit after division, and the c = 0 axis, where directions
        live, does not move.
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { HomogeneousCoordinatesFigure };
