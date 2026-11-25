export interface PhaseState {
  readonly q: number;
  readonly p: number;
}

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

export interface PlotViewport {
  readonly left: number;
  readonly top: number;
  readonly size: number;
  readonly qMin: number;
  readonly qMax: number;
  readonly pMin: number;
  readonly pMax: number;
}

export const CANVAS = { width: 692, height: 338 } as const;

export const LEFT_VIEW: PlotViewport = {
  left: 48,
  top: 44,
  size: 244,
  qMin: -2.4,
  qMax: 2.4,
  pMin: -2.4,
  pMax: 2.4,
};

export const RIGHT_VIEW: PlotViewport = {
  left: 396,
  top: 44,
  size: 244,
  qMin: -0.15,
  qMax: 1.3,
  pMin: -0.3,
  pMax: 1.15,
};

export const INITIAL_STATE: PhaseState = { q: 0.6, p: 0.8 };
export const PORTRAIT_DT = 0.3;
export const PORTRAIT_STEPS = 19;
export const STEP_DEMO_DT = 0.55;

export function stepForwardEuler(state: PhaseState, dt: number): PhaseState {
  return {
    q: state.q + dt * state.p,
    p: state.p - dt * state.q,
  };
}

export function stepBackwardEuler(state: PhaseState, dt: number): PhaseState {
  const denom = 1 + dt * dt;
  return {
    q: (state.q + dt * state.p) / denom,
    p: (state.p - dt * state.q) / denom,
  };
}

export function stepSymplecticEuler(state: PhaseState, dt: number): PhaseState {
  const nextP = state.p - dt * state.q;
  const nextQ = state.q + dt * nextP;
  return { q: nextQ, p: nextP };
}

function simulate(
  initial: PhaseState,
  dt: number,
  steps: number,
  stepper: (s: PhaseState, h: number) => PhaseState,
): readonly PhaseState[] {
  const states: PhaseState[] = [initial];
  let current = initial;
  for (let i = 0; i < steps; i += 1) {
    current = stepper(current, dt);
    states.push(current);
  }
  return states;
}

export function project(view: PlotViewport, state: PhaseState): ScreenPoint {
  const qSpan = view.qMax - view.qMin;
  const pSpan = view.pMax - view.pMin;
  return {
    x: view.left + ((state.q - view.qMin) / qSpan) * view.size,
    y: view.top + (1 - (state.p - view.pMin) / pSpan) * view.size,
  };
}

function fmt(n: number): string {
  return n.toFixed(2);
}

export function polylinePath(view: PlotViewport, states: readonly PhaseState[]): string {
  return states
    .map((s, idx) => {
      const pt = project(view, s);
      return `${idx === 0 ? 'M' : 'L'} ${fmt(pt.x)} ${fmt(pt.y)}`;
    })
    .join(' ');
}

export function unitCircleArcPath(
  view: PlotViewport,
  startAngle: number,
  endAngle: number,
  samples: number,
): string {
  const states: PhaseState[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const theta = startAngle + ((endAngle - startAngle) * i) / samples;
    states.push({ q: Math.cos(theta), p: Math.sin(theta) });
  }
  return polylinePath(view, states);
}

export function radius(state: PhaseState): number {
  return Math.hypot(state.q, state.p);
}

export const FE_TRAJECTORY = simulate(INITIAL_STATE, PORTRAIT_DT, PORTRAIT_STEPS, stepForwardEuler);
export const BE_TRAJECTORY = simulate(
  INITIAL_STATE,
  PORTRAIT_DT,
  PORTRAIT_STEPS,
  stepBackwardEuler,
);
export const SE_TRAJECTORY = simulate(
  INITIAL_STATE,
  PORTRAIT_DT,
  PORTRAIT_STEPS + 2,
  stepSymplecticEuler,
);

export const DEMO_SHEAR_MID: PhaseState = {
  q: INITIAL_STATE.q,
  p: INITIAL_STATE.p - STEP_DEMO_DT * INITIAL_STATE.q,
};
export const DEMO_FE_NEXT = stepForwardEuler(INITIAL_STATE, STEP_DEMO_DT);
export const DEMO_SE_NEXT = stepSymplecticEuler(INITIAL_STATE, STEP_DEMO_DT);
