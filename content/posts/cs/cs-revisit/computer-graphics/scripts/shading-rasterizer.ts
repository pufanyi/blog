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
  /** Four quad corners in order: bottom-left, bottom-right, top-right, top-left. */
  readonly corners: readonly [ScreenVertex, ScreenVertex, ScreenVertex, ScreenVertex];
  readonly zNear: number;
  readonly zFar: number;
}

export const RASTER_WIDTH = 320;
export const RASTER_HEIGHT = 200;
export const DEFAULT_TILT_DEG = 62;

interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

// Muted Morandi palette for the procedural texture so it harmonizes with both light and dark paper.
const TRANSPARENT: Rgba = { r: 0, g: 0, b: 0, a: 0 };
const TILE_LIGHT: Rgba = { r: 232, g: 225, b: 213, a: 255 };
const TILE_DARK: Rgba = { r: 92, g: 114, b: 132, a: 255 };
const TILE_ROSE: Rgba = { r: 158, g: 112, b: 105, a: 255 };
const TILE_SAGE: Rgba = { r: 109, g: 132, b: 112, a: 255 };
const GRID_LINE: Rgba = { r: 72, g: 82, b: 92, a: 255 };
const RING_COLOR: Rgba = { r: 174, g: 120, b: 108, a: 255 };

/**
 * Procedural 8x8 Morandi checkerboard with a centered reference ring and subtle corner accents.
 * Corner (u=0, v=0) lands on a slate-blue tile and (u=1, v=1) on a rose tile so the two
 * flat-shaded triangles have distinct, unmistakable constant colors.
 */
export function sampleTexture(u: number, v: number): Rgba {
  const cu = Math.max(0, Math.min(0.999999, u));
  const cv = Math.max(0, Math.min(0.999999, v));

  const cells = 8;
  const gx = cu * cells;
  const gy = cv * cells;
  const ix = Math.floor(gx);
  const iy = Math.floor(gy);
  const fx = gx - ix;
  const fy = gy - iy;

  // Base checkerboard tile color.
  let color: Rgba = (ix + iy) % 2 === 0 ? TILE_DARK : TILE_LIGHT;

  // Distinct corner accents at (0,0) and (7,7) + subtle sage corner cues.
  if (ix === 7 && iy === 7) {
    color = TILE_ROSE;
  } else if (ix === 0 && iy === 7) {
    color = TILE_SAGE;
  } else if (ix === 7 && iy === 0) {
    color = TILE_SAGE;
  }

  // Crisp interior grid lines between tiles make diagonal kinks immediately visible,
  // while leaving the outer boundary on the tile face so corner UV samples hit tile colors.
  const lineWidth = 0.055;
  const onXGrid = (ix > 0 && fx < lineWidth) || (ix < cells - 1 && fx > 1 - lineWidth);
  const onYGrid = (iy > 0 && fy < lineWidth) || (iy < cells - 1 && fy > 1 - lineWidth);
  if (onXGrid || onYGrid) {
    return GRID_LINE;
  }

  // Centered circle in UV space: stays a clean ellipse in perspective-correct shading,
  // but visibly breaks/kinks across the diagonal in screen-space smooth shading.
  const du = cu - 0.5;
  const dv = cv - 0.5;
  const dist = Math.hypot(du, dv);
  if (Math.abs(dist - 0.31) < 0.024) {
    return RING_COLOR;
  }

  return color;
}

/**
 * Projects a 3D tilted square quad onto a (width x height) viewport using a pinhole camera.
 * tiltDeg = 0 faces the camera head-on (all vertices share the same depth z);
 * larger tiltDeg pitches the top edge away into depth.
 */
export function projectTiltedQuad(
  tiltDeg: number,
  width = RASTER_WIDTH,
  height = RASTER_HEIGHT,
): ProjectedQuad {
  const rad = (tiltDeg * Math.PI) / 180;
  const cosT = Math.cos(rad);
  const sinT = Math.sin(rad);

  const halfW = 0.96;
  const halfH = 1.44;
  const centerZ = 2.52;
  const centerY = 0;
  const focal = Math.min(width, height) * 0.82;
  const cx = width * 0.5;
  const cy = height * (0.5 - 0.13 * sinT);

  // Local quad corners (lx, ly) with UV coordinates (u, v).
  const raw: readonly { lx: number; ly: number; u: number; v: number }[] = [
    { lx: -halfW, ly: -halfH, u: 0, v: 0 }, // bottom-left (near)
    { lx: halfW, ly: -halfH, u: 1, v: 0 }, // bottom-right (near)
    { lx: halfW, ly: halfH, u: 1, v: 1 }, // top-right (far)
    { lx: -halfW, ly: halfH, u: 0, v: 1 }, // top-left (far)
  ];

  const projected = raw.map(({ lx, ly, u, v }) => {
    // Rotate around X axis so positive ly tilts away into +z.
    const y3 = centerY + ly * cosT;
    const z3 = centerZ + ly * sinT;
    const sx = cx + (lx / z3) * focal;
    const sy = cy - (y3 / z3) * focal;
    return { x: sx, y: sy, z: z3, u, v };
  });

  const corners: [ScreenVertex, ScreenVertex, ScreenVertex, ScreenVertex] = [
    projected[0],
    projected[1],
    projected[2],
    projected[3],
  ];

  const zNear = Math.min(corners[0].z, corners[2].z);
  const zFar = Math.max(corners[0].z, corners[2].z);

  return { corners, zNear, zFar };
}

