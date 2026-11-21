export interface Point {
  readonly x: number;
  readonly y: number;
}

export const STAGE_BOX = { width: 180, height: 122 } as const;

// Stage 1: 3D triangle in camera space (x, y, z)
export const AXES_ORIGIN: Point = { x: 24, y: 100 };
export const AXIS_X_END: Point = { x: 162, y: 100 };
export const AXIS_Y_END: Point = { x: 24, y: 16 };
export const AXIS_Z_END: Point = { x: 64, y: 74 };

export const TRI3D_V1: Point = { x: 46, y: 88 };
export const TRI3D_V2: Point = { x: 146, y: 82 };
export const TRI3D_V3: Point = { x: 112, y: 24 };

// Stage 2: Projected 2D screen triangle with interior pixel p(phi_x, phi_y)
export const TRI2D_V1: Point = { x: 30, y: 98 };
export const TRI2D_V2: Point = { x: 152, y: 92 };
export const TRI2D_V3: Point = { x: 96, y: 20 };
export const TRI2D_P: Point = {
  x: 0.35 * TRI2D_V1.x + 0.35 * TRI2D_V2.x + 0.3 * TRI2D_V3.x,
  y: 0.35 * TRI2D_V1.y + 0.35 * TRI2D_V2.y + 0.3 * TRI2D_V3.y,
};

// Stage 3: 4x4 UV texture grid with recovered sample point a(phi_x, phi_y)
export const UV_GRID = { x: 42, y: 16, size: 92, cells: 4 } as const;
export const UV_SAMPLE: Point = {
  x: UV_GRID.x + 0.62 * UV_GRID.size,
  y: UV_GRID.y + 0.38 * UV_GRID.size,
};

export function fmt(n: number): string {
  return n.toFixed(1);
}

export function poly(...pts: readonly Point[]): string {
  return pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ');
}

export function posStyle(p: Point): { left: string; top: string } {
  return {
    left: `${((p.x / STAGE_BOX.width) * 100).toFixed(2)}%`,
    top: `${((p.y / STAGE_BOX.height) * 100).toFixed(2)}%`,
  };
}
