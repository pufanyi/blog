import { depths, outline, position, rayDepths, segment } from './frustum-model';

function Panel({ source }: { source: boolean }) {
  const p = (x: number, d: number) => position(x, d, 1, source);
  return (
    <svg
      viewBox="0 0 320 320"
      role={source ? 'img' : 'group'}
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
          <circle r="5" />
          <text x="9" y="-7">
            {['A', 'B', 'C'][i]}
          </text>
        </g>
      ))}
      <path className="fm-selected" data-fm-selected="" d={segment(p(-2, 4), p(2, 4))} />
      {!source &&
        [-1, 1].map((side) => (
          <foreignObject
            key={side}
            data-fm-handle-box={side}
            x={p(side * 5, 10)[0] - 22}
            y={p(side * 5, 10)[1] - 22}
            width="44"
            height="44"
            className="fm-handle-box"
            data-agent-omit=""
          >
            <button
              type="button"
              data-fm-handle={side}
              hidden
              aria-label={`${side < 0 ? '左' : '右'}侧远端角点；方向键调整变换进度，Home 复原，End 变成正方形`}
            >
              ↔
            </button>
          </foreignObject>
        ))}
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
        <p className="fm-help">
          把右图底部任一角点向内拖，直到贴合虚线正方形。也可点击按钮或滑块；角点获得焦点后可用方向键调整。
        </p>
        <div className="fm-steps">
          {['复原梯形', '变成正方形'].map((label, i) => (
            <button type="button" key={label} data-fm-step={i}>
              {i + 1}. {label}
            </button>
          ))}
        </div>
        <label>
          变换进度{' '}
          <input data-fm-progress="" type="range" min="0" max="1" step="0.01" defaultValue="1" />
        </label>
        <label>
          观察深度切片{' '}
          <input data-fm-slider="" type="range" min="1" max="10" step="0.1" defaultValue="4" />
        </label>
        <button type="button" data-fm-play="">
          播放全过程
        </button>
        <p data-fm-status="" role="status">
          已映射为正方形
        </p>
        <output data-fm-values="">d = 4.0；半宽 = 2.0 → 1；NDC 深度 = 0.667</output>
      </div>
      <figcaption>
        实线是深度切片，虚线是同一条视线，粗线标出观察切片。A、B、C 的最终横坐标均为
        0.5，深度不同。左图保持原状，右图展示变换；两图使用各自的坐标尺度。拖动时整张网格一起变形，直线仍是直线，但等距切片不再等距。虚线轮廓为目标正方形。中间形状来自连续变化的透视映射，用于教学，并非
        GPU 的计算阶段。
      </figcaption>
    </figure>
  );
}
export const POST_COMPONENTS = { FrustumMapFigure };
