import { depths, outline, position, rayDepths, segment } from './frustum-model';

const PROGRESS_INPUT_ID = 'fm-progress-input';

function Panel({ source }: { source: boolean }) {
  const p = (x: number, d: number) => position(x, d, 1, source);
  return (
    <svg
      viewBox="0 0 320 315"
      role="img"
      aria-label={source ? '相机空间的视锥截面' : '归一化结果截面'}
      data-fm-panel={source ? 'source' : 'result'}
    >
      <title>
        {source ? '原空间：横轴 x，纵轴深度 d' : '变换结果：横轴归一化 x，纵轴归一化深度'}
      </title>
      <desc>横线代表深度切片。A、B、C 位于同一视线上；变换后横坐标相同，深度仍然不同。</desc>
      {!source && <polygon className="fm-target" points={outline(1)} />}
      <path className="fm-axis" d="M 160 38 V 280 M 35 169 H 285" />
      <polygon className="fm-volume" data-fm-outline="" points={outline(1, source)} />
      {depths.map((d) => (
        <path
          key={d}
          className="fm-slice"
          data-fm-depth={d}
          d={segment(p(-d / 2, d), p(d / 2, d))}
        />
      ))}
      <path className="fm-ray" data-fm-ray="" d={segment(p(0.25, 1), p(2.5, 10))} />
      {rayDepths.map((d, i) => (
        <g key={d} data-fm-point={d} transform={`translate(${p(d / 4, d).join(' ')})`}>
          <circle r="4" />
          <text x="8" y="-6">
            {['A', 'B', 'C'][i]}
          </text>
        </g>
      ))}
      <text x="18" y="24">
        {source ? '相机空间 · x / d' : '变换结果 · x / 深度'}
      </text>
      <text x="18" y="298" data-fm-caption={source ? undefined : ''}>
        {source ? 'near: d = 1 → far: d = 10' : 'near: −1 → far: +1'}
      </text>
    </svg>
  );
}

function FrustumMapFigure() {
  return (
    <figure className="fm" data-frustum-map="" data-post-enhancement="frustum-map">
      <div className="fm-heading">
        <strong>从视锥截面到 NDC</strong>
        <span>n = 1 · f = 10 · near 半宽 = 0.5</span>
      </div>
      <div className="fm-panels">
        <Panel source={true} />
        <Panel source={false} />
      </div>
      <div className="fm-controls" data-agent-omit="" hidden>
        <button type="button" data-fm-play="">
          播放
        </button>
        <label htmlFor={PROGRESS_INPUT_ID}>变换进度</label>
        <input
          id={PROGRESS_INPUT_ID}
          data-fm-progress=""
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue="1"
        />
        <output htmlFor={PROGRESS_INPUT_ID} data-fm-value="">
          100% · NDC 正方形
        </output>
      </div>
      <figcaption>
        左图为相机空间截面，右图展示透视映射结果；横线为等距深度切片（d = 1…10），A、B、C
        位于同一条视线上。变换后直线仍为直线，远处切片更加密集；中间过渡仅用于示意。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { FrustumMapFigure };
