import type { CSSProperties } from 'react';

interface PhaseState {
  readonly q: number;
  readonly p: number;
}

interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

interface PlotViewport {
  readonly left: number;
  readonly top: number;
  readonly size: number;
  readonly qMin: number;
  readonly qMax: number;
  readonly pMin: number;
  readonly pMax: number;
}

const CANVAS = { width: 692, height: 336 } as const;

const LEFT_VIEW: PlotViewport = {
  left: 48,
  top: 44,
  size: 244,
  qMin: -2.4,
  qMax: 2.4,
  pMin: -2.4,
  pMax: 2.4,
};

const RIGHT_VIEW: PlotViewport = {
  left: 396,
  top: 44,
  size: 244,
  qMin: -0.15,
  qMax: 1.3,
  pMin: -0.3,
  pMax: 1.15,
};

const INITIAL_STATE: PhaseState = { q: 0.6, p: 0.8 };
const PORTRAIT_DT = 0.3;
const PORTRAIT_STEPS = 19;
const STEP_DEMO_DT = 0.55;

function stepForwardEuler(state: PhaseState, dt: number): PhaseState {
  return {
    q: state.q + dt * state.p,
    p: state.p - dt * state.q,
  };
}

function stepSymplecticEuler(state: PhaseState, dt: number): PhaseState {
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

function project(view: PlotViewport, state: PhaseState): ScreenPoint {
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

function polylinePath(view: PlotViewport, states: readonly PhaseState[]): string {
  return states
    .map((s, idx) => {
      const pt = project(view, s);
      return `${idx === 0 ? 'M' : 'L'} ${fmt(pt.x)} ${fmt(pt.y)}`;
    })
    .join(' ');
}

function unitCircleArcPath(
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

function radius(state: PhaseState): number {
  return Math.hypot(state.q, state.p);
}

const FE_TRAJECTORY = simulate(INITIAL_STATE, PORTRAIT_DT, PORTRAIT_STEPS, stepForwardEuler);
const SE_TRAJECTORY = simulate(INITIAL_STATE, PORTRAIT_DT, PORTRAIT_STEPS + 2, stepSymplecticEuler);

const DEMO_SHEAR_MID: PhaseState = {
  q: INITIAL_STATE.q,
  p: INITIAL_STATE.p - STEP_DEMO_DT * INITIAL_STATE.q,
};
const DEMO_FE_NEXT = stepForwardEuler(INITIAL_STATE, STEP_DEMO_DT);
const DEMO_SE_NEXT = stepSymplecticEuler(INITIAL_STATE, STEP_DEMO_DT);

function labelStyle(at: ScreenPoint): CSSProperties {
  return {
    '--pbs-ps-x': `${((at.x / CANVAS.width) * 100).toFixed(2)}%`,
    '--pbs-ps-y': `${((at.y / CANVAS.height) * 100).toFixed(2)}%`,
  } as CSSProperties;
}

function MathOverlay({
  at,
  tex,
  className = '',
  align = 'center',
}: {
  at: ScreenPoint;
  tex: string;
  className?: string;
  align?: 'center' | 'start' | 'end';
}) {
  return (
    <span className={`pbs-ps-tex pbs-ps-tex-${align} ${className}`.trim()} style={labelStyle(at)}>
      <span className="math-inline">{`\\(${tex}\\)`}</span>
    </span>
  );
}

function SymplecticPhaseSpaceFigure() {
  const leftOrigin = project(LEFT_VIEW, { q: 0, p: 0 });
  const leftUnitRadius = (1 / (LEFT_VIEW.qMax - LEFT_VIEW.qMin)) * LEFT_VIEW.size;

  const rightOrigin = project(RIGHT_VIEW, { q: 0, p: 0 });
  const pStart = project(RIGHT_VIEW, INITIAL_STATE);
  const pMid = project(RIGHT_VIEW, DEMO_SHEAR_MID);
  const pFe = project(RIGHT_VIEW, DEMO_FE_NEXT);
  const pSe = project(RIGHT_VIEW, DEMO_SE_NEXT);

  const feFinalR = radius(FE_TRAJECTORY[FE_TRAJECTORY.length - 1]).toFixed(2);
  const seFinalR = radius(SE_TRAJECTORY[SE_TRAJECTORY.length - 1]).toFixed(2);

  return (
    <figure className="pbs-ps">
      <div className="pbs-ps-panel">
        <div className="pbs-ps-scroll">
          <div className="pbs-ps-stage">
            <svg
              viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
              role="img"
              aria-label="一维谐振子相空间对比：左图展示 Forward Euler 向外螺旋发散而 Symplectic Euler 沿闭合轨道保持有界；右图展示单步更新中 Forward Euler 沿切线外冲，而 Symplectic Euler 拆分为竖直与水平两次错切变换"
            >
              <title>Forward Euler 与 Symplectic Euler 在谐振子相空间中的轨迹与单步几何对比</title>
              <desc>
                采用 IEEE 754 双精度浮点数模拟一维谐振子 H(q, p) = (q^2 + p^2) / 2，初值 (q_0, p_0)
                = (0.6, 0.8) 位于单位圆 r = 1 上。左图以步长 dt = 0.30 演化：Forward Euler 在 19
                步后相空间半径膨胀至 r = {feFinalR}，呈向外发散螺旋；Symplectic Euler 在 21
                步（约一整圈）后半径为 r = {seFinalR}，始终贴合单位圆形成闭合椭圆。右图以步长 dt =
                0.55 放大展示单步几何：Forward Euler 同时用旧动量更新位置，落到圆外的 (
                {DEMO_FE_NEXT.q.toFixed(2)}, {DEMO_FE_NEXT.p.toFixed(2)})；Symplectic Euler
                先做竖直错切至 ({DEMO_SHEAR_MID.q.toFixed(2)}, {DEMO_SHEAR_MID.p.toFixed(2)}
                )，再用新动量做水平错切至 ({DEMO_SE_NEXT.q.toFixed(3)}, {DEMO_SE_NEXT.p.toFixed(2)}
                )，回到等能圆附近。
              </desc>

              <defs>
                <marker
                  id="pbs-ps-axis-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5.5"
                  markerHeight="5.5"
                  orient="auto-start-reverse"
                >
                  <path className="pbs-ps-axis-head" d="M 1 2 L 9 5 L 1 8 L 2.6 5 Z" />
                </marker>
                <marker
                  id="pbs-ps-fe-arrow"
                  viewBox="0 0 10 10"
                  refX="8.2"
                  refY="5"
                  markerWidth="6.2"
                  markerHeight="6.2"
                  orient="auto-start-reverse"
                >
                  <path className="pbs-ps-fe-head" d="M 1 1.8 L 9 5 L 1 8.2 L 2.8 5 Z" />
                </marker>
                <marker
                  id="pbs-ps-se-arrow"
                  viewBox="0 0 10 10"
                  refX="8.2"
                  refY="5"
                  markerWidth="6.2"
                  markerHeight="6.2"
                  orient="auto-start-reverse"
                >
                  <path className="pbs-ps-se-head" d="M 1 1.8 L 9 5 L 1 8.2 L 2.8 5 Z" />
                </marker>
              </defs>

              {/* Panel titles */}
              <text
                className="pbs-ps-heading"
                x={LEFT_VIEW.left + LEFT_VIEW.size / 2}
                y="21"
                textAnchor="middle"
              >
                Phase Portrait (m = k = 1, Δt = 0.30)
              </text>
              <text
                className="pbs-ps-heading"
                x={RIGHT_VIEW.left + RIGHT_VIEW.size / 2}
                y="21"
                textAnchor="middle"
              >
                Single-Step Shear Decomposition
              </text>

              {/* Left panel frame and axes */}
              <rect
                className="pbs-ps-plot-bg"
                x={LEFT_VIEW.left}
                y={LEFT_VIEW.top}
                width={LEFT_VIEW.size}
                height={LEFT_VIEW.size}
                rx="6"
              />
              <line
                className="pbs-ps-axis"
                x1={LEFT_VIEW.left + 6}
                y1={leftOrigin.y}
                x2={LEFT_VIEW.left + LEFT_VIEW.size - 6}
                y2={leftOrigin.y}
                markerEnd="url(#pbs-ps-axis-arrow)"
              />
              <line
                className="pbs-ps-axis"
                x1={leftOrigin.x}
                y1={LEFT_VIEW.top + LEFT_VIEW.size - 6}
                x2={leftOrigin.x}
                y2={LEFT_VIEW.top + 6}
                markerEnd="url(#pbs-ps-axis-arrow)"
              />

              {/* Exact energy circle on left panel */}
              <circle
                className="pbs-ps-exact-curve"
                cx={leftOrigin.x}
                cy={leftOrigin.y}
                r={leftUnitRadius}
              />

              {/* Forward Euler spiral on left panel */}
              <path className="pbs-ps-fe-curve" d={polylinePath(LEFT_VIEW, FE_TRAJECTORY)} />
              {FE_TRAJECTORY.map((st, idx) => {
                if (idx === 0 || idx % 2 !== 0) {
                  return null;
                }
                const pt = project(LEFT_VIEW, st);
                return (
                  <circle
                    key={`fe-pt-${idx}`}
                    className="pbs-ps-fe-dot"
                    cx={pt.x}
                    cy={pt.y}
                    r="2.8"
                  />
                );
              })}

              {/* Symplectic Euler bounded orbit on left panel */}
              <path className="pbs-ps-se-curve" d={polylinePath(LEFT_VIEW, SE_TRAJECTORY)} />
              {SE_TRAJECTORY.map((st, idx) => {
                if (idx === 0 || idx % 3 !== 0) {
                  return null;
                }
                const pt = project(LEFT_VIEW, st);
                return (
                  <circle
                    key={`se-pt-${idx}`}
                    className="pbs-ps-se-dot"
                    cx={pt.x}
                    cy={pt.y}
                    r="2.7"
                  />
                );
              })}

              {/* Shared start state on left panel */}
              <circle
                className="pbs-ps-start-dot"
                cx={project(LEFT_VIEW, INITIAL_STATE).x}
                cy={project(LEFT_VIEW, INITIAL_STATE).y}
                r="4"
              />

              {/* Right panel frame and axes */}
              <rect
                className="pbs-ps-plot-bg"
                x={RIGHT_VIEW.left}
                y={RIGHT_VIEW.top}
                width={RIGHT_VIEW.size}
                height={RIGHT_VIEW.size}
                rx="6"
              />
              <line
                className="pbs-ps-axis"
                x1={RIGHT_VIEW.left + 6}
                y1={rightOrigin.y}
                x2={RIGHT_VIEW.left + RIGHT_VIEW.size - 6}
                y2={rightOrigin.y}
                markerEnd="url(#pbs-ps-axis-arrow)"
              />
              <line
                className="pbs-ps-axis"
                x1={rightOrigin.x}
                y1={RIGHT_VIEW.top + RIGHT_VIEW.size - 6}
                x2={rightOrigin.x}
                y2={RIGHT_VIEW.top + 6}
                markerEnd="url(#pbs-ps-axis-arrow)"
              />

              {/* Exact constant-energy unit arc in right panel */}
              <path
                className="pbs-ps-exact-curve"
                d={unitCircleArcPath(RIGHT_VIEW, -0.24, Math.PI * 0.54, 48)}
              />

              {/* Subtle guide showingovershoot from SE to FE along same p_{n+1} */}
              <line
                className="pbs-ps-overshoot-guide"
                x1={pSe.x}
                y1={pSe.y}
                x2={pFe.x}
                y2={pFe.y}
              />

              {/* Forward Euler simultaneous tangent step */}
              <line
                className="pbs-ps-fe-step"
                x1={pStart.x}
                y1={pStart.y}
                x2={pFe.x - 4.5}
                y2={pFe.y - 3.4}
                markerEnd="url(#pbs-ps-fe-arrow)"
              />

              {/* Symplectic Euler vertical momentum shear + horizontal position shear */}
              <line
                className="pbs-ps-se-step"
                x1={pStart.x}
                y1={pStart.y}
                x2={pMid.x}
                y2={pMid.y - 5.5}
                markerEnd="url(#pbs-ps-se-arrow)"
              />
              <line
                className="pbs-ps-se-step"
                x1={pMid.x}
                y1={pMid.y}
                x2={pSe.x - 5.5}
                y2={pSe.y}
                markerEnd="url(#pbs-ps-se-arrow)"
              />

              {/* Key state points on right panel */}
              <circle className="pbs-ps-shear-mid" cx={pMid.x} cy={pMid.y} r="3.6" />
              <circle className="pbs-ps-fe-dot-lg" cx={pFe.x} cy={pFe.y} r="4.2" />
              <circle className="pbs-ps-se-dot-lg" cx={pSe.x} cy={pSe.y} r="4.2" />
              <circle className="pbs-ps-start-dot" cx={pStart.x} cy={pStart.y} r="4.3" />

              {/* Bottom legend */}
              <g transform="translate(106, 314)">
                <line className="pbs-ps-exact-curve" x1="0" y1="0" x2="24" y2="0" />
                <text className="pbs-ps-legend" x="31" y="4">
                  Exact (H = const)
                </text>

                <line className="pbs-ps-fe-curve" x1="168" y1="0" x2="194" y2="0" />
                <circle className="pbs-ps-fe-dot" cx="181" cy="0" r="3" />
                <text className="pbs-ps-legend" x="202" y="4">
                  Forward Euler
                </text>

                <line className="pbs-ps-se-curve" x1="330" y1="0" x2="356" y2="0" />
                <circle className="pbs-ps-se-dot" cx="343" cy="0" r="3" />
                <text className="pbs-ps-legend" x="364" y="4">
                  Symplectic Euler
                </text>
              </g>
            </svg>

            {/* Axis labels */}
            <MathOverlay
              at={{ x: LEFT_VIEW.left + LEFT_VIEW.size + 8, y: leftOrigin.y }}
              tex="q"
              className="pbs-ps-axis-label"
              align="start"
            />
            <MathOverlay
              at={{ x: leftOrigin.x + 10, y: LEFT_VIEW.top + 12 }}
              tex="p"
              className="pbs-ps-axis-label"
              align="start"
            />
            <MathOverlay
              at={{ x: RIGHT_VIEW.left + RIGHT_VIEW.size + 8, y: rightOrigin.y }}
              tex="q"
              className="pbs-ps-axis-label"
              align="start"
            />
            <MathOverlay
              at={{ x: rightOrigin.x + 10, y: RIGHT_VIEW.top + 12 }}
              tex="p"
              className="pbs-ps-axis-label"
              align="start"
            />

            {/* Right panel step annotations */}
            <MathOverlay
              at={{ x: pStart.x - 10, y: pStart.y - 4 }}
              tex="(q_n, p_n)"
              className="pbs-ps-state-label"
              align="end"
            />
            <MathOverlay
              at={{ x: pMid.x - 10, y: pMid.y }}
              tex="(q_n, p_{n+1})"
              className="pbs-ps-state-label pbs-ps-role-se"
              align="end"
            />
            <MathOverlay
              at={{ x: pSe.x - 4, y: pSe.y + 19 }}
              tex="z_{n+1}^{\mathrm{SE}}"
              className="pbs-ps-state-label pbs-ps-role-se"
              align="center"
            />
            <MathOverlay
              at={{ x: pFe.x + 6, y: pFe.y - 8 }}
              tex="z_{n+1}^{\mathrm{FE}}"
              className="pbs-ps-state-label pbs-ps-role-fe"
              align="start"
            />
          </div>
        </div>
      </div>

      <figcaption>
        一维弹簧振子（
        <span className="math-inline">{String.raw`\(H(q,p)=\frac{1}{2}(q^2+p^2)\)`}</span>
        ，双精度递推）的相空间对比。左图从{' '}
        <span className="math-inline">{String.raw`\((q_0,p_0)=(0.6,0.8)\)`}</span> 出发演化：Forward
        Euler 每步将相面积放大 <span className="math-inline">{String.raw`\(1+\Delta t^2\)`}</span>{' '}
        倍而向外发散，Symplectic Euler 则沿闭合椭圆保持能量有界。右图展示单步几何：Forward Euler
        用旧动量 <span className="math-inline">{String.raw`\(p_n\)`}</span>{' '}
        沿切线同步外推而冲出等能面；Symplectic Euler 拆为竖直错切（更新{' '}
        <span className="math-inline">{String.raw`\(p_{n+1}\)`}</span>）与水平错切（用{' '}
        <span className="math-inline">{String.raw`\(p_{n+1}\)`}</span> 更新{' '}
        <span className="math-inline">{String.raw`\(q_{n+1}\)`}</span>），每步严格保持相面积守恒。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { SymplecticPhaseSpaceFigure };
