export const CPS_EXAMPLE = { t: 0.5, next: 0.75, diffusion: 0.4 };
export function cpsCoefficients(t: number, next: number, diffusion: number) {
  const h = next - t;
  const target = 1 - next;
  const fresh = diffusion * Math.sqrt(h);
  if (h <= 0 || t < 0 || next >= 1 || diffusion < 0 || fresh > target) {
    throw new Error('The coefficient illustration requires an interior step with feasible noise.');
  }
  const correction = (diffusion ** 2 * h) / (2 * (1 - t));
  return [
    { name: 'Euler ODE', retained: target, fresh: 0 },
    { name: 'Euler + noise', retained: target, fresh },
    { name: 'Euler–Maruyama', retained: target - correction, fresh },
    { name: 'CPS', retained: Math.sqrt(target ** 2 - fresh ** 2), fresh },
  ].map((row) => ({
    ...row,
    data: next,
    total: Math.hypot(row.retained, row.fresh),
    variance: row.retained ** 2 + row.fresh ** 2,
  }));
}
