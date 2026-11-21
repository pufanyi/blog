export interface Point {
  readonly x: number;
  readonly y: number;
}

export const SIDE_VIEW = { width: 340, height: 216 } as const;

// Equal-scale world-to-SVG mapping: world (z, y) -> SVG (x, y).
const ORIGIN_SVG: Point = { x: 26, y: 132 };
const SCALE = 56;

function toSvg(z: number, y: number): Point {
  return {
    x: ORIGIN_SVG.x + z * SCALE,
    y: ORIGIN_SVG.y - y * SCALE,
  };
}

// Exact 3D segment endpoints in camera (z, y) side-view coordinates.
export const Z1 = 1.5;
export const Z2 = 4.5;
const Y1 = -0.6;
const Y2 = 1.8;

// Screen-space midpoint (phi = 0.5) on image plane z = 1 projects to y' = 0.
// Intersecting ray y = 0 with segment v1->v2 gives t = 0.25 and depth z = 2.25 (harmonic mean).
export const T_HIT = (0 - Y1) / (Y2 - Y1); // 0.25
export const Z_HIT = 1 / (0.5 / Z1 + 0.5 / Z2); // 2.25
const Y_HIT = (1 - T_HIT) * Y1 + T_HIT * Y2; // 0

// True 3D midpoint (t = 0.5) on segment v1->v2.
export const T_MID = 0.5;
export const Z_MID = (Z1 + Z2) * 0.5; // 3.0
const Y_MID = (Y1 + Y2) * 0.5; // 0.6

// Image-plane projections at z = 1.
const Y1_PROJ = Y1 / Z1; // -0.4
const Y2_PROJ = Y2 / Z2; // +0.4
const Y_HIT_PROJ = Y_HIT / Z_HIT; // 0
const Y_MID_PROJ = Y_MID / Z_MID; // +0.2

export const CAM_O = toSvg(0, 0);
export const V1 = toSvg(Z1, Y1);
export const V2 = toSvg(Z2, Y2);
export const P_HIT = toSvg(Z_HIT, Y_HIT);
export const M_3D = toSvg(Z_MID, Y_MID);

export const IMG_TOP = toSvg(1, 0.72);
export const IMG_BOT = toSvg(1, -0.72);
export const PROJ_V1 = toSvg(1, Y1_PROJ);
export const PROJ_V2 = toSvg(1, Y2_PROJ);
export const PROJ_HIT = toSvg(1, Y_HIT_PROJ);
export const PROJ_MID = toSvg(1, Y_MID_PROJ);

export const AXIS_Z_END = toSvg(5.25, 0);

// Callout from screen midpoint m_s into clear upper-left margin.
export const MS_LEADER_END: Point = { x: 56, y: 88 };

// Label anchors positioned in clear margins around the geometry.
export const LABELS = {
  origin: { x: CAM_O.x - 4, y: CAM_O.y + 18 },
  imagePlane: { x: IMG_TOP.x, y: IMG_TOP.y - 14 },
  ms: { x: MS_LEADER_END.x - 4, y: MS_LEADER_END.y - 10 },
  v1: { x: V1.x + 12, y: V1.y + 18 },
  v2: { x: V2.x - 8, y: V2.y - 15 },
  pHit: { x: P_HIT.x + 10, y: P_HIT.y + 18 },
  m3d: { x: M_3D.x + 10, y: M_3D.y + 14 },
  axisZ: { x: AXIS_Z_END.x - 4, y: AXIS_Z_END.y + 14 },
} as const;

export function fmt(n: number): string {
  return n.toFixed(1);
}

export function posStyle(p: Point): { left: string; top: string } {
  return {
    left: `${((p.x / SIDE_VIEW.width) * 100).toFixed(2)}%`,
    top: `${((p.y / SIDE_VIEW.height) * 100).toFixed(2)}%`,
  };
}
