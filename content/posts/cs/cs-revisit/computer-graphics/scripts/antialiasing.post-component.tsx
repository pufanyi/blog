interface Point {
  readonly x: number;
  readonly y: number;
}

interface SubSample extends Point {
  readonly id: string;
  readonly label: string;
  readonly covered: boolean;
}

const PIXEL_ORIGIN_X = 28;
const PIXEL_ORIGIN_Y = 44;
const PIXEL_SIZE = 120;
const PIXEL_CENTER: Point = {
  x: PIXEL_ORIGIN_X + PIXEL_SIZE / 2,
  y: PIXEL_ORIGIN_Y + PIXEL_SIZE / 2,
};

// Triangle edge entering the pixel from (28, 128) to (112, 44): line x + y = 156.
// Points with x + y >= 156 lie inside the triangle.
const EDGE_SUM_THRESHOLD = 156;
const TRIANGLE_POLYGON = `${PIXEL_ORIGIN_X},128 112,${PIXEL_ORIGIN_Y} ${PIXEL_ORIGIN_X + PIXEL_SIZE},${PIXEL_ORIGIN_Y} ${PIXEL_ORIGIN_X + PIXEL_SIZE},${PIXEL_ORIGIN_Y + PIXEL_SIZE} ${PIXEL_ORIGIN_X},${PIXEL_ORIGIN_Y + PIXEL_SIZE}`;

const SUB_SAMPLES: readonly SubSample[] = [
  { id: 's0', label: 'bg', x: PIXEL_ORIGIN_X + 30, y: PIXEL_ORIGIN_Y + 30 },
  { id: 's1', label: 'c₁', x: PIXEL_ORIGIN_X + 90, y: PIXEL_ORIGIN_Y + 30 },
  { id: 's2', label: 'c₂', x: PIXEL_ORIGIN_X + 30, y: PIXEL_ORIGIN_Y + 90 },
  { id: 's3', label: 'c₃', x: PIXEL_ORIGIN_X + 90, y: PIXEL_ORIGIN_Y + 90 },
].map((sample) => ({
  ...sample,
  covered: sample.x + sample.y >= EDGE_SUM_THRESHOLD,
}));

const COVERED_COUNT = SUB_SAMPLES.filter((sample) => sample.covered).length;

interface SamplingPanelProps {
  readonly mode: 'ssaa' | 'msaa';
}

