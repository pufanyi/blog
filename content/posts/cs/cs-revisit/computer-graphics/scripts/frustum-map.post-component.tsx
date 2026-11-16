import { depths, outline, position, rayDepths, segment } from './frustum-model';

function Panel({ source }: { source: boolean }) {
  const p = (x: number, d: number) => position(x, d, 2, source);
  return (
    <svg
      viewBox="0 0 320 320"
      role="img"
      aria-label={source ? '相机空间的视锥截面' : '归一化结果截面'}
      data-fm-panel={source ? 'source' : 'result'}
    >
      <title>
        {source ? '原空间：横轴 x，纵轴深度 d' : '变换结果：横轴归一化 x，纵轴归一化深度'}
      </title>
      <desc>横线代表深度切片。A、B、C 位于同一视线上；变换后横坐标相同，深度仍然不同。</desc>
      <path className="fm-axis" d="M 160 38 V 280 M 35 169 H 285" />
      <polygon className="fm-volume" data-fm-outline="" points={outline(2, source)} />
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
          <circle r="5" />
          <text x="9" y="-7">
            {['A', 'B', 'C'][i]}
          </text>
        </g>
      ))}
      <path className="fm-selected" data-fm-selected="" d={segment(p(-2, 4), p(2, 4))} />
      <text x="18" y="24">
        {source ? '相机空间 · x / d' : '变换结果 · x / 深度'}
      </text>
      <text x="18" y="298">
        {source ? 'near: d = 1 → far: d = 10' : 'near: −1 → far: +1（最终）'}
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
        <div className="fm-steps">
          {['原始视锥', '横向归一化', '深度归一化'].map((label, i) => (
            <button type="button" key={label} data-fm-step={i}>
              {i + 1}. {label}
            </button>
          ))}
        </div>
        <label>
          变换进度{' '}
          <input data-fm-progress="" type="range" min="0" max="2" step="0.01" defaultValue="2" />
        </label>
        <label>
          观察深度切片{' '}
          <input data-fm-slider="" type="range" min="1" max="10" step="0.1" defaultValue="4" />
        </label>
        <button type="button" data-fm-play="">
          播放全过程
        </button>
        <p data-fm-status="" role="status">
          重新分配深度
        </p>
        <output data-fm-values="">d = 4.0；半宽 = 2.0 → 1；NDC 深度 = 0.667</output>
      </div>
      <figcaption>
        实线是深度切片，虚线是同一条视线，粗线标出观察切片。A、B、C 的最终横坐标均为
        0.5，深度不同。左图保持原状，右图展示变换；两图使用各自的坐标尺度。动画中的中间形状是教学补间，并非
        GPU 的计算阶段。
      </figcaption>
    </figure>
  );
}
export const POST_COMPONENTS = { FrustumMapFigure };
