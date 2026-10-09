export function arcAngle(length: number, chord: number): number {
  if (chord === 0) return 2 * Math.PI;
  if (chord === length) return 0;
  if (chord < 0 || chord > length || length <= 0) {
    throw new Error('Require a positive length and a chord in [0, length].');
  }
  let lo = 0;
  let hi = 2 * Math.PI;
  for (let i = 0; i < 80; i++) {
    const angle = (lo + hi) / 2;
    if ((2 * Math.sin(angle / 2)) / angle > chord / length) lo = angle;
    else hi = angle;
  }
  return (lo + hi) / 2;
}

export function enclosure(length: number, a: number, b: number, theta: number) {
  const start = { x: a, y: 0 };
  const end = { x: b * Math.cos(theta), y: b * Math.sin(theta) };
  const chord = Math.hypot(end.x - start.x, end.y);
  const angle = arcAngle(length, chord);
  const radius = length / angle;
  const height = radius * Math.cos(angle / 2);
  const center = {
    x: (start.x + end.x) / 2 - (height * end.y) / chord,
    y: end.y / 2 + (height * (end.x - start.x)) / chord,
  };
  const startAngle = Math.atan2(-center.y, start.x - center.x);
  const area = (a * b * Math.sin(theta) + radius * radius * (angle - Math.sin(angle))) / 2;
  return { start, end, center, angle, radius, startAngle, area };
}

const theta = Math.PI / 3;
// The sliding endpoint obeys sin(alpha) / alpha = sin(theta) / length.
const singleWallAngle = arcAngle(4, Math.sqrt(3)) / 2;
const slidingB = Math.cos(theta) + Math.sin(theta) * Math.tan(singleWallAngle / 2);

export const examples = [
  { id: 'sector', title: '两端自由', length: 1, a: 1 / theta, b: 1 / theta },
  { id: 'sliding', title: '短墙端点固定', length: 2, a: 1, b: slidingB },
  { id: 'major', title: '两端固定，大圆弧', length: 4, a: 1, b: 2 },
].map((example) => ({
  ...example,
  geometry: enclosure(example.length, example.a, example.b, theta),
}));
