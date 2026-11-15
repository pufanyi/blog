type Vec3 = readonly [number, number, number];
// Quaternion stored as [w, x, y, z] = w + x*i + y*j + z*k.
type Quat = readonly [number, number, number, number];

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v: Vec3): Vec3 => {
  const len = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
};

const qMul = ([w1, x1, y1, z1]: Quat, [w2, x2, y2, z2]: Quat): Quat => [
  w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
  w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
  w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
  w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
];

const qConj = ([w, x, y, z]: Quat): Quat => [w, -x, -y, -z];

const qRotate = (q: Quat, v: Vec3): Vec3 => {
  const [, x, y, z] = qMul(qMul(q, [0, v[0], v[1], v[2]]), qConj(q));
  return [x, y, z];
};

const axisAngleQuat = (axis: Vec3, rad: number): Quat => {
  const u = normalize(axis);
  const half = rad / 2;
  const s = Math.sin(half);
  return [Math.cos(half), u[0] * s, u[1] * s, u[2] * s];
};

// Shared right-handed camera looking at the origin from the (+i, +j, +k) octant.
const viewDir = normalize([6.8, 5.4, 4.1]);
const camDistance = 12;
const cameraPos = scale(viewDir, camDistance);
const camForward = scale(viewDir, -1);
const camRight = normalize(cross(camForward, [0, 0, 1]));
const camUp = cross(camRight, camForward);
const lightDir = normalize([0.42, 0.25, 0.87]);

const project = (p: Vec3, cx: number, cy: number, radius: number): readonly [number, number] => {
  const rel = sub(p, cameraPos);
  const depth = dot(rel, camForward);
  const persp = camDistance / depth;
  return [cx + radius * persp * dot(rel, camRight), cy - radius * persp * dot(rel, camUp)];
};

const fmtPt = ([x, y]: readonly [number, number]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const linePath = (a: readonly [number, number], b: readonly [number, number]) =>
  `M${fmtPt(a)}L${fmtPt(b)}`;

const sampleArc = (
  from: Vec3,
  to: Vec3,
  cx: number,
  cy: number,
  radius: number,
  trimStart = 0.09,
  trimEnd = 0.09,
  steps = 28,
) => {
  const u = normalize(from);
  const v = normalize(to);
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(u, v))));
  const pts: (readonly [number, number])[] = [];
  for (let s = 0; s <= steps; s += 1) {
    const t = trimStart + ((1 - trimStart - trimEnd) * s) / steps;
    const theta = angle * t;
    const p = add(scale(u, Math.cos(theta)), scale(v, Math.sin(theta)));
    pts.push(project(p, cx, cy, radius));
  }
  return `M${pts.map(fmtPt).join('L')}`;
};

const sampleCircle = (u: Vec3, v: Vec3, cx: number, cy: number, radius: number, steps = 64) => {
  const pts: (readonly [number, number])[] = [];
  for (let s = 0; s <= steps; s += 1) {
    const theta = (2 * Math.PI * s) / steps;
    const p = add(scale(u, Math.cos(theta)), scale(v, Math.sin(theta)));
    pts.push(project(p, cx, cy, radius));
  }
  return `M${pts.map(fmtPt).join('L')}Z`;
};

const viewBox = { width: 400, height: 320 };
const sphereCenter = [200, 168] as const;
const sphereRadius = 104;

interface AxisDef {
  id: 'i' | 'j' | 'k';
  vec: Vec3;
  posLabelOffset: readonly [number, number];
  negLabelOffset: readonly [number, number];
}

const basisAxes: readonly AxisDef[] = [
  { id: 'i', vec: [1, 0, 0], posLabelOffset: [-15, 11], negLabelOffset: [12, -7] },
  { id: 'j', vec: [0, 1, 0], posLabelOffset: [15, 10], negLabelOffset: [-15, 16] },
  { id: 'k', vec: [0, 0, 1], posLabelOffset: [0, -15], negLabelOffset: [0, 19] },
];

