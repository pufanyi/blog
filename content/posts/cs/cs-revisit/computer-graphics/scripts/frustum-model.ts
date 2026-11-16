export const depths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const rayDepths = [2, 5, 9];
export const depthNdc = (d: number) => 11 / 9 - 20 / (9 * d);
export const xNdc = (x: number, d: number) => (2 * x) / d;
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function position(x: number, d: number, progress: number, source = false) {
  if (source) return [160 + 22 * x, 48 + 22 * d];
  // Interpolate homogeneous maps, then divide; straight lines stay straight.
  const w = mix(1, d, progress);
  return [
    160 + mix(22 * x, 160 * x, progress) / w,
    mix(48 + 22 * d, (89 + 80 * (depthNdc(d) + 1)) * d, progress) / w,
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
export function progressFromFarWidth(halfWidth: number) {
  const width = Math.max(80, Math.min(110, halfWidth));
  return (110 - width) / (9 * width - 690);
}
