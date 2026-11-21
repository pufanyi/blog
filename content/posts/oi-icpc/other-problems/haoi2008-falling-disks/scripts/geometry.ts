export interface Point {
  x: number;
  y: number;
}

export interface Circle {
  center: Point;
  r: number;
}

export function fmt(n: number): string {
  return n.toFixed(2);
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function polarPoint(center: Point, r: number, angleRad: number): Point {
  return {
    x: center.x + r * Math.cos(angleRad),
    y: center.y + r * Math.sin(angleRad),
  };
}

/**
 * Computes the two intersection points of two circles in math coordinates (y-up).
 * Returns [p1, p2] where p1 is to the left of the directed segment c1 -> c2 (CCW),
 * and p2 is to the right (CW).
 */
export function circleIntersections(c1: Circle, c2: Circle): [Point, Point] {
  const dx = c2.center.x - c1.center.x;
  const dy = c2.center.y - c1.center.y;
  const d = Math.hypot(dx, dy);
  if (d === 0 || d > c1.r + c2.r || d < Math.abs(c1.r - c2.r)) {
    throw new Error('Circles do not intersect cleanly at two points');
  }
  const a = (c1.r * c1.r - c2.r * c2.r + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, c1.r * c1.r - a * a));
  const ux = dx / d;
  const uy = dy / d;
  const mx = c1.center.x + a * ux;
  const my = c1.center.y + a * uy;
  const p1: Point = { x: mx - h * uy, y: my + h * ux };
  const p2: Point = { x: mx + h * uy, y: my - h * ux };
  return [p1, p2];
}

/**
 * Builds an SVG arc path between two points on a circle of radius r (in SVG coordinates).
 */
export function svgArcPath(
  start: Point,
  end: Point,
  r: number,
  largeArc: 0 | 1,
  sweep: 0 | 1,
): string {
  return `M ${fmt(start.x)} ${fmt(start.y)} A ${fmt(r)} ${fmt(r)} 0 ${largeArc} ${sweep} ${fmt(end.x)} ${fmt(end.y)}`;
}

/**
 * Builds an SVG angle sector arc around `vertex` from `angle1` to `angle2` (in math radians, y-up),
 * converted into SVG coordinates using `toSvg`.
 */
export function mathAngleArcPath(
  vertex: Point,
  radius: number,
  angle1: number,
  angle2: number,
  toSvg: (p: Point) => Point,
): string {
  const p1 = toSvg(polarPoint(vertex, radius, angle1));
  const p2 = toSvg(polarPoint(vertex, radius, angle2));
  const scale = Math.hypot(
    toSvg({ x: 1, y: 0 }).x - toSvg({ x: 0, y: 0 }).x,
    toSvg({ x: 1, y: 0 }).y - toSvg({ x: 0, y: 0 }).y,
  );
  const rSvg = radius * scale;
  let diff = angle2 - angle1;
  while (diff <= -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  const largeArc: 0 | 1 = Math.abs(diff) > Math.PI ? 1 : 0;
  // In y-down SVG coordinates, positive math angle (CCW) corresponds to sweep = 0.
  const sweep: 0 | 1 = diff >= 0 ? 0 : 1;
  return svgArcPath(p1, p2, rSvg, largeArc, sweep);
}