interface ArcDef {
  id: string;
  role: 'i' | 'j' | 'k';
  from: Vec3;
  to: Vec3;
  dashed?: boolean;
  label: string;
  labelPoint: Vec3;
  labelOffset: readonly [number, number];
  anchor?: 'start' | 'middle' | 'end';
}

// Each arc lies on the unit circle orthogonal to its rotation axis:
// left-multiplying by u rotates the perpendicular plane by +90° (right-hand rule around +u).
const rotationArcs: readonly ArcDef[] = [
  {
    id: 'ij',
    role: 'i',
    from: [0, 1, 0],
    to: [0, 0, 1],
    label: 'ij = k',
    labelPoint: [0, Math.SQRT1_2, Math.SQRT1_2],
    labelOffset: [14, -4],
    anchor: 'start',
  },
  {
    id: 'ik',
    role: 'i',
    from: [0, 0, 1],
    to: [0, -1, 0],
    dashed: true,
    label: 'ik = −j',
    labelPoint: [0, -Math.SQRT1_2, Math.SQRT1_2],
    labelOffset: [-10, -8],
    anchor: 'end',
  },
  {
    id: 'jk',
    role: 'j',
    from: [0, 0, 1],
    to: [1, 0, 0],
    label: 'jk = i',
    labelPoint: [Math.SQRT1_2, 0, Math.SQRT1_2],
    labelOffset: [-13, 3],
    anchor: 'end',
  },
  {
    id: 'ki',
    role: 'k',
    from: [1, 0, 0],
    to: [0, 1, 0],
    label: 'ki = j',
    labelPoint: [Math.SQRT1_2, Math.SQRT1_2, 0],
    labelOffset: [4, 21],
    anchor: 'middle',
  },
];

// Panel 2: asymmetric 3D triad block (hub + tapered +i nose, wide +j wing, tall +k fin).
interface HexPart {
  role: 'hub' | 'i' | 'j' | 'k';
  center: Vec3;
  corners: readonly Vec3[];
}

const makeBox = (
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
): readonly Vec3[] => [
  [x0, y0, z0],
  [x1, y0, z0],
  [x1, y1, z0],
  [x0, y1, z0],
  [x0, y0, z1],
  [x1, y0, z1],
  [x1, y1, z1],
  [x0, y1, z1],
];

const blockParts: readonly HexPart[] = [
  {
    role: 'hub',
    center: [0, 0, 0],
    corners: makeBox(-0.24, 0.24, -0.24, 0.24, -0.24, 0.24),
  },
  {
    role: 'i',
    center: [0.58, 0, 0],
    // Tapered +i nose so its tip reads distinctly from the other two arms.
    corners: [
      [0.24, -0.16, -0.16],
      [0.92, -0.05, -0.05],
      [0.92, 0.05, -0.05],
      [0.24, 0.16, -0.16],
      [0.24, -0.16, 0.16],
      [0.92, -0.05, 0.05],
      [0.92, 0.05, 0.05],
      [0.24, 0.16, 0.16],
    ],
  },
  {
    role: 'j',
    center: [0, 0.51, 0],
    corners: makeBox(-0.16, 0.16, 0.24, 0.78, -0.09, 0.09),
  },
  {
    role: 'k',
    center: [0, 0, 0.56],
    corners: makeBox(-0.15, 0.15, -0.08, 0.08, 0.24, 0.88),
  },
];

// Outward CCW vertex indices for the 6 faces of a hexahedron.
const hexFaces: readonly (readonly [number, number, number, number])[] = [
  [0, 3, 2, 1],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [3, 7, 6, 2],
  [0, 4, 7, 3],
  [1, 2, 6, 5],
];

const shadeFromNormal = (normal: Vec3) => {
  const lit = dot(normal, lightDir);
  if (lit > 0.52) return 'light';
  if (lit > -0.15) return 'mid';
  return 'dark';
};

