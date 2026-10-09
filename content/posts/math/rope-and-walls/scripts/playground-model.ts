import { enclosure } from './geometry';

export const playground = { theta: Math.PI / 3, x: 1, y: 2, scale: 65, ox: 200, oy: 330 };
export const initialRope = { a: 1, b: 1.7, s: 2 };
export interface RopeState {
  a: number;
  b: number;
  s: number;
}
export interface RopePoint {
  x: number;
  y: number;
}
export function projectRope(p: RopePoint): RopePoint {
  return { x: playground.ox + p.x * playground.scale, y: playground.oy - p.y * playground.scale };
}
const point = (p: RopePoint) => {
  const q = projectRope(p);
  return `${q.x} ${q.y}`;
};

export function ropeFrame({ a, b, s }: RopeState) {
  const { theta, x, y, scale } = playground;
  const start = { x: a, y: 0 };
  const end = { x: b * Math.cos(theta), y: b * Math.sin(theta) };
  const d = Math.hypot(end.x - start.x, end.y);
  const chord = `M ${point(start)} L ${point(end)}`;
  const base = { a: projectRope(start), b: projectRope(end), chord, d };
  if (s < d - 1e-9)
    return {
      ...base,
      rope: '',
      region: '',
      area: null,
      alpha: null,
      radius: null,
      kind: 'short',
      status: `绳子还差 ${(d - s).toFixed(3)} 才能连接 A、B；请增加绳长或把端点移近。`,
    };
  if (d < 1e-9) {
    const r = s / (2 * Math.PI);
    const opposite = point({ x: -2 * r, y: 0 });
    const rope = `M ${point(start)} A ${r * scale} ${r * scale} 0 1 0 ${opposite} A ${r * scale} ${r * scale} 0 1 0 ${point(start)} Z`;
    return {
      ...base,
      rope,
      region: rope,
      area: Math.PI * r * r,
      alpha: 2 * Math.PI,
      radius: r,
      kind: 'circle',
      status: 'A、B 都在墙角，绳子在墙外围成一个整圆。两个端点重合时，可用下方滑块分别移动。',
    };
  }
  if (Math.abs(s - d) < 1e-9)
    return {
      ...base,
      rope: chord,
      region: `M ${playground.ox} ${playground.oy} L ${point(start)} L ${point(end)} Z`,
      area: (a * b * Math.sin(theta)) / 2,
      alpha: 0,
      radius: null,
      kind: 'straight',
      status: '绳长恰好等于弦长：绳子拉直，圆弓形面积为零。',
    };
  const shape = enclosure(s, a, b, theta);
  let center = shape.center;
  let direction = 1;
  // At O the triangle degenerates. Choose the exterior side of the remaining wall.
  if (a === 0 || b === 0) {
    const axis = a === 0 ? { x: Math.cos(theta), y: Math.sin(theta) } : { x: 1, y: 0 };
    const dot = center.x * axis.x + center.y * axis.y;
    center = { x: 2 * dot * axis.x - center.x, y: 2 * dot * axis.y - center.y };
    direction = -1;
  }
  const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
  const onArc = (p: RopePoint) => {
    const turn =
      (((direction * (Math.atan2(p.y - center.y, p.x - center.x) - startAngle)) % (2 * Math.PI)) +
        2 * Math.PI) %
      (2 * Math.PI);
    return turn > 1e-7 && turn < shape.angle - 1e-7;
  };
  const q = 2 * center.x - a;
  const z = 2 * (center.x * Math.cos(theta) + center.y * Math.sin(theta)) - b;
  const blocked =
    (q > a + 1e-7 && q <= x + 1e-7 && onArc({ x: q, y: 0 })) ||
    (z > b + 1e-7 && z <= y + 1e-7 && onArc({ x: z * Math.cos(theta), y: z * Math.sin(theta) }));
  const command = `A ${shape.radius * scale} ${shape.radius * scale} 0 ${shape.angle > Math.PI ? 1 : 0} ${direction === 1 ? 0 : 1} ${point(end)}`;
  const rope = `M ${point(start)} ${command}`;
  const kind = blocked
    ? 'blocked'
    : shape.angle > Math.PI + 1e-8
      ? 'major'
      : shape.angle < Math.PI - 1e-8
        ? 'minor'
        : 'semicircle';
  const status = blocked
    ? '这段圆弧穿过了剩余的真实墙段。图示面积只是忽略障碍时的上界，不能按这个位置围起来；请调整端点或绳长。'
    : `${kind === 'major' ? '大圆弧：绳子已经超过半圆。' : kind === 'minor' ? '小圆弧：绳子尚未达到半圆。' : '绳子恰好围成半圆。'}这是当前端点的圆弧，端点位置并未自动优化。`;
  return {
    ...base,
    rope,
    region: `M ${playground.ox} ${playground.oy} L ${point(start)} ${command} Z`,
    area: shape.area,
    alpha: shape.angle,
    radius: shape.radius,
    kind,
    status,
  };
}
export function ropeMetrics(frame: ReturnType<typeof ropeFrame>) {
  return `弦长 ${frame.d.toFixed(3)} · ${frame.kind === 'blocked' ? '无障碍面积上界' : '面积'} ${frame.area === null ? '—' : frame.area.toFixed(3)} · 圆弧角 ${frame.alpha === null ? '—' : `${((frame.alpha * 180) / Math.PI).toFixed(1)}°`}`;
}

export function ropeViewport(state: RopeState) {
  const { a, b, s } = state;
  const { theta, x, y } = playground;
  const points = [
    { x: 0, y: 0 },
    { x, y: 0 },
    { x: y * Math.cos(theta), y: y * Math.sin(theta) },
  ];
  const d = Math.hypot(a - b * Math.cos(theta), b * Math.sin(theta));
  if (d < 1e-9) {
    const r = s / (2 * Math.PI);
    points.push({ x: -2 * r, y: 0 }, { x: -r, y: r }, { x: -r, y: -r });
  } else if (s > d + 1e-9) {
    const shape = enclosure(s, a, b, theta);
    for (let i = 0; i <= 100; i++) {
      const t = shape.startAngle + (shape.angle * i) / 100;
      let p = {
        x: shape.center.x + shape.radius * Math.cos(t),
        y: shape.center.y + shape.radius * Math.sin(t),
      };
      if (a === 0 || b === 0) {
        const axis = a === 0 ? { x: Math.cos(theta), y: Math.sin(theta) } : { x: 1, y: 0 };
        const dot = p.x * axis.x + p.y * axis.y;
        p = { x: 2 * dot * axis.x - p.x, y: 2 * dot * axis.y - p.y };
      }
      points.push(p);
    }
  }
  const projected = points.map(projectRope);
  const xmin = Math.min(...projected.map((p) => p.x));
  const xmax = Math.max(...projected.map((p) => p.x));
  const ymin = Math.min(...projected.map((p) => p.y));
  const ymax = Math.max(...projected.map((p) => p.y));
  const width = Math.max(xmax - xmin + 50, ((ymax - ymin + 50) * 620) / 560);
  const height = (width * 560) / 620;
  return {
    box: `${(xmin + xmax - width) / 2} ${(ymin + ymax - height) / 2} ${width} ${height}`,
    uiScale: width / 620,
  };
}
