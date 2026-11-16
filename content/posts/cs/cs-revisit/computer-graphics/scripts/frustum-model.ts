export const depths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const rayDepths = [2, 5, 9];
export const depthNdc = (d: number) => 11 / 9 - 20 / (9 * d);
export const xNdc = (x: number, d: number) => (2 * x) / d;
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function position(x: number, d: number, progress: number, source = false) {
  if (source) return [160 + 22 * x, 48 + 22 * d];
  const horizontal = Math.min(progress, 1);
  const depth = Math.max(0, progress - 1);
  return [
    160 + mix(22 * x, 110 * xNdc(x, d), horizontal),
    mix(48 + 22 * d, 55 + 110 * (depthNdc(d) + 1), depth),
  ];
}
export const segment = (a: number[], b: number[]) => `M ${a.join(' ')} L ${b.join(' ')}`;
export function outline(progress: number, source = false) {
  return [
    [-0.5, 1],
    [0.5, 1],
    [5, 10],
    [-5, 10],
  ]
    .map(([x, d]) => position(x, d, progress, source).join(','))
    .join(' ');
}
export const stages = ['原始视锥', '按深度缩放横向', '重新分配深度'];
