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
const camera: Point3 = [5, -8, 8];
const forward = normalize(subtract([0.8, 0.8, 0.9], camera));
const right = normalize(cross(forward, [0, 0, 1]));
const up = cross(right, forward);
// One pinhole camera preserves straight lines and equal world-space units.
const project = (point: Point3) => {
  const relative = subtract(point, camera);
  const depth = dot(relative, forward);
  return [300 + (760 * dot(relative, right)) / depth, 190 - (760 * dot(relative, up)) / depth];
};
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
const planeLabel = project([-0.5, -0.5, 1]);
const representatives = [
  { point: [1, 1, 1] as Point3, label: 'Q', dx: 10, dy: 17 },
  { point: [2, 2, 2] as Point3, label: 'P', dx: 10, dy: -8 },
];
const section = (a: number, c: number, sheared = false) => [
  100 + 90 * (a + (sheared ? c : 0)),
  310 - 90 * c,
];

function HomogeneousCoordinatesFigure() {
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
              viewBox="60 20 480 340"
              width="480"
              height="340"
              role="img"
              aria-labelledby="cg-homogeneous-ray-title cg-homogeneous-ray-desc"
            >
              <title id="cg-homogeneous-ray-title">
                A line through the origin meets the plane c = 1
              </title>
              <desc id="cg-homogeneous-ray-desc">
                P = (2, 2, 2) and Q = (1, 1, 1) lie on the same line through the origin. Dividing by
                the last coordinate maps both to the two-dimensional point (1, 1). Only the positive
                half of the line is shown.
              </desc>
              <defs>
                <marker
                  id="cg-homogeneous-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0 0L10 5L0 10Z" className="cg-homogeneous-arrow" />
                </marker>
                <clipPath id="cg-homogeneous-plane-clip">
                  <polygon points={planeOutline} />
                </clipPath>
                <linearGradient id="cg-homogeneous-plane-light" x1="0" y1="0" x2="0.4" y2="1">
                  <stop offset="0" className="cg-homogeneous-plane-far" />
                  <stop offset="1" className="cg-homogeneous-plane-near" />
                </linearGradient>
              </defs>
              {(
                [
                  [3.2, 0, 0],
                  [0, 5.7, 0],
                  [0, 0, 2.7],
                ] as Point3[]
              ).map((end, i) => {
                const p = project(end);
                return (
                  <g key={i}>
                    <path
                      d={line(project([0, 0, 0]), p)}
                      className="cg-homogeneous-axis"
                      markerEnd="url(#cg-homogeneous-arrow)"
                    />
                    <text x={p[0] + 10} y={p[1] + 5}>
                      {['a', 'b', 'c'][i]}
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
              <text x={planeLabel[0] - 16} y={planeLabel[1] - 12} className="cg-homogeneous-label">
                c = 1
              </text>
              {representatives.map(({ point, label, dx, dy }) => {
                const [x, y] = project(point);
                return (
                  <g key={label}>
                    <circle cx={x} cy={y} r="5" className="cg-homogeneous-node" />
                    <text x={x + dx} y={y + dy}>
                      {label}
                    </text>
                  </g>
                );
              })}
              <circle cx={origin[0]} cy={origin[1]} r="4" className="cg-homogeneous-origin" />
              <text x={origin[0] - 17} y={origin[1] + 23}>
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
              viewBox="60 20 480 340"
              width="480"
              height="340"
              role="img"
              aria-labelledby="cg-homogeneous-shear-title cg-homogeneous-shear-desc"
            >
              <title id="cg-homogeneous-shear-title">Shear a by c; translate x by one</title>
              <desc id="cg-homogeneous-shear-desc">
                In the b = 0 cross-section, the shear maps (a, c) to (a + c, c). The c = 0 axis
                stays fixed. At c = 1 every point shifts by one, while at c = 2 every point shifts
                by two. The triangles OQQ′ and OPP′ are similar: doubling c doubles every side,
                including the horizontal displacement. Dividing by c gives the same two-dimensional
                translation x to x + 1.
              </desc>
              <polygon
                points={[section(0, 0), section(2, 2), section(2, 2, true)]
                  .map((p) => p.join(','))
                  .join(' ')}
                className="cg-homogeneous-triangle-large"
              />
              <polygon
                points={[section(0, 0), section(1, 1), section(1, 1, true)]
                  .map((p) => p.join(','))
                  .join(' ')}
                className="cg-homogeneous-triangle-small"
              />
              <path d="M78 220H512" className="cg-homogeneous-slice" />
              <text x="480" y="243" className="cg-homogeneous-label">
                c = 1
              </text>
              <path
                d="M80 310H518"
                className="cg-homogeneous-axis"
                markerEnd="url(#cg-homogeneous-arrow)"
              />
              <path
                d="M100 325V65"
                className="cg-homogeneous-axis"
                markerEnd="url(#cg-homogeneous-arrow)"
              />
              <text x="524" y="316">
                a
              </text>
              <text x="94" y="53">
                c
              </text>
              <path d={line(section(0, 0), section(2.2, 2.2))} className="cg-homogeneous-before" />
              <path
                d={line(section(0, 0), section(2.2, 2.2, true))}
                className="cg-homogeneous-after"
              />
              {[1, 2].map((c) => {
                const [x, y] = section(c, c);
                const [next] = section(c, c, true);
                return (
                  <g key={c}>
                    <path
                      d={`M${x + 7} ${y}H${next - 8}`}
                      className="cg-homogeneous-shift"
                      markerEnd="url(#cg-homogeneous-arrow)"
                    />
                    <circle cx={x} cy={y} r="5" className="cg-homogeneous-original-dot" />
                    <circle cx={next} cy={y} r="5" className="cg-homogeneous-node" />
                    <text x={x - 10} y={y - 15} textAnchor="end">
                      {c === 1 ? 'Q' : 'P'}
                    </text>
                    <text x={next + 10} y={y - 15}>
                      {c === 1 ? 'Q′' : 'P′'}
                    </text>
                    <text
                      x={(x + next) / 2}
                      y={y - 12}
                      textAnchor="middle"
                      className="cg-homogeneous-displacement"
                    >
                      +{c}
                    </text>
                    <text x="80" y={y + 5} textAnchor="end" className="cg-homogeneous-label">
                      {c}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="310" r="4" className="cg-homogeneous-origin" />
              <text x="84" y="337">
                O
              </text>
              <path d="M200 55H227" className="cg-homogeneous-before" />
              <text x="236" y="60" className="cg-homogeneous-label">
                Before
              </text>
              <path d="M348 55H375" className="cg-homogeneous-after" />
              <text x="384" y="60" className="cg-homogeneous-label">
                After
              </text>
            </svg>
          </div>
          <p>{String.raw`\(\triangle OQQ^{\prime}\sim\triangle OPP^{\prime},\qquad \Delta a/c=1.\)`}</p>
        </div>
      </div>
      <div className="cg-homogeneous-equation">
        {String.raw`\[\begin{pmatrix}1&0&t_x\\0&1&t_y\\0&0&1\end{pmatrix}\begin{pmatrix}a\\b\\c\end{pmatrix}=\begin{pmatrix}a+t_xc\\b+t_yc\\c\end{pmatrix}\quad\longmapsto\quad\begin{pmatrix}x+t_x\\y+t_y\end{pmatrix}.\]`}
      </div>
      <figcaption>
        Normalize by c ≠ 0. Right: b = 0, translation (1, 0); dashed ray = before, solid ray =
        after.
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { HomogeneousCoordinatesFigure };
