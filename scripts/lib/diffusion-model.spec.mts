import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CPS_EXAMPLE,
  cpsCoefficients,
  flowTrajectory,
  gaussianScale,
  gaussianTransition,
  INITIAL_POINTS,
  mixture,
} from '../../content/posts/ml/ml-revisit/diffusion/scripts/model';

const close = (actual: number, expected: number, tolerance = 1e-10) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};

test('the plotted mixture velocity satisfies continuity and its score is a log-density derivative', () => {
  const h = 1e-5;
  for (const t of [0.1, 0.35, 0.7, 0.9]) {
    for (const x of [-1.8, -0.4, 0.2, 1.3]) {
      const current = mixture(t, x);
      const left = mixture(t, x - h);
      const right = mixture(t, x + h);
      const timeDerivative = (mixture(t + h, x).density - mixture(t - h, x).density) / (2 * h);
      const fluxDerivative =
        (right.density * right.velocity - left.density * left.velocity) / (2 * h);
      close(timeDerivative + fluxDerivative, 0, 2e-7);
      close((Math.log(right.density) - Math.log(left.density)) / (2 * h), current.score, 2e-7);
    }
  }
  const paths = INITIAL_POINTS.map((initial) => flowTrajectory(initial));
  for (let k = 0; k < paths[0].length; k++) {
    for (let i = 1; i < paths.length; i++) assert.ok(paths[i][k].x > paths[i - 1][k].x);
  }
  for (const initial of INITIAL_POINTS) {
    close(flowTrajectory(initial).at(-1)!.x, flowTrajectory(initial, 800).at(-1)!.x, 1e-7);
  }
});

test('the exact plotted SDE transitions preserve the stated Gaussian marginal moments', () => {
  for (const [t, next] of [
    [0, 0.01],
    [0.3, 0.6],
    [0.95, 1],
  ]) {
    const center = gaussianTransition(t, next, t);
    const shifted = gaussianTransition(t, next, t + 1);
    const slope = shifted.mean - center.mean;
    close(center.mean, next);
    close(slope ** 2 * gaussianScale(t) ** 2 + center.variance, gaussianScale(next) ** 2);
    assert.ok(center.variance > 0);
  }
});

test('CPS preserves the next noise variance while Euler-Maruyama has the derived finite-step excess', () => {
  for (const { t, next, diffusion } of [CPS_EXAMPLE, { t: 0.2, next: 0.4, diffusion: 0.3 }]) {
    const rows = cpsCoefficients(t, next, diffusion);
    const target = (1 - next) ** 2;
    const h = next - t;
    close(rows[0].variance, target);
    close(rows[3].variance, target);
    close(
      rows[2].variance - target,
      (diffusion ** 2 * h ** 2) / (1 - t) + (diffusion ** 4 * h ** 2) / (4 * (1 - t) ** 2),
    );
    assert.ok(rows[1].variance > rows[2].variance);
  }
  const rows = cpsCoefficients(CPS_EXAMPLE.t, CPS_EXAMPLE.next, CPS_EXAMPLE.diffusion);
  close(rows[2].total, 0.29);
  close(rows[3].retained, 0.15);
  assert.throws(() => cpsCoefficients(0.5, 0.75, 1), /feasible noise/);
});