function OrientedBlock({
  quat,
  cx,
  cy,
  radius = 35,
}: {
  quat: Quat;
  cx: number;
  cy: number;
  radius?: number;
}) {
  // Separating planes pass cleanly between hub and each arm, so sorting parts by center depth is exact.
  const orderedParts = blockParts
    .map((part) => {
      const worldCenter = qRotate(quat, part.center);
      const worldCorners = part.corners.map((c) => qRotate(quat, c));
      const faces = hexFaces
        .map((indices) => {
          const pts3 = indices.map((idx) => worldCorners[idx]);
          const normal = normalize(cross(sub(pts3[1], pts3[0]), sub(pts3[2], pts3[0])));
          if (dot(normal, viewDir) <= 0) return null;
          return {
            key: indices.join('-'),
            points: pts3.map((p) => fmtPt(project(p, cx, cy, radius))).join(' '),
            shade: shadeFromNormal(normal),
          };
        })
        .filter((face): face is NonNullable<typeof face> => face !== null);
      return {
        role: part.role,
        depth: dot(worldCenter, viewDir),
        faces,
      };
    })
    .sort((a, b) => a.depth - b.depth);

  // Faint fixed world reference triad behind each station so orientation changes are easy to compare.
  const refOrigin = project([0, 0, 0], cx, cy, radius);
  const refEnds = (
    [
      ['i', [1.05, 0, 0]],
      ['j', [0, 1.05, 0]],
      ['k', [0, 0, 1.05]],
    ] as const
  ).map(([id, vec]) => ({
    id,
    end: project(vec, cx, cy, radius),
  }));

  return (
    <g>
      {refEnds.map(({ id, end }) => (
        <path
          key={id}
          d={linePath(refOrigin, end)}
          className={`cg-quat-ref-axis cg-quat-ref-${id}`}
        />
      ))}
      {orderedParts.map((part) => (
        <g key={part.role} className={`cg-quat-part cg-quat-part-${part.role}`}>
          {part.faces.map((face) => (
            <polygon
              key={face.key}
              points={face.points}
              className={`cg-quat-face cg-quat-face-${face.shade}`}
            />
          ))}
        </g>
      ))}
    </g>
  );
}

const qIdentity: Quat = [1, 0, 0, 0];
const qI90 = axisAngleQuat([1, 0, 0], Math.PI / 2);
const qJ90 = axisAngleQuat([0, 1, 0], Math.PI / 2);
const qIJ90 = qMul(qI90, qJ90);
const qJI90 = qMul(qJ90, qI90);

const rowCenters = [66, 200, 334] as const;
const rowY = { top: 82, bottom: 234 } as const;

function Arrowhead({ id, className }: { id: string; className: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="8.5"
      refY="5"
      markerWidth="5.5"
      markerHeight="5.5"
      orient="auto"
    >
      <path d="M0 0L10 5L0 10Z" className={className} />
    </marker>
  );
}