function SamplingPanel({ mode }: SamplingPanelProps) {
  const isSsaa = mode === 'ssaa';
  const heading = isSsaa ? '4× SSAA（超采样）' : '4× MSAA（多重采样）';
  const arrowId = `cg-aa-arrow-${mode}`;
  const shadeClasses = ['cg-aa-shade-1', 'cg-aa-shade-2', 'cg-aa-shade-3'];

  return (
    <div className="cg-aa-panel">
      <svg
        viewBox="0 0 320 228"
        role="img"
        aria-label={
          isSsaa
            ? '4 倍 SSAA 在 4 个子采样点分别做覆盖与深度测试，并对全部 3 个被覆盖的子采样点分别执行 shading，最后平均'
            : '4 倍 MSAA 在 4 个子采样点分别做覆盖与深度测试，但仅在像素中心执行一次 shading 并复制到 3 个被覆盖的子采样点，最后平均'
        }
      >
        <title>{heading}</title>
        <desc>
          {isSsaa
            ? '三角形覆盖 2×2 子采样网格中的 3 个点。SSAA 对每个被覆盖点分别着色（c1、c2、c3），再将 4 个子样本平均得到像素颜色。'
            : '三角形覆盖 2×2 子采样网格中的 3 个点。MSAA 仅在像素中心计算一次着色值 c，写入 3 个通过覆盖测试的子样本，再平均得到像素颜色。'}
        </desc>
        <defs>
          <marker
            id={arrowId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto"
          >
            <path d="M0 1.2L10 5L0 8.8Z" className="cg-aa-arrow-head" />
          </marker>
        </defs>

        <text className="cg-aa-title" x="14" y="24">
          {heading}
        </text>

        {/* Sub-pixel 2x2 grid */}
        <rect
          className="cg-aa-pixel-bg"
          x={PIXEL_ORIGIN_X}
          y={PIXEL_ORIGIN_Y}
          width={PIXEL_SIZE}
          height={PIXEL_SIZE}
        />
        <polygon className="cg-aa-tri-a" points={TRIANGLE_POLYGON} />
        <line
          className="cg-aa-subgrid"
          x1={PIXEL_CENTER.x}
          y1={PIXEL_ORIGIN_Y}
          x2={PIXEL_CENTER.x}
          y2={PIXEL_ORIGIN_Y + PIXEL_SIZE}
        />
        <line
          className="cg-aa-subgrid"
          x1={PIXEL_ORIGIN_X}
          y1={PIXEL_CENTER.y}
          x2={PIXEL_ORIGIN_X + PIXEL_SIZE}
          y2={PIXEL_CENTER.y}
        />
        <line
          className="cg-aa-tri-edge"
          x1={PIXEL_ORIGIN_X}
          y1="128"
          x2="112"
          y2={PIXEL_ORIGIN_Y}
        />
        <rect
          className="cg-aa-pixel-frame"
          x={PIXEL_ORIGIN_X}
          y={PIXEL_ORIGIN_Y}
          width={PIXEL_SIZE}
          height={PIXEL_SIZE}
        />

        {/* MSAA center-to-sample broadcast lines */}
        {!isSsaa &&
          SUB_SAMPLES.filter((sample) => sample.covered).map((sample) => {
            const dx = sample.x - PIXEL_CENTER.x;
            const dy = sample.y - PIXEL_CENTER.y;
            const dist = Math.hypot(dx, dy);
            const startOffset = 8;
            const endOffset = 9;
            return (
              <line
                key={`copy-${sample.id}`}
                className="cg-aa-broadcast"
                x1={(PIXEL_CENTER.x + (dx / dist) * startOffset).toFixed(1)}
                y1={(PIXEL_CENTER.y + (dy / dist) * startOffset).toFixed(1)}
                x2={(sample.x - (dx / dist) * endOffset).toFixed(1)}
                y2={(sample.y - (dy / dist) * endOffset).toFixed(1)}
                markerEnd={`url(#${arrowId})`}
              />
            );
          })}

        {/* Sub-sample markers */}
        {SUB_SAMPLES.map((sample, idx) => {
          const coveredIdx = idx - 1;
          return (
            <g key={sample.id}>
              {isSsaa && sample.covered && (
                <circle className="cg-aa-shade-ring" cx={sample.x} cy={sample.y} r="9" />
              )}
              <circle
                className={
                  sample.covered
                    ? isSsaa
                      ? `cg-aa-sample-dot ${shadeClasses[coveredIdx]}`
                      : 'cg-aa-sample-dot cg-aa-shade-shared'
                    : 'cg-aa-sample-dot cg-aa-sample-empty'
                }
                cx={sample.x}
                cy={sample.y}
                r="5"
              />
              <text
                className="cg-aa-sample-text"
                x={sample.x}
                y={sample.y + (sample.y < PIXEL_CENTER.y ? -12 : 18)}
                textAnchor="middle"
              >
                {sample.covered ? (isSsaa ? sample.label : 'c') : 'bg'}
              </text>
            </g>
          );
        })}

        {/* MSAA pixel-center shading marker */}
        {!isSsaa && (
          <g>
            <polygon
              className="cg-aa-center-diamond"
              points={`${PIXEL_CENTER.x},${PIXEL_CENTER.y - 6.5} ${PIXEL_CENTER.x + 6.5},${PIXEL_CENTER.y} ${PIXEL_CENTER.x},${PIXEL_CENTER.y + 6.5} ${PIXEL_CENTER.x - 6.5},${PIXEL_CENTER.y}`}
            />
            <text
              className="cg-aa-center-tag"
              x={PIXEL_CENTER.x - 10}
              y={PIXEL_CENTER.y - 8}
              textAnchor="end"
            >
              shade
            </text>
          </g>
        )}

        {/* Right side: sample buffer -> resolve */}
        <text className="cg-aa-bar-caption" x="172" y="56">
          子样本缓冲（4 槽）
        </text>
        {SUB_SAMPLES.map((sample, idx) => {
          const slotX = 172 + idx * 32;
          const coveredIdx = idx - 1;
          return (
            <g key={`slot-${sample.id}`}>
              <rect
                className={
                  sample.covered
                    ? isSsaa
                      ? `cg-aa-slot ${shadeClasses[coveredIdx]}`
                      : 'cg-aa-slot cg-aa-shade-shared'
                    : 'cg-aa-slot cg-aa-slot-bg'
                }
                x={slotX}
                y="64"
                width="26"
                height="26"
                rx="4"
              />
              <text className="cg-aa-slot-label" x={slotX + 13} y="81" textAnchor="middle">
                {sample.covered ? (isSsaa ? sample.label : 'c') : 'bg'}
              </text>
            </g>
          );
        })}

        <line
          className="cg-aa-resolve-arrow"
          x1="234"
          y1="96"
          x2="234"
          y2="117"
          markerEnd={`url(#${arrowId})`}
        />
        <text className="cg-aa-note" x="242" y="111">
          resolve 平均
        </text>

        <rect className="cg-aa-resolved-box" x="172" y="124" width="122" height="30" rx="6" />
        <text className="cg-aa-resolved-text" x="233" y="143" textAnchor="middle">
          {isSsaa ? '(bg + c₁ + c₂ + c₃) / 4' : '(bg + 3c) / 4'}
        </text>

        {/* Bottom summary strip */}
        <rect className="cg-aa-summary-bg" x="14" y="180" width="292" height="36" rx="7" />
        <text className="cg-aa-summary-text" x="24" y="195">
          Coverage &amp; Depth Test：{SUB_SAMPLES.length} 次 / 像素
        </text>
        <text className="cg-aa-summary-accent" x="24" y="210">
          {isSsaa
            ? `Shading：${COVERED_COUNT} 次（每个覆盖点独立计算）`
            : 'Shading：1 次（像素中心着色，复制到覆盖点）'}
        </text>
      </svg>
    </div>
  );
}

function SupersamplingFigure() {
  return (
    <figure className="cg-aa">
      <div className="cg-aa-panels">
        <SamplingPanel mode="ssaa" />
        <SamplingPanel mode="msaa" />
      </div>
      <figcaption>
        4× SSAA 与 4× MSAA 对比（3/4
        子采样点被覆盖）：两者都以子采样点粒度执行覆盖测试与深度测试，区别在于 SSAA
        对每个被覆盖子点分别着色，而 MSAA 每个三角形仅在像素中心着色一次并广播到通过测试的子点。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { SupersamplingFigure };
