import type { CSSProperties } from 'react';
import {
  BE_TRAJECTORY,
  CANVAS,
  DEMO_FE_NEXT,
  DEMO_SE_NEXT,
  DEMO_SHEAR_MID,
  FE_TRAJECTORY,
  INITIAL_STATE,
  LEFT_VIEW,
  type PlotViewport,
  polylinePath,
  project,
  RIGHT_VIEW,
  radius,
  type ScreenPoint,
  SE_TRAJECTORY,
  unitCircleArcPath,
} from './phase-space-model';

function labelStyle(at: ScreenPoint): CSSProperties {
  return {
    '--se-ps-x': `${((at.x / CANVAS.width) * 100).toFixed(2)}%`,
    '--se-ps-y': `${((at.y / CANVAS.height) * 100).toFixed(2)}%`,
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
    <span className={`se-ps-tex se-ps-tex-${align} ${className}`.trim()} style={labelStyle(at)}>
      <span className="math-inline">{`\\(${tex}\\)`}</span>
    </span>
  );
}

function PlotAxes({ view, origin }: { view: PlotViewport; origin: ScreenPoint }) {
  return (
    <g>
      <rect
        className="se-ps-plot-bg"
        x={view.left}
        y={view.top}
        width={view.size}
        height={view.size}
        rx="6"
      />
      <line
        className="se-ps-axis"
        x1={view.left + 6}
        y1={origin.y}
        x2={view.left + view.size - 6}
        y2={origin.y}
        markerEnd="url(#se-ps-axis-arrow)"
      />
      <line
        className="se-ps-axis"
        x1={origin.x}
        y1={view.top + view.size - 6}
        x2={origin.x}
        y2={view.top + 6}
        markerEnd="url(#se-ps-axis-arrow)"
      />
    </g>
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
  const beFinalR = radius(BE_TRAJECTORY[BE_TRAJECTORY.length - 1]).toFixed(2);
  const seFinalR = radius(SE_TRAJECTORY[SE_TRAJECTORY.length - 1]).toFixed(2);

  return (
    <figure className="se-ps">
      <div className="se-ps-panel">
        <div className="se-ps-scroll">
          <div className="se-ps-stage">
            <svg
              viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
              role="img"
              aria-label="主模态二维共轭相平面对比：左图展示归一化模态（ω_i = 1）下 Forward Euler 向外螺旋发散、Backward Euler 向内螺旋阻尼收缩，而 Symplectic Euler 沿闭合阴影椭圆保持有界；右图展示单步更新中 Forward Euler 沿切线外冲，而 Symplectic Euler 拆分为竖直与水平两次错切变换"
            >
              <title>三种一阶欧拉积分在单个主模态相平面上的轨迹与单步错切几何对比</title>
              <desc>
                采用 IEEE 754 双精度浮点数模拟高维系统解耦后的归一化主模态相平面 H_i(q, p) = (q^2 +
                p^2) / 2（固有频率 ω_i = 1），初值 (q_0, p_0) = (0.6, 0.8) 位于等能单位圆 r = 1
                上。左图以步长 dt = 0.30 演化：Forward Euler 在 19 步后相空间半径膨胀至 r ={' '}
                {feFinalR}；Backward Euler 在 19 步后收缩至 r = {beFinalR}
                ；Symplectic Euler 在 21 步（约一整圈）后半径为 r = {seFinalR}
                ，始终落在闭合倾斜椭圆上。右图以步长 dt = 0.55 放大展示单步几何：Forward Euler
                同时用旧动量更新位置，落到圆外的 ({DEMO_FE_NEXT.q.toFixed(2)},{' '}
                {DEMO_FE_NEXT.p.toFixed(2)})；Symplectic Euler 先做竖直错切至 (
                {DEMO_SHEAR_MID.q.toFixed(2)}, {DEMO_SHEAR_MID.p.toFixed(2)}
                )，再用新动量做水平错切至 ({DEMO_SE_NEXT.q.toFixed(3)}, {DEMO_SE_NEXT.p.toFixed(2)}
                )，回到等能圆附近。
              </desc>

              <defs>
                <marker
                  id="se-ps-axis-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5.5"
                  markerHeight="5.5"
                  orient="auto-start-reverse"
                >
                  <path className="se-ps-axis-head" d="M 1 2 L 9 5 L 1 8 L 2.6 5 Z" />
                </marker>
                <marker
                  id="se-ps-fe-arrow"
                  viewBox="0 0 10 10"
                  refX="8.2"
                  refY="5"
                  markerWidth="6.2"
                  markerHeight="6.2"
                  orient="auto-start-reverse"
                >
                  <path className="se-ps-fe-head" d="M 1 1.8 L 9 5 L 1 8.2 L 2.8 5 Z" />
                </marker>
                <marker
                  id="se-ps-se-arrow"
                  viewBox="0 0 10 10"
                  refX="8.2"
                  refY="5"
                  markerWidth="6.2"
                  markerHeight="6.2"
                  orient="auto-start-reverse"
                >
                  <path className="se-ps-se-head" d="M 1 1.8 L 9 5 L 1 8.2 L 2.8 5 Z" />
                </marker>
              </defs>

              <text
                className="se-ps-heading"
                x={LEFT_VIEW.left + LEFT_VIEW.size / 2}
                y="21"
                textAnchor="middle"
              >
                Modal Phase Portrait (ω = 1, Δt = 0.30)
              </text>
              <text
                className="se-ps-heading"
                x={RIGHT_VIEW.left + RIGHT_VIEW.size / 2}
                y="21"
                textAnchor="middle"
              >
                Single-Step Shear Decomposition
              </text>

              <PlotAxes view={LEFT_VIEW} origin={leftOrigin} />
              <circle
                className="se-ps-exact-curve"
                cx={leftOrigin.x}
                cy={leftOrigin.y}
                r={leftUnitRadius}
              />

              <path className="se-ps-fe-curve" d={polylinePath(LEFT_VIEW, FE_TRAJECTORY)} />
              {FE_TRAJECTORY.map((st, idx) => {
                if (idx === 0 || idx % 2 !== 0) return null;
                const pt = project(LEFT_VIEW, st);
                return (
                  <circle key={`fe-${idx}`} className="se-ps-fe-dot" cx={pt.x} cy={pt.y} r="2.8" />
                );
              })}

              <path className="se-ps-be-curve" d={polylinePath(LEFT_VIEW, BE_TRAJECTORY)} />
              {BE_TRAJECTORY.map((st, idx) => {
                if (idx === 0 || idx % 3 !== 0) return null;
                const pt = project(LEFT_VIEW, st);
                return (
                  <rect
                    key={`be-${idx}`}
                    className="se-ps-be-dot"
                    x={pt.x - 2.2}
                    y={pt.y - 2.2}
                    width="4.4"
                    height="4.4"
                  />
                );
              })}

              <path className="se-ps-se-curve" d={polylinePath(LEFT_VIEW, SE_TRAJECTORY)} />
              {SE_TRAJECTORY.map((st, idx) => {
                if (idx === 0 || idx % 3 !== 0) return null;
                const pt = project(LEFT_VIEW, st);
                return (
                  <circle key={`se-${idx}`} className="se-ps-se-dot" cx={pt.x} cy={pt.y} r="2.7" />
                );
              })}

              <circle
                className="se-ps-start-dot"
                cx={project(LEFT_VIEW, INITIAL_STATE).x}
                cy={project(LEFT_VIEW, INITIAL_STATE).y}
                r="4"
              />

              <PlotAxes view={RIGHT_VIEW} origin={rightOrigin} />
              <path
                className="se-ps-exact-curve"
                d={unitCircleArcPath(RIGHT_VIEW, -0.24, Math.PI * 0.54, 48)}
              />
              <line className="se-ps-overshoot-guide" x1={pSe.x} y1={pSe.y} x2={pFe.x} y2={pFe.y} />

              <line
                className="se-ps-fe-step"
                x1={pStart.x}
                y1={pStart.y}
                x2={pFe.x - 4.5}
                y2={pFe.y - 3.4}
                markerEnd="url(#se-ps-fe-arrow)"
              />
              <line
                className="se-ps-se-step"
                x1={pStart.x}
                y1={pStart.y}
                x2={pMid.x}
                y2={pMid.y - 5.5}
                markerEnd="url(#se-ps-se-arrow)"
              />
              <line
                className="se-ps-se-step"
                x1={pMid.x}
                y1={pMid.y}
                x2={pSe.x - 5.5}
                y2={pSe.y}
                markerEnd="url(#se-ps-se-arrow)"
              />

              <circle className="se-ps-shear-mid" cx={pMid.x} cy={pMid.y} r="3.6" />
              <circle className="se-ps-fe-dot-lg" cx={pFe.x} cy={pFe.y} r="4.2" />
              <circle className="se-ps-se-dot-lg" cx={pSe.x} cy={pSe.y} r="4.2" />
              <circle className="se-ps-start-dot" cx={pStart.x} cy={pStart.y} r="4.3" />

              <g transform="translate(46, 316)">
                <line className="se-ps-exact-curve" x1="0" y1="0" x2="22" y2="0" />
                <text className="se-ps-legend" x="29" y="4">
                  Exact (H = const)
                </text>

                <line className="se-ps-fe-curve" x1="158" y1="0" x2="182" y2="0" />
                <circle className="se-ps-fe-dot" cx="170" cy="0" r="2.8" />
                <text className="se-ps-legend" x="189" y="4">
                  Forward Euler
                </text>

                <line className="se-ps-se-curve" x1="306" y1="0" x2="330" y2="0" />
                <circle className="se-ps-se-dot" cx="318" cy="0" r="2.8" />
                <text className="se-ps-legend" x="337" y="4">
                  Symplectic Euler
                </text>

                <line className="se-ps-be-curve" x1="472" y1="0" x2="496" y2="0" />
                <rect className="se-ps-be-dot" x="481.8" y="-2.2" width="4.4" height="4.4" />
                <text className="se-ps-legend" x="503" y="4">
                  Backward Euler
                </text>
              </g>
            </svg>

            <MathOverlay
              at={{ x: LEFT_VIEW.left + LEFT_VIEW.size + 8, y: leftOrigin.y }}
              tex="q"
              className="se-ps-axis-label"
              align="start"
            />
            <MathOverlay
              at={{ x: leftOrigin.x + 10, y: LEFT_VIEW.top + 12 }}
              tex="p"
              className="se-ps-axis-label"
              align="start"
            />
            <MathOverlay
              at={{ x: RIGHT_VIEW.left + RIGHT_VIEW.size + 8, y: rightOrigin.y }}
              tex="q"
              className="se-ps-axis-label"
              align="start"
            />
            <MathOverlay
              at={{ x: rightOrigin.x + 10, y: RIGHT_VIEW.top + 12 }}
              tex="p"
              className="se-ps-axis-label"
              align="start"
            />

            <MathOverlay
              at={{ x: pStart.x - 10, y: pStart.y - 4 }}
              tex="(q_n, p_n)"
              className="se-ps-state-label"
              align="end"
            />
            <MathOverlay
              at={{ x: pMid.x - 10, y: pMid.y }}
              tex="(q_n, p_{n+1})"
              className="se-ps-state-label se-ps-role-se"
              align="end"
            />
            <MathOverlay
              at={{ x: pSe.x - 4, y: pSe.y + 19 }}
              tex="z_{n+1}^{\mathrm{SE}}"
              className="se-ps-state-label se-ps-role-se"
              align="center"
            />
            <MathOverlay
              at={{ x: pFe.x + 6, y: pFe.y - 8 }}
              tex="z_{n+1}^{\mathrm{FE}}"
              className="se-ps-state-label se-ps-role-fe"
              align="start"
            />
          </div>
        </div>
      </div>

      <figcaption>
        高维线性系统在单个归一化主模态共轭平面（
        <span className="math-inline">{String.raw`\(\omega_i=1,\;H_i(q,p)=\frac{1}{2}(q^2+p^2)\)`}</span>
        ，双精度递推）上的相空间切片对比。左图从{' '}
        <span className="math-inline">{String.raw`\((q_0,p_0)=(0.6,0.8)\)`}</span> 出发演化：Forward
        Euler 在该模态平面上的投影有向面积每步放大{' '}
        <span className="math-inline">{String.raw`\(1+\Delta t^2\)`}</span> 倍而向外发散，Backward
        Euler 每步缩小至 <span className="math-inline">{String.raw`\((1+\Delta t^2)^{-1}\)`}</span>{' '}
        而向内阻尼收缩，Symplectic Euler 则沿闭合倾斜椭圆（阴影超椭球在该模态平面上的截口{' '}
        <span className="math-inline">{String.raw`\(\hat{H}_i=\mathrm{const}\)`}</span>
        ）保持能量有界。右图展示单步几何：Forward Euler 用旧动量{' '}
        <span className="math-inline">{String.raw`\(p_n\)`}</span>{' '}
        沿切线同步外推而冲出等能圆；Symplectic Euler
        拆为动量与位置两次分块错切，每步严格保持共轭相平面有向面积守恒。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { SymplecticPhaseSpaceFigure };
