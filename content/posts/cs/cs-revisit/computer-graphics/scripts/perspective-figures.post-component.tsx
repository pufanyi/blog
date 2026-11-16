import { depthNdc, rayDepths, xNdc } from './frustum-model';

type Point = readonly [number, number];
const slices = [1, 2, 4, 7, 10];
const path = (points: readonly Point[]) => points.map((p) => p.join(',')).join(' ');

function MappingPanel({ result }: { result: boolean }) {
  const project = (x: number, d: number): Point =>
    result ? [75 + 90 * (depthNdc(d) + 1), 160 - 90 * xNdc(x, d)] : [45 + 24 * d, 160 - 24 * x];
  const title = result ? 'NDC：正方形截面' : 'Camera space：透视视锥截面';
  const near = project(0, 1);
  const far = project(0, 10);
  return (
    <svg viewBox="0 0 340 340" role="img">
      <title>{title}</title>
      <desc>
        {result
          ? '所有深度切片大小相同；远处切片距离更密。A、B、C 的横坐标相同，但深度不同。'
          : '相机朝向负 z，深度 d 为正。切片大小随深度增加；A、B、C 位于同一条视线上。'}
      </desc>
      <text className="pf-title" x="12" y="22">
        {result ? '变换后 · NDC' : '变换前 · Camera space'}
      </text>
      {
        <text x="12" y="55">
          {result ? '↑ normalized x' : '↑ x'}
        </text>
      }
      {
        <>
          <polygon
            className="pf-plane"
            points={path([project(-0.5, 1), project(0.5, 1), project(5, 10), project(-5, 10)])}
          />
          {slices.map((d) => (
            <polyline
              key={d}
              className={d === 1 ? 'pf-near' : d === 10 ? 'pf-far' : 'pf-inner'}
              points={path([project(-d / 2, d), project(d / 2, d)])}
            />
          ))}
        </>
      }
      {!result && (
        <>
          <circle className="pf-camera" cx={project(0, 0)[0]} cy={project(0, 0)[1]} r="4" />
          <text x={project(0, 0)[0] - 20} y="190">
            Camera
          </text>
          <polyline className="pf-ray" points={path([project(0, 0), project(2.5, 10)])} />
        </>
      )}
      {result && (
        <polyline className="pf-ray" points={path([project(0.25, 1), project(2.5, 10)])} />
      )}
      {rayDepths.map((d, i) => {
        const [x, y] = project(d / 4, d);
        return (
          <g key={d}>
            <circle className="pf-point" cx={x} cy={y} r="4" />
            <text
              className="pf-point-label"
              x={x + (result && i === 1 ? -9 : 7)}
              y={y + (result && i === 1 ? 21 : -9)}
            >
              {['A', 'B', 'C'][i]}
            </text>
          </g>
        );
      })}
      <path className="pf-axis" d={`M ${near[0]} 298 H ${far[0]} l -6 -4 m 6 4 l -6 4`} />
      <text x={near[0]} y="320" textAnchor="middle">
        {result ? 'near: −1' : 'near: 1'}
      </text>
      <text x={far[0]} y="320" textAnchor="middle">
        {result ? 'far: +1' : 'far: 10'}
      </text>
      <text x={(near[0] + far[0]) / 2} y="288" textAnchor="middle">
        {result ? 'NDC depth' : 'depth d = −z'}
      </text>
    </svg>
  );
}
function PerspectiveFigure() {
  return (
    <figure className="pf-figure">
      <div className="pf-panels">
        <MappingPanel result={false} />
        <span className="pf-arrow" aria-hidden="true">
          →
        </span>
        <MappingPanel result={true} />
      </div>
      <figcaption>
        取 y = 0 的截面。梯形映射为正方形；竖线是深度为 1、2、4、7、10 的截面。
        越远的截面按越大的除数缩放，最终高度相同；深度间距也随之改变。左右图使用各自的坐标尺度。
      </figcaption>
    </figure>
  );
}
export const POST_COMPONENTS = {
  PerspectiveMapping2DFigure: PerspectiveFigure,
};
