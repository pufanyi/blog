export type Vec3 = readonly [number, number, number];
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export const CANVAS = { width: 320, height: 280 } as const;

// UV square bounds inside the right panel's 320x280 canvas.
export const UV_RECT = {
  x: 56,
  y: 26,
  size: 204,
} as const;

export const NU = 20;
export const NV = 10;

// Highlighted sample triangle cell (lower-right half of cell (iu, iv)).
const HI_U = 5;
const HI_V = 2;

const MAJOR_R = 1.52;
const MINOR_R = 0.62;
const THETA_OFFSET = -0.8 * Math.PI;

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v: Vec3): Vec3 => {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
};

// Camera looking at the origin from an elevated 3/4 front viewpoint.
const CAMERA_POS: Vec3 = [0.42, -5.15, 3.55];
const CAM_FORWARD = normalize([-CAMERA_POS[0], -CAMERA_POS[1], -CAMERA_POS[2]]);
const CAM_RIGHT = normalize(cross(CAM_FORWARD, [0, 0, 1]));
const CAM_UP = cross(CAM_RIGHT, CAM_FORWARD);
const LIGHT_DIR = normalize([0.45, -0.55, 0.7]);
const CAM_DIST = Math.hypot(CAMERA_POS[0], CAMERA_POS[1], CAMERA_POS[2]);
const FOCAL = 360;
const SURFACE_CX = 160;
const SURFACE_CY = 126;

export const fmt = (n: number) => n.toFixed(1);
export const polyPoints = (pts: readonly Point2D[]) =>
  pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ');

export const posStyle = (p: Point2D) => ({
  left: `${((p.x / CANVAS.width) * 100).toFixed(2)}%`,
  top: `${((p.y / CANVAS.height) * 100).toFixed(2)}%`,
});

function torusPoint(u: number, v: number): Vec3 {
  const theta = 2 * Math.PI * u + THETA_OFFSET;
  const phi = 2 * Math.PI * v;
  const ring = MAJOR_R + MINOR_R * Math.cos(phi);
  return [ring * Math.cos(theta), ring * Math.sin(theta), MINOR_R * Math.sin(phi)];
}

function torusNormal(u: number, v: number): Vec3 {
  const theta = 2 * Math.PI * u + THETA_OFFSET;
  const phi = 2 * Math.PI * v;
  return [Math.cos(phi) * Math.cos(theta), Math.cos(phi) * Math.sin(theta), Math.sin(phi)];
}

function project3D(p: Vec3): { readonly pt: Point2D; readonly depth: number } {
  const rel = sub(p, CAMERA_POS);
  const depth = dot(rel, CAM_FORWARD);
  const scale = (FOCAL * (CAM_DIST / depth)) / CAM_DIST;
  return {
    pt: {
      x: SURFACE_CX + scale * dot(rel, CAM_RIGHT),
      y: SURFACE_CY - scale * dot(rel, CAM_UP),
    },
    depth,
  };
}

export function uvToCanvas(u: number, v: number): Point2D {
  return {
    x: UV_RECT.x + u * UV_RECT.size,
    y: UV_RECT.y + (1 - v) * UV_RECT.size,
  };
}

export interface SurfaceTriangle {
  readonly id: string;
  readonly points: string;
  readonly uPct: string;
  readonly vPct: string;
  readonly litPct: string;
  readonly depth: number;
  readonly highlighted: boolean;
}

export interface UvTriangle {
  readonly id: string;
  readonly points: string;
  readonly uPct: string;
  readonly vPct: string;
  readonly highlighted: boolean;
}

export interface SeamSegment {
  readonly id: string;
  readonly x1: string;
  readonly y1: string;
  readonly x2: string;
  readonly y2: string;
  readonly kind: 'u' | 'v';
}

export interface HighlightVertex {
  readonly id: 'v1' | 'v2' | 'v3';
  readonly tex: string;
  readonly u: number;
  readonly v: number;
  readonly surfacePt: Point2D;
  readonly surfaceLabelPt: Point2D;
  readonly uvPt: Point2D;
  readonly uvLabelPt: Point2D;
}

export interface UvMappingScene {
  readonly surfaceTriangles: readonly SurfaceTriangle[];
  readonly uvTriangles: readonly UvTriangle[];
  readonly seams: readonly SeamSegment[];
  readonly highlightSurfacePoints: string;
  readonly highlightUvPoints: string;
  readonly highlightVertices: readonly HighlightVertex[];
}

