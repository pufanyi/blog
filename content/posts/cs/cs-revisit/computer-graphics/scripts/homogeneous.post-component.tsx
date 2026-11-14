type Point3 = readonly [number, number, number];
const project = ([a, b, c]: Point3) => [210 + 60 * a - 35 * b, 320 - 25 * b - 90 * c];
const line = (a: number[], b: number[]) => `M${a.join(' ')}L${b.join(' ')}`;
const plane = [
  [-0.5, -0.5, 1],
  [3, -0.5, 1],
  [3, 2, 1],
  [-0.5, 2, 1],
] as const;
const representatives = [
  { point: [1, 1, 1] as Point3, label: 'Q', dx: 10, dy: 17 },
  { point: [2, 2, 2] as Point3, label: 'P', dx: 10, dy: -8 },
];
const section = (a: number, c: number, sheared = false) => [
  90 + 90 * (a + (sheared ? c : 0)),
  320 - 105 * c,
];

function HomogeneousCoordinatesFigure() {
  return (
    <figure className="cg-homogeneous">
      <div className="cg-homogeneous-panel">
        <h3>One point, many representatives</h3>
        <div
          className="cg-homogeneous-scroll"
          tabIndex={0}
          role="region"
          aria-label="Homogeneous coordinates diagram; scroll horizontally"
        >
          <svg
            viewBox="0 0 560 370"
            width="560"
            height="370"
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
            </defs>
            {(
              [
                [3.4, 0, 0],
                [0, 2.7, 0],
                [0, 0, 2.9],
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
            <polygon
              points={plane.map((p) => project(p).join(',')).join(' ')}
              className="cg-homogeneous-plane"
            />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <path
                  d={line(project([i, -0.5, 1]), project([i, 2, 1]))}
                  className="cg-homogeneous-grid"
                />
                <path
                  d={line(project([-0.5, i, 1]), project([3, i, 1]))}
                  className="cg-homogeneous-grid"
                />
              </g>
            ))}
            <text x="405" y="235" className="cg-homogeneous-label">
              c = 1
            </text>
            <path
              d={line(project([0, 0, 0]), project([2.5, 2.5, 2.5]))}
              className="cg-homogeneous-ray"
            />
            {representatives.map(({ point, label, dx, dy }) => {
              const [x, y] = project(point);
              return (
                <g key={label}>
                  <circle cx={x} cy={y} r="5" className="cg-homogeneous-dot" />
                  <text x={x + dx} y={y + dy}>
                    {label}
                  </text>
                </g>
              );
            })}
            <circle cx="210" cy="320" r="4" className="cg-homogeneous-origin" />
            <text x="192" y="343">
              O
            </text>
            <text x="315" y="90" className="cg-homogeneous-label">
              Divide by c
            </text>
            <path
              d="M302 101Q335 153 266 193"
              className="cg-homogeneous-axis"
              markerEnd="url(#cg-homogeneous-arrow)"
            />
          </svg>
        </div>
        <p>{String.raw`\(P=(2,2,2),\quad Q=(1,1,1)\quad\longmapsto\quad p'=(1,1).\)`}</p>
        <p>{String.raw`\((a,b,c)\sim\lambda(a,b,c),\quad \lambda\ne0;\qquad (x,y)=\left(\frac ac,\frac bc\right),\quad c\ne0.\)`}</p>
      </div>
      <div className="cg-homogeneous-panel">
        <h3>Translation is a shear in homogeneous space</h3>
        <div
          className="cg-homogeneous-scroll"
          tabIndex={0}
          role="region"
          aria-label="Translation as shear diagram; scroll horizontally"
        >
          <svg
            viewBox="0 0 560 370"
            width="560"
            height="370"
            role="img"
            aria-labelledby="cg-homogeneous-shear-title cg-homogeneous-shear-desc"
          >
            <title id="cg-homogeneous-shear-title">Shear a by c; translate x by one</title>
            <desc id="cg-homogeneous-shear-desc">
              In the b = 0 cross-section, the shear maps (a, c) to (a + c, c). The c = 0 axis stays
              fixed. At c = 1 every point shifts by one, while at c = 2 every point shifts by two.
              Dividing by c gives the same two-dimensional translation x to x + 1.
            </desc>
            <rect x="68" y="201" width="428" height="28" className="cg-homogeneous-plane" />
            <text x="470" y="192" className="cg-homogeneous-label">
              c = 1
            </text>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <path d={line(section(i, 0), section(i, 2))} className="cg-homogeneous-before" />
                <path d={line(section(0, i), section(2, i))} className="cg-homogeneous-before" />
                <path
                  d={line(section(i, 0, true), section(i, 2, true))}
                  className="cg-homogeneous-after"
                />
                <path
                  d={line(section(0, i, true), section(2, i, true))}
                  className="cg-homogeneous-after"
                />
              </g>
            ))}
            <path
              d="M68 320H510M90 337V55"
              className="cg-homogeneous-axis"
              markerEnd="url(#cg-homogeneous-arrow)"
            />
            <text x="520" y="325">
              a
            </text>
            <text x="83" y="42">
              c
            </text>
            {[1, 2].map((c) => {
              const [x, y] = section(c, c);
              const [next] = section(c, c, true);
              return (
                <g key={c}>
                  <path
                    d={`M${x + 6} ${y}H${next - 7}`}
                    className="cg-homogeneous-shift"
                    markerEnd="url(#cg-homogeneous-arrow)"
                  />
                  <circle cx={x} cy={y} r="5" className="cg-homogeneous-original-dot" />
                  <circle cx={next} cy={y} r="5" className="cg-homogeneous-dot" />
                  <text x={(x + next) / 2} y={y - 12} textAnchor="middle">
                    +{c}
                  </text>
                  <text x="68" y={y + 5}>
                    {c}
                  </text>
                </g>
              );
            })}
            <text x="75" y="343">
              0
            </text>
            <text x="330" y="346" className="cg-homogeneous-label">
              c = 0 stays fixed
            </text>
            <path d="M315 48H347" className="cg-homogeneous-before" />
            <text x="355" y="53" className="cg-homogeneous-label">
              Before
            </text>
            <path d="M420 48H452" className="cg-homogeneous-after" />
            <text x="460" y="53" className="cg-homogeneous-label">
              After
            </text>
          </svg>
        </div>
        <p>{String.raw`\(T\begin{pmatrix}a\\b\\c\end{pmatrix}=\begin{pmatrix}1&0&t_x\\0&1&t_y\\0&0&1\end{pmatrix}\begin{pmatrix}a\\b\\c\end{pmatrix}=\begin{pmatrix}a+t_xc\\b+t_yc\\c\end{pmatrix}\quad\longmapsto\quad\begin{pmatrix}x+t_x\\y+t_y\end{pmatrix}.\)`}</p>
      </div>
      <figcaption>
        Top: intersect the line with c = 1. Bottom: b = 0 cross-section, translation by (1, 0).
        Dashed: before; solid: after.
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { HomogeneousCoordinatesFigure };
