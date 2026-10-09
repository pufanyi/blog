import {
  initialRope,
  playground,
  projectRope,
  ropeFrame,
  ropeMetrics,
  ropeViewport,
} from './playground-model';

function RopePlayground() {
  const frame = ropeFrame(initialRope);
  const viewport = ropeViewport(initialRope);
  const ui = viewport.uiScale;
  const tip = projectRope({
    x: playground.y * Math.cos(playground.theta),
    y: playground.y * Math.sin(playground.theta),
  });
  return (
    <figure className="rope-playground" data-rope-playground="" data-post-enhancement="playground">
      <p className="rope-playground-intro">
        拖动图中的
        A、B，或使用下方滑块，观察同一对墙之间的圆弧。调整滑块时视图自动缩放，直接拖动端点时比例保持固定。
      </p>
      <svg
        viewBox={viewport.box}
        role="group"
        aria-labelledby="rope-playground-title rope-playground-description"
        data-rope-svg=""
      >
        <title id="rope-playground-title">可调整端点与绳长的圆弧</title>
        <desc id="rope-playground-description">
          墙角六十度，第一面墙长一，第二面墙长二。A 沿水平墙移动，B
          沿斜墙移动；棕色曲线表示绳子，虚线表示弦。
        </desc>
        <path d={frame.region} className="rope-wall-region" data-rope-region="" />
        <path
          d={`M ${playground.ox + playground.x * playground.scale} ${playground.oy} L ${playground.ox} ${playground.oy} L ${tip.x} ${tip.y}`}
          className="rope-wall-wall"
        />
        <path d={frame.chord} className="rope-wall-chord" data-rope-chord="" />
        <path d={frame.rope} className="rope-wall-rope" data-rope-arc="" />
        <text
          data-rope-origin=""
          x={playground.ox - 24 * ui}
          y={playground.oy + 26 * ui}
          style={{ fontSize: 22 * ui }}
        >
          O
        </text>
        {(['a', 'b'] as const).map((key) => (
          <g
            key={key}
            transform={`translate(${frame[key].x} ${frame[key].y})`}
            data-rope-handle={key}
            className="rope-playground-handle"
          >
            <circle r={34 * ui} className="rope-playground-hit" />
            <circle r={11 * ui} className="rope-playground-knob" />
            <text
              x={(key === 'a' ? 17 : -29) * ui}
              y={(key === 'a' ? 24 : -18) * ui}
              style={{ fontSize: 22 * ui }}
            >
              {key.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
      <div data-rope-controls="" data-agent-omit="" hidden>
        <div className="rope-playground-sliders">
          {(
            [
              ['a', 'A 的位置（OA）', 0, 1, initialRope.a],
              ['b', 'B 的位置（OB）', 0, 2, initialRope.b],
              ['s', '绳长 s', 0.1, 8, initialRope.s],
            ] as const
          ).map(([key, label, min, max, value]) => (
            <label key={key}>
              <span>
                {label}
                <output data-rope-value={key}>{value.toFixed(2)}</output>
              </span>
              <input
                type="range"
                aria-label={label}
                min={min}
                max={max}
                step="0.01"
                defaultValue={value}
                data-rope-input={key}
              />
            </label>
          ))}
        </div>
        <div className="rope-playground-presets">
          <button type="button" data-rope-preset="sector">
            扇形
          </button>
          <button type="button" data-rope-preset="major">
            大圆弧
          </button>
          <button type="button" data-rope-preset="straight">
            刚好拉直
          </button>
          <button type="button" data-rope-preset="reset">
            重置
          </button>
        </div>
      </div>
      <p className="rope-playground-metrics" data-rope-metrics="">
        {ropeMetrics(frame)}
      </p>
      <p className="rope-playground-status" data-rope-status="" role="status">
        {frame.status}
      </p>
      <figcaption>
        初始状态：夹角六十度，两面墙长分别为一、二，使用墙长一、1.7，绳长二。拖动端点只改变使用的墙长，实际墙端保持不动；增大绳长会让圆弧逐渐鼓起。虚线不是绳子。若图形碰到剩余墙段，会单独标明不可行。
      </figcaption>
    </figure>
  );
}
export const POST_COMPONENTS = { RopePlayground };