function buildScene(): UvMappingScene {
  const surfaceTriangles: SurfaceTriangle[] = [];
  const uvTriangles: UvTriangle[] = [];

  for (let iu = 0; iu < NU; iu += 1) {
    const u0 = iu / NU;
    const u1 = (iu + 1) / NU;
    for (let iv = 0; iv < NV; iv += 1) {
      const v0 = iv / NV;
      const v1 = (iv + 1) / NV;

      const quads: readonly [
        readonly [number, number],
        readonly [number, number],
        readonly [number, number],
        number,
      ][] = [
        [[u0, v0], [u1, v0], [u1, v1], 0],
        [[u0, v0], [u1, v1], [u0, v1], 1],
      ];

      for (const [a, b, c, half] of quads) {
        const uMid = (a[0] + b[0] + c[0]) / 3;
        const vMid = (a[1] + b[1] + c[1]) / 3;
        const uPct = `${(uMid * 100).toFixed(1)}%`;
        const vPct = `${(vMid * 100).toFixed(1)}%`;
        const highlighted = iu === HI_U && iv === HI_V && half === 0;
        const id = `t-${iu}-${iv}-${half}`;

        // 2D UV triangle
        uvTriangles.push({
          id,
          points: polyPoints([
            uvToCanvas(a[0], a[1]),
            uvToCanvas(b[0], b[1]),
            uvToCanvas(c[0], c[1]),
          ]),
          uPct,
          vPct,
          highlighted,
        });

        // 3D surface triangle
        const p0 = torusPoint(a[0], a[1]);
        const p1 = torusPoint(b[0], b[1]);
        const p2 = torusPoint(c[0], c[1]);
        const centroid: Vec3 = [
          (p0[0] + p1[0] + p2[0]) / 3,
          (p0[1] + p1[1] + p2[1]) / 3,
          (p0[2] + p1[2] + p2[2]) / 3,
        ];
        const faceNormal = normalize(cross(sub(p1, p0), sub(p2, p0)));
        const viewVec = normalize(sub(CAMERA_POS, centroid));
        if (dot(faceNormal, viewVec) <= -0.02) {
          continue;
        }

        const pr0 = project3D(p0);
        const pr1 = project3D(p1);
        const pr2 = project3D(p2);
        const depth = (pr0.depth + pr1.depth + pr2.depth) / 3;
        const lambert = Math.max(0, dot(faceNormal, LIGHT_DIR));
        const lit = 66 + 34 * lambert;

        surfaceTriangles.push({
          id,
          points: polyPoints([pr0.pt, pr1.pt, pr2.pt]),
          uPct,
          vPct,
          litPct: `${lit.toFixed(1)}%`,
          depth,
          highlighted,
        });
      }
    }
  }

  // Painter's algorithm: draw farthest triangles first.
  surfaceTriangles.sort((a, b) => b.depth - a.depth);

  // Build visible front-facing segments of the two cut seams: u = 0 and v = 0.
  const seams: SeamSegment[] = [];
  for (let iv = 0; iv < NV; iv += 1) {
    const v0 = iv / NV;
    const v1 = (iv + 1) / NV;
    const vm = (v0 + v1) / 2;
    const pMid = torusPoint(0, vm);
    const nMid = torusNormal(0, vm);
    if (dot(nMid, normalize(sub(CAMERA_POS, pMid))) > 0.05) {
      const a = project3D(torusPoint(0, v0)).pt;
      const b = project3D(torusPoint(0, v1)).pt;
      seams.push({
        id: `seam-u-${iv}`,
        x1: fmt(a.x),
        y1: fmt(a.y),
        x2: fmt(b.x),
        y2: fmt(b.y),
        kind: 'u',
      });
    }
  }
  for (let iu = 0; iu < NU; iu += 1) {
    const u0 = iu / NU;
    const u1 = (iu + 1) / NU;
    const um = (u0 + u1) / 2;
    const pMid = torusPoint(um, 0);
    const nMid = torusNormal(um, 0);
    if (dot(nMid, normalize(sub(CAMERA_POS, pMid))) > 0.05) {
      const a = project3D(torusPoint(u0, 0)).pt;
      const b = project3D(torusPoint(u1, 0)).pt;
      seams.push({
        id: `seam-v-${iu}`,
        x1: fmt(a.x),
        y1: fmt(a.y),
        x2: fmt(b.x),
        y2: fmt(b.y),
        kind: 'v',
      });
    }
  }

  // Highlighted triangle vertices: v1 = (u0, v0), v2 = (u1, v0), v3 = (u1, v1).
  const u0 = HI_U / NU;
  const u1 = (HI_U + 1) / NU;
  const v0 = HI_V / NV;
  const v1 = (HI_V + 1) / NV;

  const rawVerts: readonly {
    id: 'v1' | 'v2' | 'v3';
    tex: string;
    u: number;
    v: number;
    sOff: readonly [number, number];
    uvOff: readonly [number, number];
  }[] = [
    { id: 'v1', tex: 'v_1', u: u0, v: v0, sOff: [-14, 13], uvOff: [-15, 13] },
    { id: 'v2', tex: 'v_2', u: u1, v: v0, sOff: [15, 11], uvOff: [16, 13] },
    { id: 'v3', tex: 'v_3', u: u1, v: v1, sOff: [13, -13], uvOff: [15, -13] },
  ];

  const highlightVertices: HighlightVertex[] = rawVerts.map((rv) => {
    const surfacePt = project3D(torusPoint(rv.u, rv.v)).pt;
    const uvPt = uvToCanvas(rv.u, rv.v);
    return {
      id: rv.id,
      tex: rv.tex,
      u: rv.u,
      v: rv.v,
      surfacePt,
      surfaceLabelPt: { x: surfacePt.x + rv.sOff[0], y: surfacePt.y + rv.sOff[1] },
      uvPt,
      uvLabelPt: { x: uvPt.x + rv.uvOff[0], y: uvPt.y + rv.uvOff[1] },
    };
  });

  return {
    surfaceTriangles,
    uvTriangles,
    seams,
    highlightSurfacePoints: polyPoints(highlightVertices.map((v) => v.surfacePt)),
    highlightUvPoints: polyPoints(highlightVertices.map((v) => v.uvPt)),
    highlightVertices,
  };
}

export const UV_SCENE = buildScene();
