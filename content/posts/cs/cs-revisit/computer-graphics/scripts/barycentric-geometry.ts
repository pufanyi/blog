export interface Point {
  readonly x: number;
  readonly y: number;
}

export const VERTEX_I: Point = { x: 116, y: 50 };
export const VERTEX_J: Point = { x: 38, y: 184 };
export const VERTEX_K: Point = { x: 274, y: 168 };

// Exact barycentric weights (phi_i + phi_j + phi_k = 1) used as the single source of truth.
export const WEIGHTS = {
  i: 0.35,
  j: 0.2,
  k: 0.45,
} as const;

export const POINT_X: Point = {
  x: WEIGHTS.i * VERTEX_I.x + WEIGHTS.j * VERTEX_J.x + WEIGHTS.k * VERTEX_K.x,
  y: WEIGHTS.i * VERTEX_I.y + WEIGHTS.j * VERTEX_J.y + WEIGHTS.k * VERTEX_K.y,
};

export function fmt(value: number): string {
  return value.toFixed(1);
}

export function pt(p: Point): string {
  return `${fmt(p.x)},${fmt(p.y)}`;
}

export function poly(...points: readonly Point[]): string {
  return points.map(pt).join(' ');
}

export function lerp(a: Point, b: Point, t: number): Point {
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

export const FOOT_HI = projectOntoLine(VERTEX_I, VERTEX_J, VERTEX_K);
export const FOOT_DI = projectOntoLine(POINT_X, VERTEX_J, VERTEX_K);

// Level set of constant phi_i passing through POINT_X, parallel to edge x_j x_k.
export const LEVEL_LEFT = lerp(VERTEX_J, VERTEX_I, WEIGHTS.i);
export const LEVEL_RIGHT = lerp(VERTEX_K, VERTEX_I, WEIGHTS.i);

const BASE_DIR: Point = { x: VERTEX_K.x - VERTEX_J.x, y: VERTEX_K.y - VERTEX_J.y };
const BASE_DIR_REV: Point = { x: -BASE_DIR.x, y: -BASE_DIR.y };

export const RIGHT_ANGLE_HI = rightAnglePolyline(FOOT_HI, VERTEX_I, BASE_DIR, 7);
export const RIGHT_ANGLE_DI = rightAnglePolyline(FOOT_DI, POINT_X, BASE_DIR_REV, 7);

// Label anchors inside each sub-triangle (derived from sub-triangle centroids).
export const CENTROID_I: Point = {
  x: (POINT_X.x + VERTEX_J.x + VERTEX_K.x) / 3,
  y: (POINT_X.y + VERTEX_J.y + VERTEX_K.y) / 3 + 3,
};
export const CENTROID_J: Point = {
  x: (POINT_X.x + VERTEX_K.x + VERTEX_I.x) / 3 + 7,
  y: (POINT_X.y + VERTEX_K.y + VERTEX_I.y) / 3 - 2,
};
export const CENTROID_K: Point = {
  x: (POINT_X.x + VERTEX_I.x + VERTEX_J.x) / 3 - 2,
  y: (POINT_X.y + VERTEX_I.y + VERTEX_J.y) / 3 + 2,
};
