export type ShadingMode = 'flat' | 'smooth' | 'perspective';

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface ScreenVertex {
  readonly x: number;
  readonly y: number;
  /** Positive camera-space depth z (> 0). */
  readonly z: number;
  readonly u: number;
  readonly v: number;
}

export interface ProjectedQuad {
  /** Quad corners: bottom-left, bottom-right, top-right, top-left. */
  readonly corners: readonly [ScreenVertex, ScreenVertex, ScreenVertex, ScreenVertex];
  readonly zNear: number;
  readonly zFar: number;
}

export type TileTone = 'dark' | 'light' | 'rose' | 'sage';

export interface VectorTile {
  readonly points: string;
  readonly tone: TileTone;
}

export interface VectorScene {
  readonly outline: string;
  readonly diag: readonly [Vec2, Vec2];
  readonly tiles: readonly VectorTile[];
  readonly ringPath: string;
  readonly zNear: number;
  readonly zFar: number;
}

export const VIEW_WIDTH = 320;
export const VIEW_HEIGHT = 200;
export const DEFAULT_TILT_DEG = 62;

const GRID_CELLS = 8;
const RING_RADIUS = 0.31;
const RING_SAMPLES = 72;

const HALF_W = 0.96;
const HALF_H = 1.44;
const CENTER_Z = 2.52;

export function fmt(n: number): string {
  return n.toFixed(1);
}

function pointsAttr(pts: readonly Vec2[]): string {
  return pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ');
}