function QuaternionRotationFigure() {
  const [sx, sy] = sphereCenter;
  const originPt = project([0, 0, 0], sx, sy, sphereRadius);

  return (
    <figure className="cg-quat">
      <div className="cg-quat-panels">
        <div className="cg-quat-panel">
          <div className="cg-quat-kicker">01 / Cyclic 90° turns</div>
          <div className="cg-quat-panel-title">Left-multiplying by i, j, k</div>
          <div
            className="cg-quat-scroll"
            tabIndex={0}
            role="region"
            aria-label="Quaternion i, j, k 90-degree rotation basis diagram; scroll horizontally"
          >
            <svg
              viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
              width={viewBox.width}
              height={viewBox.height}
              role="img"
              aria-labelledby="cg-quat-basis-title cg-quat-basis-desc"
            >
              <title id="cg-quat-basis-title">
                i, j, k as right-hand 90-degree rotations in orthogonal planes
              </title>
              <desc id="cg-quat-basis-desc">
                Three orthogonal imaginary axes i, j, and k form a right-handed frame on the unit
                sphere. Left-multiplying by i rotates the jk-plane by +90 degrees, mapping j to k
                and then k to -j (so i squared equals -1). Similarly, left-multiplying by j maps k
                to i, and left-multiplying by k maps i to j.
              </desc>
              <defs>
                <Arrowhead id="cg-quat-arrow-i" className="cg-quat-head-i" />
                <Arrowhead id="cg-quat-arrow-j" className="cg-quat-head-j" />
                <Arrowhead id="cg-quat-arrow-k" className="cg-quat-head-k" />
                <Arrowhead id="cg-quat-arrow-neutral" className="cg-quat-head-neutral" />
              </defs>

              {/* Subtle reference great circles for the jk, ki, and ij planes */}
              <path
                d={sampleCircle([0, 1, 0], [0, 0, 1], sx, sy, sphereRadius)}
                className="cg-quat-ring"
              />
              <path
                d={sampleCircle([0, 0, 1], [1, 0, 0], sx, sy, sphereRadius)}
                className="cg-quat-ring"
              />
              <path
                d={sampleCircle([1, 0, 0], [0, 1, 0], sx, sy, sphereRadius)}
                className="cg-quat-ring"
              />

              {/* Negative axis extensions (drawn behind positive axes) */}
              {basisAxes.map(({ id, vec, negLabelOffset }) => {
                const negEnd = project(scale(vec, -1.04), sx, sy, sphereRadius);
                const negDot = project(scale(vec, -1), sx, sy, sphereRadius);
                return (
                  <g key={`${id}-neg`}>
                    <path d={linePath(originPt, negEnd)} className="cg-quat-axis-neg" />
                    <circle cx={negDot[0]} cy={negDot[1]} r="2.6" className="cg-quat-dot-neg" />
                    {id === 'j' && (
                      <text
                        x={negDot[0] + negLabelOffset[0]}
                        y={negDot[1] + negLabelOffset[1]}
                        textAnchor="middle"
                        className="cg-quat-symbol cg-quat-symbol-muted"
                      >
                        −j
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 90-degree cyclic multiplication arcs */}
              {rotationArcs.map((arc) => {
                const labelPos = project(arc.labelPoint, sx, sy, sphereRadius);
                return (
                  <g key={arc.id}>
                    <path
                      d={sampleArc(arc.from, arc.to, sx, sy, sphereRadius)}
                      className={`cg-quat-arc cg-quat-arc-${arc.role}${arc.dashed ? ' cg-quat-arc-dashed' : ''}`}
                      markerEnd={`url(#cg-quat-arrow-${arc.role})`}
                    />
                    <text
                      x={labelPos[0] + arc.labelOffset[0]}
                      y={labelPos[1] + arc.labelOffset[1]}
                      textAnchor={arc.anchor ?? 'middle'}
                      className={`cg-quat-arc-label cg-quat-text-${arc.role}`}
                    >
                      {arc.label}
                    </text>
                  </g>
                );
              })}

              {/* Positive orthonormal basis axes */}
              {basisAxes.map(({ id, vec, posLabelOffset }) => {
                const end = project(scale(vec, 1.18), sx, sy, sphereRadius);
                const unitPt = project(vec, sx, sy, sphereRadius);
                return (
                  <g key={id}>
                    <path
                      d={linePath(originPt, end)}
                      className={`cg-quat-axis cg-quat-axis-${id}`}
                      markerEnd={`url(#cg-quat-arrow-${id})`}
                    />
                    <circle
                      cx={unitPt[0]}
                      cy={unitPt[1]}
                      r="4"
                      className={`cg-quat-dot cg-quat-dot-${id}`}
                    />
                    <text
                      x={end[0] + posLabelOffset[0]}
                      y={end[1] + posLabelOffset[1]}
                      textAnchor="middle"
                      className={`cg-quat-symbol cg-quat-text-${id}`}
                    >
                      {id}
                    </text>
                  </g>
                );
              })}

              <circle cx={originPt[0]} cy={originPt[1]} r="3.2" className="cg-quat-origin" />
            </svg>
          </div>
          <p>{String.raw`\(ij=k,\; jk=i,\; ki=j \;\Longrightarrow\; i(jk)=i^2=-1.\)`}</p>
        </div>

        <div className="cg-quat-panel">
          <div className="cg-quat-kicker">02 / Order matters</div>
          <div className="cg-quat-panel-title">Non-commutative 3D rotations</div>
          <div
            className="cg-quat-scroll"
            tabIndex={0}
            role="region"
            aria-label="Non-commutative 3D quaternion rotation comparison diagram; scroll horizontally"
          >
            <svg
              viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
              width={viewBox.width}
              height={viewBox.height}
              role="img"
              aria-labelledby="cg-quat-order-title cg-quat-order-desc"
            >
              <title id="cg-quat-order-title">
                Applying 90-degree rotations about j and i in opposite orders gives different poses
              </title>
              <desc id="cg-quat-order-desc">
                An asymmetric 3D block starts with its blue nose along +i, ochre wing along +j, and
                sage fin along +k. Top row: rotating +90 degrees about j then +90 degrees about i
                leaves the nose along +j, wing along +k, and fin along +i. Bottom row: rotating +90
                degrees about i then +90 degrees about j leaves the nose along -k, wing along +i,
                and fin along -j. The two final poses differ because ij = k while ji = -k.
              </desc>
              <defs>
                <Arrowhead id="cg-quat-step-i" className="cg-quat-head-i" />
                <Arrowhead id="cg-quat-step-j" className="cg-quat-head-j" />
              </defs>

              <text x="16" y="22" className="cg-quat-row-tag cg-quat-text-j">
                Row 1: +90° about j, then +90° about i
              </text>
              <OrientedBlock quat={qIdentity} cx={rowCenters[0]} cy={rowY.top} />
              <OrientedBlock quat={qJ90} cx={rowCenters[1]} cy={rowY.top} />
              <OrientedBlock quat={qIJ90} cx={rowCenters[2]} cy={rowY.top} />

              <path
                d={`M${rowCenters[0] + 40} ${rowY.top}H${rowCenters[1] - 40}`}
                className="cg-quat-step cg-quat-step-j"
                markerEnd="url(#cg-quat-step-j)"
              />
              <text
                x={(rowCenters[0] + rowCenters[1]) / 2}
                y={rowY.top - 10}
                textAnchor="middle"
                className="cg-quat-step-label cg-quat-text-j"
              >
                +90° (j)
              </text>
              <path
                d={`M${rowCenters[1] + 40} ${rowY.top}H${rowCenters[2] - 40}`}
                className="cg-quat-step cg-quat-step-i"
                markerEnd="url(#cg-quat-step-i)"
              />
              <text
                x={(rowCenters[1] + rowCenters[2]) / 2}
                y={rowY.top - 10}
                textAnchor="middle"
                className="cg-quat-step-label cg-quat-text-i"
              >
                +90° (i)
              </text>

              <text
                x={rowCenters[0]}
                y={rowY.top + 48}
                textAnchor="middle"
                className="cg-quat-pose"
              >
                Start
              </text>
              <text
                x={rowCenters[1]}
                y={rowY.top + 48}
                textAnchor="middle"
                className="cg-quat-pose"
              >
                Step 1
              </text>
              <text
                x={rowCenters[2]}
                y={rowY.top + 48}
                textAnchor="middle"
                className="cg-quat-pose"
              >
                Result A
              </text>

              <path d="M16 153H384" className="cg-quat-divider" />
              <rect x="311" y="141" width="46" height="24" rx="12" className="cg-quat-neq-pill" />
              <text x="334" y="158" textAnchor="middle" className="cg-quat-neq">
                A ≠ B
              </text>

              <text x="16" y="179" className="cg-quat-row-tag cg-quat-text-i">
                Row 2: +90° about i, then +90° about j
              </text>
              <OrientedBlock quat={qIdentity} cx={rowCenters[0]} cy={rowY.bottom} />
              <OrientedBlock quat={qI90} cx={rowCenters[1]} cy={rowY.bottom} />
              <OrientedBlock quat={qJI90} cx={rowCenters[2]} cy={rowY.bottom} />

              <path
                d={`M${rowCenters[0] + 40} ${rowY.bottom}H${rowCenters[1] - 40}`}
                className="cg-quat-step cg-quat-step-i"
                markerEnd="url(#cg-quat-step-i)"
              />
              <text
                x={(rowCenters[0] + rowCenters[1]) / 2}
                y={rowY.bottom - 10}
                textAnchor="middle"
                className="cg-quat-step-label cg-quat-text-i"
              >
                +90° (i)
              </text>
              <path
                d={`M${rowCenters[1] + 40} ${rowY.bottom}H${rowCenters[2] - 40}`}
                className="cg-quat-step cg-quat-step-j"
                markerEnd="url(#cg-quat-step-j)"
              />
              <text
                x={(rowCenters[1] + rowCenters[2]) / 2}
                y={rowY.bottom - 10}
                textAnchor="middle"
                className="cg-quat-step-label cg-quat-text-j"
              >
                +90° (j)
              </text>

              <text
                x={rowCenters[0]}
                y={rowY.bottom + 50}
                textAnchor="middle"
                className="cg-quat-pose"
              >
                Start
              </text>
              <text
                x={rowCenters[1]}
                y={rowY.bottom + 50}
                textAnchor="middle"
                className="cg-quat-pose"
              >
                Step 1
              </text>
              <text
                x={rowCenters[2]}
                y={rowY.bottom + 50}
                textAnchor="middle"
                className="cg-quat-pose"
              >
                Result B
              </text>

              <g transform="translate(68 308)" className="cg-quat-legend">
                <rect x="0" y="-9" width="10" height="10" rx="2" className="cg-quat-swatch-i" />
                <text x="15" y="0">
                  +i nose
                </text>
                <rect x="94" y="-9" width="10" height="10" rx="2" className="cg-quat-swatch-j" />
                <text x="109" y="0">
                  +j wing
                </text>
                <rect x="190" y="-9" width="10" height="10" rx="2" className="cg-quat-swatch-k" />
                <text x="205" y="0">
                  +k fin
                </text>
              </g>
            </svg>
          </div>
          <p>
            {String.raw`\(q_i q_j = \tfrac{1+i+j+k}{2} \neq \tfrac{1+i+j-k}{2} = q_j q_i,\quad q_u = \tfrac{1+u}{\sqrt{2}}.\)`}
          </p>
        </div>
      </div>
      <figcaption>
        Left: {String.raw`\(i, j, k\)`} form a right-handed orthonormal imaginary basis;
        left-multiplying by an imaginary unit rotates the perpendicular plane by{' '}
        {String.raw`\(+90^\circ\)`} (for example{' '}
        {String.raw`\(j \xrightarrow{i\cdot} k \xrightarrow{i\cdot} -j\)`}, so{' '}
        {String.raw`\(i^2 = j^2 = k^2 = ijk = -1\)`}), while reversing the order flips the sign (
        {String.raw`\(ji = -k\)`}). Right: unit quaternions encode a 3D rotation of angle{' '}
        {String.raw`\(\theta\)`} about axis {String.raw`\(u\)`} via{' '}
        {String.raw`\(q = \cos\tfrac{\theta}{2} + u\sin\tfrac{\theta}{2}\)`} (so{' '}
        {String.raw`\(i, j, k\)`} themselves act as {String.raw`\(180^\circ\)`} turns, and{' '}
        {String.raw`\(q_u = \tfrac{1+u}{\sqrt{2}}\)`} gives {String.raw`\(+90^\circ\)`}). Composing{' '}
        {String.raw`\(q_i\)`} and {String.raw`\(q_j\)`} in opposite orders lands in different 3D
        orientations because {String.raw`\(ij = k \neq -k = ji\)`}.
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { QuaternionRotationFigure };
