interface DepthPanelSpec {
  readonly key: 'narrow' | 'wide';
  readonly heading: string;
  readonly spanLabel: string;
  readonly near: number;
  readonly far: number;
  readonly wideError: boolean;
}

const PANELS: readonly DepthPanelSpec[] = [
  {
    key: 'narrow',
    heading: '较窄深度范围',
    spanLabel: 'narrow',
    near: 1.6,
    far: 3.6,
    wideError: false,
  },
  {
    key: 'wide',
    heading: '较宽深度范围',
    spanLabel: 'wide',
    near: 0.45,
    far: 5.4,
    wideError: true,
  },
];

const xOrigin = 266;
const yOrigin = 122;
const xScale = 39;
const yScale = 46;

const toX = (ze: number) => xOrigin + xScale * ze;
const toY = (zn: number) => yOrigin - yScale * zn;
const fmt = (value: number) => value.toFixed(1);

function depthNdcFromEye(ze: number, near: number, far: number): number {
  return (far + near) / (far - near) + (2 * far * near) / ((far - near) * ze);
}

function buildCurvePath(near: number, far: number, steps = 48): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ze = -far + t * (far - near);
    const zn = depthNdcFromEye(ze, near, far);
    points.push(`${i === 0 ? 'M' : 'L'}${fmt(toX(ze))} ${fmt(toY(zn))}`);
  }
  return points.join(' ');
}

function DepthPanel({ spec }: { spec: DepthPanelSpec }) {
  const arrowId = `cg-dp-arrow-${spec.key}`;
  const roseArrowId = `cg-dp-rose-arrow-${spec.key}`;
  const xFar = toX(-spec.far);
  const xNear = toX(-spec.near);
  const yTop = toY(1);
  const yBot = toY(-1);
  const midSpanX = (xFar + xNear) / 2;

  return (
    <div className="cg-depth-panel">
      <svg
        viewBox="0 0 320 212"
        role="img"
        aria-label={
          spec.wideError
            ? '较宽深度范围下 z_n 随 z_e 变化的曲线，远处趋于平缓并出现 z-fighting 精度损失区'
            : '较窄深度范围下 z_n 随 z_e 变化的曲线，整体斜率分布更均匀'
        }
      >
        <title>{spec.heading}</title>
        <desc>
          {spec.wideError
            ? '当远平面与近平面比值过大时，曲线在靠近 -f 处几乎平贴 z_n = 1，不同深度映射后几乎相等，造成 z-fighting。'
            : '当近平面与远平面距离较近时，z_n 在 [-1, 1] 内随 z_e 变化较为平缓均匀。'}
        </desc>
        <defs>
          <marker
            id={arrowId}
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 1.2L10 5L0 8.8Z" className="cg-depth-arrow-head" />
          </marker>
          {spec.wideError && (
            <marker
              id={roseArrowId}
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0 1.2L10 5L0 8.8Z" className="cg-depth-error-arrow-head" />
            </marker>
          )}
        </defs>

        <text className="cg-depth-title" x="14" y="22">
          {spec.heading}
        </text>

        {/* Coordinate axes */}
        <line
          className="cg-depth-axis"
          x1="14"
          y1={yOrigin}
          x2="298"
          y2={yOrigin}
          markerEnd={`url(#${arrowId})`}
        />
        <line
          className="cg-depth-axis"
          x1={xOrigin}
          y1="194"
          x2={xOrigin}
          y2="46"
          markerEnd={`url(#${arrowId})`}
        />

        {/* Reference guides at z_n = 1, -1 and z_e = -f, -n */}
        <line className="cg-depth-guide" x1={xFar} y1={yTop} x2={xOrigin} y2={yTop} />
        <line className="cg-depth-guide" x1={xFar} y1={yBot} x2={xOrigin} y2={yBot} />
        <line className="cg-depth-guide" x1={xFar} y1={yTop} x2={xFar} y2={yBot + 6} />
        <line className="cg-depth-guide" x1={xNear} y1={yOrigin} x2={xNear} y2={yBot + 6} />

        {/* Span indicator between -f and -n */}
        <line
          className="cg-depth-span"
          x1={xFar + 3}
          y1={yBot}
          x2={xNear - 3}
          y2={yBot}
          markerStart={`url(#${arrowId})`}
          markerEnd={`url(#${arrowId})`}
        />
        <text className="cg-depth-span-label" x={fmt(midSpanX)} y={yBot - 6} textAnchor="middle">
          {spec.spanLabel}
        </text>

        {/* Non-linear z_n(z_e) curve */}
        <path className="cg-depth-curve" d={buildCurvePath(spec.near, spec.far)} />
        <circle className="cg-depth-endpoint" cx={fmt(xFar)} cy={fmt(yTop)} r="4" />
        <circle className="cg-depth-endpoint" cx={fmt(xNear)} cy={fmt(yBot)} r="4" />

        {/* Axis and endpoint labels */}
        <text className="cg-depth-var" x="303" y={yOrigin + 4}>
          z
          <tspan className="cg-depth-sub" dy="3">
            e
          </tspan>
        </text>
        <text className="cg-depth-var" x={xOrigin} y="37" textAnchor="middle">
          z
          <tspan className="cg-depth-sub" dy="3">
            n
          </tspan>
        </text>
        <text className="cg-depth-tick" x={xOrigin + 9} y={yTop + 4}>
          1
        </text>
        <text className="cg-depth-tick" x={xOrigin + 9} y={yBot + 4}>
          −1
        </text>
        <text className="cg-depth-var" x={fmt(xFar)} y={yOrigin + 16} textAnchor="middle">
          −f
        </text>
        <text className="cg-depth-var" x={fmt(xNear)} y={yOrigin - 10} textAnchor="middle">
          −n
        </text>

        {/* Precision error highlight on the wide-range curve */}
        {spec.wideError && (
          <g>
            <ellipse className="cg-depth-error-ring" cx="92" cy="78" rx="46" ry="20" />
            <path
              className="cg-depth-error-pointer"
              d="M148 30 H92 V53"
              markerEnd={`url(#${roseArrowId})`}
            />
            <text className="cg-depth-error-label" x="154" y="28">
              深度精度不足
            </text>
            <text className="cg-depth-error-label" x="154" y="43">
              (z-fighting)
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function DepthPrecisionFigure() {
  return (
    <figure className="cg-depth">
      <div className="cg-depth-panels">
        {PANELS.map((spec) => (
          <DepthPanel key={spec.key} spec={spec} />
        ))}
      </div>
      <figcaption>
        透视除法使{' '}
        <span className="cg-depth-math">
          z<sub>n</sub>
        </span>{' '}
        按{' '}
        <span className="cg-depth-math">
          1 / z<sub>e</sub>
        </span>{' '}
        非线性变化。右图中 <span className="cg-depth-math">[−f, −n]</span> 跨度更大（
        <span className="cg-depth-math">f / n</span> 更大），大部分深度值挤在近平面{' '}
        <span className="cg-depth-math">−n</span> 附近，远端曲线几乎贴平{' '}
        <span className="cg-depth-math">
          z<sub>n</sub> = 1
        </span>
        ，从而引发 z-fighting。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { DepthPrecisionFigure };