function closedPath(pts: readonly Vec2[]): string {
  if (pts.length === 0) return '';
  return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${fmt(p.x)} ${fmt(p.y)}`).join(' ') + ' Z';
}

/**
 * Projects any UV point (u, v) in [0, 1]^2 on the 3D tilted quad through a pinhole camera.
 */
function projectUv3d(
  u: number,
  v: number,
  tiltDeg: number,
  width = VIEW_WIDTH,
  height = VIEW_HEIGHT,
): ScreenVertex {
  const rad = (tiltDeg * Math.PI) / 180;
  const cosT = Math.cos(rad);
  const sinT = Math.sin(rad);
  const focal = Math.min(width, height) * 0.82;
  const cx = width * 0.5;
  const cy = height * (0.5 - 0.13 * sinT);

  const lx = (u - 0.5) * 2 * HALF_W;
  const ly = (v - 0.5) * 2 * HALF_H;
  const y3 = ly * cosT;
  const z3 = CENTER_Z + ly * sinT;

  return {
    x: cx + (lx / z3) * focal,
    y: cy - (y3 / z3) * focal,
    z: z3,
    u,
    v,
  };
}

export function projectTiltedQuad(
  tiltDeg: number,
  width = VIEW_WIDTH,
  height = VIEW_HEIGHT,
): ProjectedQuad {
  const bl = projectUv3d(0, 0, tiltDeg, width, height);
  const br = projectUv3d(1, 0, tiltDeg, width, height);
  const tr = projectUv3d(1, 1, tiltDeg, width, height);
  const tl = projectUv3d(0, 1, tiltDeg, width, height);
  return {
    corners: [bl, br, tr, tl],
    zNear: Math.min(bl.z, tr.z),
    zFar: Math.max(bl.z, tr.z),
  };
}

function cellTone(ix: number, iy: number): TileTone {
  if (ix === GRID_CELLS - 1 && iy === GRID_CELLS - 1) return 'rose';
  if ((ix === 0 && iy === GRID_CELLS - 1) || (ix === GRID_CELLS - 1 && iy === 0)) return 'sage';
  return (ix + iy) % 2 === 0 ? 'dark' : 'light';
}

/**
 * Maps a UV point (u, v) to screen coordinates under screen-space linear (Smooth) shading,
 * using the exact affine barycentric weights of the triangle containing (u, v):
 * - Triangle 1 (u >= v): (bl, br, tr) -> phi_1 = 1 - u, phi_2 = u - v, phi_3 = v
 * - Triangle 2 (u <  v): (tr, tl, bl) -> phi_1 = u,     phi_2 = v - u, phi_3 = 1 - v
 */
function mapUvSmooth(
  u: number,
  v: number,
  corners: readonly [ScreenVertex, ScreenVertex, ScreenVertex, ScreenVertex],
  forceTri?: 1 | 2,
): Vec2 {
  const [bl, br, tr, tl] = corners;
  const inTri1 = forceTri ? forceTri === 1 : u >= v;
  if (inTri1) {
    const phi1 = 1 - u;
    const phi2 = u - v;
    const phi3 = v;
    return {
      x: phi1 * bl.x + phi2 * br.x + phi3 * tr.x,
      y: phi1 * bl.y + phi2 * br.y + phi3 * tr.y,
    };
  }
  const phi1 = u;
  const phi2 = v - u;
  const phi3 = 1 - v;
  return {
    x: phi1 * tr.x + phi2 * tl.x + phi3 * bl.x,
    y: phi1 * tr.y + phi2 * tl.y + phi3 * bl.y,
  };
}

/**
 * Generates exact vector SVG primitives for Flat, Smooth, or Perspective Correct shading.
 */
export function buildVectorScene(
  mode: ShadingMode,
  tiltDeg = DEFAULT_TILT_DEG,
  width = VIEW_WIDTH,
  height = VIEW_HEIGHT,
): VectorScene {
  const { corners, zNear, zFar } = projectTiltedQuad(tiltDeg, width, height);
  const [bl, br, tr, tl] = corners;
  const outline = pointsAttr(corners);
  const diag: readonly [Vec2, Vec2] = [bl, tr];

  if (mode === 'flat') {
    // Each triangle samples only its first vertex: bl -> dark slate, tr -> muted rose.
    return {
      outline,
      diag,
      tiles: [
        { points: pointsAttr([bl, br, tr]), tone: 'dark' },
        { points: pointsAttr([tr, tl, bl]), tone: 'rose' },
      ],
      ringPath: '',
      zNear,
      zFar,
    };
  }

  const tiles: VectorTile[] = [];
  const step = 1 / GRID_CELLS;

  if (mode === 'smooth') {
    for (let iy = 0; iy < GRID_CELLS; iy++) {
      for (let ix = 0; ix < GRID_CELLS; ix++) {
        const u0 = ix * step;
        const u1 = (ix + 1) * step;
        const v0 = iy * step;
        const v1 = (iy + 1) * step;
        const tone = cellTone(ix, iy);

        if (ix === iy) {
          // Diagonal cell splits cleanly along u = v into two screen-space triangles.
          tiles.push({
            points: pointsAttr([
              mapUvSmooth(u0, v0, corners, 1),
              mapUvSmooth(u1, v0, corners, 1),
              mapUvSmooth(u1, v1, corners, 1),
            ]),
            tone,
          });
          tiles.push({
            points: pointsAttr([
              mapUvSmooth(u0, v0, corners, 2),
              mapUvSmooth(u1, v1, corners, 2),
              mapUvSmooth(u0, v1, corners, 2),
            ]),
            tone,
          });
        } else {
          const tri: 1 | 2 = ix > iy ? 1 : 2;
          tiles.push({
            points: pointsAttr([
              mapUvSmooth(u0, v0, corners, tri),
              mapUvSmooth(u1, v0, corners, tri),
              mapUvSmooth(u1, v1, corners, tri),
              mapUvSmooth(u0, v1, corners, tri),
            ]),
            tone,
          });
        }
      }
    }

    const ringPts: Vec2[] = [];
    for (let i = 0; i < RING_SAMPLES; i++) {
      const theta = (i / RING_SAMPLES) * Math.PI * 2;
      const u = 0.5 + RING_RADIUS * Math.cos(theta);
      const v = 0.5 + RING_RADIUS * Math.sin(theta);
      ringPts.push(mapUvSmooth(u, v, corners));
    }

    return {
      outline,
      diag,
      tiles,
      ringPath: closedPath(ringPts),
      zNear,
      zFar,
    };
  }

  // Perspective-correct shading: exact 3D projection of every grid cell and the reference circle.
  for (let iy = 0; iy < GRID_CELLS; iy++) {
    for (let ix = 0; ix < GRID_CELLS; ix++) {
      const u0 = ix * step;
      const u1 = (ix + 1) * step;
      const v0 = iy * step;
      const v1 = (iy + 1) * step;
      tiles.push({
        points: pointsAttr([
          projectUv3d(u0, v0, tiltDeg, width, height),
          projectUv3d(u1, v0, tiltDeg, width, height),
          projectUv3d(u1, v1, tiltDeg, width, height),
          projectUv3d(u0, v1, tiltDeg, width, height),
        ]),
        tone: cellTone(ix, iy),
      });
    }
  }

  const ringPts: Vec2[] = [];
  for (let i = 0; i < RING_SAMPLES; i++) {
    const theta = (i / RING_SAMPLES) * Math.PI * 2;
    const u = 0.5 + RING_RADIUS * Math.cos(theta);
    const v = 0.5 + RING_RADIUS * Math.sin(theta);
    ringPts.push(projectUv3d(u, v, tiltDeg, width, height));
  }

  return {
    outline,
    diag,
    tiles,
    ringPath: closedPath(ringPts),
    zNear,
    zFar,
  };
}
