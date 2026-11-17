export function rasterize(x0: number, y0: number, x1: number, y1: number) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const steep = dy > dx;
  const major = Math.max(dx, dy);
  const minor = Math.min(dx, dy);
  const sx = Math.sign(x1 - x0);
  const sy = Math.sign(y1 - y0);
  let x = x0;
  let y = y0;
  let decision = 2 * minor - major;
  const points: { x: number; y: number; decision: number }[] = [];
  for (let i = 0; i <= major; i++) {
    points.push({ x, y, decision });
    if (decision >= 0) {
      if (steep) x += sx;
      else y += sy;
      decision -= 2 * major;
    }
    if (steep) y += sy;
    else x += sx;
    decision += 2 * minor;
  }
  return { points, major, minor, steep };
}
export const initialLine = rasterize(2, 3, 13, 8);