function edgeFn(ax: number, ay: number, bx: number, by: number, px: number, py: number): number {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

/**
 * Software-rasterizes the two-triangle tilted quad with 2x2 SSAA into an RGBA Uint8ClampedArray.
 * Uses the exact three formulas from the post:
 * - flat:        a = a(v1)
 * - smooth:      a = a(v1)*phi_x + a(v2)*phi_y + a(v3)*(1 - phi_x - phi_y)
 * - perspective: z = 1 / (phi_x/z1 + phi_y/z2 + phi_z/z3), a = z * (a1*phi_x/z1 + ...)
 */
export function rasterizeQuad(
  mode: ShadingMode,
  tiltDeg = DEFAULT_TILT_DEG,
  width = RASTER_WIDTH,
  height = RASTER_HEIGHT,
  bg: Rgba = TRANSPARENT,
): Uint8ClampedArray {
  const { corners } = projectTiltedQuad(tiltDeg, width, height);
  const [bl, br, tr, tl] = corners;

  // Split quad along diagonal (bl -> tr):
  // Triangle 1: v1 = bl (u=0,v=0, slate), v2 = br, v3 = tr
  // Triangle 2: v1 = tr (u=1,v=1, rose),  v2 = tl, v3 = bl
  const triangles: readonly [ScreenVertex, ScreenVertex, ScreenVertex][] = [
    [bl, br, tr],
    [tr, tl, bl],
  ];

  const out = new Uint8ClampedArray(width * height * 4);
  if (bg.a > 0) {
    for (let i = 0; i < out.length; i += 4) {
      out[i] = bg.r;
      out[i + 1] = bg.g;
      out[i + 2] = bg.b;
      out[i + 3] = bg.a;
    }
  }

  // Precompute per-triangle screen-space edge totals and 1/z values.
  const prepared = triangles.map(([v1, v2, v3]) => {
    const area = edgeFn(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y);
    const invArea = area !== 0 ? 1 / area : 0;
    const invZ1 = 1 / v1.z;
    const invZ2 = 1 / v2.z;
    const invZ3 = 1 / v3.z;
    const minX = Math.max(0, Math.floor(Math.min(v1.x, v2.x, v3.x)));
    const maxX = Math.min(width - 1, Math.ceil(Math.max(v1.x, v2.x, v3.x)));
    const minY = Math.max(0, Math.floor(Math.min(v1.y, v2.y, v3.y)));
    const maxY = Math.min(height - 1, Math.ceil(Math.max(v1.y, v2.y, v3.y)));
    return { v1, v2, v3, invArea, invZ1, invZ2, invZ3, minX, maxX, minY, maxY };
  });

  // 2x2 supersampling offsets inside each pixel.
  const offsets: readonly [number, number][] = [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ];

  const globalMinX = Math.min(prepared[0].minX, prepared[1].minX);
  const globalMaxX = Math.max(prepared[0].maxX, prepared[1].maxX);
  const globalMinY = Math.min(prepared[0].minY, prepared[1].minY);
  const globalMaxY = Math.max(prepared[0].maxY, prepared[1].maxY);

  for (let py = globalMinY; py <= globalMaxY; py++) {
    for (let px = globalMinX; px <= globalMaxX; px++) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let covered = 0;

      for (const [ox, oy] of offsets) {
        const sx = px + ox;
        const sy = py + oy;
        let hit: Rgba | null = null;

        for (const tri of prepared) {
          if (tri.invArea === 0) continue;
          const { v1, v2, v3, invArea, invZ1, invZ2, invZ3 } = tri;
          const phiX = edgeFn(v2.x, v2.y, v3.x, v3.y, sx, sy) * invArea;
          const phiY = edgeFn(v3.x, v3.y, v1.x, v1.y, sx, sy) * invArea;
          const phiZ = 1 - phiX - phiY;

          if (phiX >= -1e-6 && phiY >= -1e-6 && phiZ >= -1e-6) {
            let u: number;
            let v: number;
            if (mode === 'flat') {
              u = v1.u;
              v = v1.v;
            } else if (mode === 'smooth') {
              u = v1.u * phiX + v2.u * phiY + v3.u * phiZ;
              v = v1.v * phiX + v2.v * phiY + v3.v * phiZ;
            } else {
              const invZ = invZ1 * phiX + invZ2 * phiY + invZ3 * phiZ;
              const z = 1 / invZ;
              u = z * (v1.u * invZ1 * phiX + v2.u * invZ2 * phiY + v3.u * invZ3 * phiZ);
              v = z * (v1.v * invZ1 * phiX + v2.v * invZ2 * phiY + v3.v * invZ3 * phiZ);
            }
            hit = sampleTexture(u, v);
            break;
          }
        }

        if (hit) {
          sumR += hit.r;
          sumG += hit.g;
          sumB += hit.b;
          covered++;
        } else if (bg.a > 0) {
          sumR += bg.r;
          sumG += bg.g;
          sumB += bg.b;
        }
      }

      if (covered > 0) {
        const idx = (py * width + px) * 4;
        if (bg.a > 0) {
          out[idx] = Math.round(sumR * 0.25);
          out[idx + 1] = Math.round(sumG * 0.25);
          out[idx + 2] = Math.round(sumB * 0.25);
          out[idx + 3] = 255;
        } else {
          out[idx] = Math.round(sumR / covered);
          out[idx + 1] = Math.round(sumG / covered);
          out[idx + 2] = Math.round(sumB / covered);
          out[idx + 3] = Math.round((covered / 4) * 255);
        }
      }
    }
  }

  return out;
}
