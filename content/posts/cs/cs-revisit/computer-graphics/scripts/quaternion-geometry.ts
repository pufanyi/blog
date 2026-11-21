export type Vec3 = readonly [number, number, number];
// Quaternion stored as [w, x, y, z] = w + x*i + y*j + z*k.
export type Quat = readonly [number, number, number, number];

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const normalize = (v: Vec3): Vec3 => {
  const len = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
};

export const qMul = ([w1, x1, y1, z1]: Quat, [w2, x2, y2, z2]: Quat): Quat => [
  w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
  w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
  w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
  w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
];

const qConj = ([w, x, y, z]: Quat): Quat => [w, -x, -y, -z];

export const qRotate = (q: Quat, v: Vec3): Vec3 => {
  const [, x, y, z] = qMul(qMul(q, [0, v[0], v[1], v[2]]), qConj(q));
  return [x, y, z];
};

export const axisAngleQuat = (axis: Vec3, rad: number): Quat => {
  const u = normalize(axis);
  const half = rad / 2;
  const s = Math.sin(half);
  return [Math.cos(half), u[0] * s, u[1] * s, u[2] * s];
};

// Shared right-handed camera looking at the origin from the (+i, +j, +k) octant.
export const viewDir = normalize([6.8, 5.4, 4.1]);
const camDistance = 12;
export const cameraPos = scale(viewDir, camDistance);
const camForward = scale(viewDir, -1);
const camRight = normalize(cross(camForward, [0, 0, 1]));
const camUp = cross(camRight, camForward);
const lightDir = normalize([0.42, 0.25, 0.87]);

export const project = (
  p: Vec3,
  cx: number,
  cy: number,
  radius: number,
): readonly [number, number] => {
  const rel = sub(p, cameraPos);
  const depth = dot(rel, camForward);
  const persp = camDistance / depth;
  return [cx + radius * persp * dot(rel, camRight), cy - radius * persp * dot(rel, camUp)];
};

export const fmtPt = ([x, y]: readonly [number, number]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
export const linePath = (a: readonly [number, number], b: readonly [number, number]) =>
  `M${fmtPt(a)}L${fmtPt(b)}`;

export const sampleArc = (
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

export const sampleCircle = (
  u: Vec3,
  v: Vec3,
  cx: number,
  cy: number,
  radius: number,
  steps = 64,
) => {
  const pts: (readonly [number, number])[] = [];
  for (let s = 0; s <= steps; s += 1) {
    const theta = (2 * Math.PI * s) / steps;
    const p = add(scale(u, Math.cos(theta)), scale(v, Math.sin(theta)));
    pts.push(project(p, cx, cy, radius));
  }
  return `M${pts.map(fmtPt).join('L')}Z`;
};

export const viewBox = { width: 400, height: 320 };
export const sphereCenter = [200, 168] as const;
export const sphereRadius = 104;

interface AxisDef {
  id: 'i' | 'j' | 'k';
  vec: Vec3;
  posLabelOffset: readonly [number, number];
  negLabelOffset: readonly [number, number];
}

export const basisAxes: readonly AxisDef[] = [
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
export const rotationArcs: readonly ArcDef[] = [
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

export const blockParts: readonly HexPart[] = [
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
export const hexFaces: readonly (readonly [number, number, number, number])[] = [
  [0, 3, 2, 1],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [3, 7, 6, 2],
  [0, 4, 7, 3],
  [1, 2, 6, 5],
];

export const shadeFromNormal = (normal: Vec3) => {
  const lit = dot(normal, lightDir);
  if (lit > 0.52) return 'light';
  if (lit > -0.15) return 'mid';
  return 'dark';
};
