export function normalGenerator(seed: number) {
  let state = seed >>> 0;
  const uniform = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) + 0.5) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
}

export const IMAGE_SIZE = 20;
const imageNoise = normalGenerator(137);
export const IMAGE_PIXELS = Array.from({ length: IMAGE_SIZE ** 2 }, (_, index) => {
  const x = index % IMAGE_SIZE;
  const y = Math.floor(index / IMAGE_SIZE);
  const roof = y >= 5 && y <= 10 && Math.abs(x - 9.5) <= y - 4;
  const wall = y > 10 && y < 18 && x >= 5 && x <= 14;
  const door = y >= 13 && y < 18 && x >= 9 && x <= 11;
  const sun = (x - 16) ** 2 + (y - 3) ** 2 <= 4;
  return { x, y, data: ((roof || wall) && !door) || sun ? 1 : -0.8, noise: imageNoise() };
});

export const MIXTURE_MEAN = 1.5;
export const MIXTURE_SD = 0.18;
export function mixture(t: number, x: number) {
  const variance = (1 - t) ** 2 + (t * MIXTURE_SD) ** 2;
  const center = MIXTURE_MEAN * Math.tanh((x * t * MIXTURE_MEAN) / variance);
  const rate = (-(1 - t) + t * MIXTURE_SD ** 2) / variance;
  const normal = (mean: number) =>
    Math.exp(-((x - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance);
  return {
    density: (normal(t * MIXTURE_MEAN) + normal(-t * MIXTURE_MEAN)) / 2,
    velocity: center + rate * (x - t * center),
    score: -(x - t * center) / variance,
  };
}

export interface Point {
  t: number;
  x: number;
}
export const INITIAL_POINTS = [-1.6, -0.9, -0.3, 0.3, 0.9, 1.6];
export function flowTrajectory(initial: number, steps = 400): Point[] {
  let x = initial;
  const points = [{ t: 0, x }];
  const h = 1 / steps;
  for (let k = 0; k < steps; k++) {
    const t = k * h;
    const v1 = mixture(t, x).velocity;
    const v2 = mixture(t + h / 2, x + (h * v1) / 2).velocity;
    const v3 = mixture(t + h / 2, x + (h * v2) / 2).velocity;
    const v4 = mixture(t + h, x + h * v3).velocity;
    x += (h / 6) * (v1 + 2 * v2 + 2 * v3 + v4);
    points.push({ t: (k + 1) * h, x });
  }
  return points;
}

export const gaussianScale = (t: number) => 1 - 0.6 * t;
export const gaussianOde = (initial: number, t: number) => t + gaussianScale(t) * initial;
export const GAUSSIAN_DIFFUSION = 0.65;
// The standardized process is an OU process under an analytic time change.
// Sampling its exact Gaussian transition avoids an Euler error in this illustration.
export function gaussianTransition(t: number, next: number, x: number) {
  const q = gaussianScale(t);
  const qNext = gaussianScale(next);
  const elapsed = (GAUSSIAN_DIFFUSION ** 2 / 0.6) * (1 / qNext - 1 / q);
  const decay = Math.exp(-elapsed / 2);
  return {
    mean: next + qNext * decay * ((x - t) / q),
    variance: qNext ** 2 * -Math.expm1(-elapsed),
  };
}
export function gaussianSde(initial: number, seed: number): Point[] {
  const normal = normalGenerator(seed);
  let x = initial;
  const points = [{ t: 0, x }];
  for (let k = 0; k < 100; k++) {
    const next = (k + 1) / 100;
    const transition = gaussianTransition(k / 100, next, x);
    x = transition.mean + Math.sqrt(transition.variance) * normal();
    points.push({ t: next, x });
  }
  return points;
}
