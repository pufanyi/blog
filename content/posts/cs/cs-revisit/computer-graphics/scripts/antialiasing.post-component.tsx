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

function CoverageFailureFigure() {
  const px = 24;
  const py = 44;
  const size = 120;
  const midX = px + size / 2;

  return (
    <figure className="cg-aa">
      <div className="cg-aa-panels">
        <div className="cg-aa-panel">
          <svg
            viewBox="0 0 320 204"
            role="img"
            aria-label="两个共享斜边的三角形各覆盖像素的 50%，实际应 100% 覆盖，但按独立覆盖率混色会错误透出 25% 背景"
          >
            <title>相邻共享边：50% + 50% 出现背景缝隙</title>
            <desc>
              左图为一个放大像素，三角形 A 占左下 50%，三角形 B 占右上 50%。右图对比实际 100%
              覆盖与按独立 alpha 混色得到的 75% 覆盖（透出 25% 背景）。
            </desc>
            <defs>
              <pattern
                id="cg-aa-bg-hatch-a"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line className="cg-aa-hatch-line" x1="0" y1="0" x2="0" y2="6" />
              </pattern>
            </defs>

            <text className="cg-aa-title" x="14" y="24">
              相邻共享边（50% + 50%）
            </text>

            {/* Magnified pixel with two adjacent triangles */}
            <polygon
              className="cg-aa-tri-a"
              points={`${px},${py} ${px},${py + size} ${px + size},${py + size}`}
            />
            <polygon
              className="cg-aa-tri-b"
              points={`${px},${py} ${px + size},${py} ${px + size},${py + size}`}
            />
            <line className="cg-aa-shared-edge" x1={px} y1={py} x2={px + size} y2={py + size} />
            <rect className="cg-aa-pixel-frame" x={px} y={py} width={size} height={size} />

            <text className="cg-aa-tri-label" x={px + 34} y={py + 96} textAnchor="middle">
              A 50%
            </text>
            <text className="cg-aa-tri-label" x={px + 86} y={py + 34} textAnchor="middle">
              B 50%
            </text>

            {/* Right comparison bars */}
            <text className="cg-aa-bar-caption" x="166" y="60">
              实际可见：100% 覆盖
            </text>
            <rect className="cg-aa-tri-a" x="166" y="68" width="68" height="24" />
            <rect className="cg-aa-tri-b" x="234" y="68" width="68" height="24" />
            <rect className="cg-aa-bar-frame" x="166" y="68" width="136" height="24" />
            <text className="cg-aa-bar-value" x="200" y="84" textAnchor="middle">
              A 50%
            </text>
            <text className="cg-aa-bar-value" x="268" y="84" textAnchor="middle">
              B 50%
            </text>

            <text className="cg-aa-bar-caption cg-aa-warn-text" x="166" y="122">
              独立混色：透出 25% 背景
            </text>
            <rect className="cg-aa-tri-b" x="166" y="130" width="68" height="24" />
            <rect className="cg-aa-tri-a" x="234" y="130" width="34" height="24" />
            <rect fill="url(#cg-aa-bg-hatch-a)" x="268" y="130" width="34" height="24" />
            <rect className="cg-aa-bar-frame" x="166" y="130" width="136" height="24" />
            <text className="cg-aa-bar-value" x="200" y="146" textAnchor="middle">
              B 50%
            </text>
            <text className="cg-aa-bar-value" x="251" y="146" textAnchor="middle">
              25%
            </text>
            <text className="cg-aa-bar-bg-value" x="285" y="146" textAnchor="middle">
              bg
            </text>

            <text className="cg-aa-note" x="166" y="176">
              0.5 + 0.5 × (1 − 0.5) = 75%
            </text>
          </svg>
        </div>

        <div className="cg-aa-panel">
          <svg
            viewBox="0 0 320 204"
            role="img"
            aria-label="两个三角形在像素左侧完全重叠，前景 B 挡住背景 A，但仅凭覆盖率与单一深度无法分辨遮挡关系"
          >
            <title>像素内重叠：50% 挡住 50% 与单一深度冲突</title>
            <desc>
              左图为一个放大像素，三角形 A 与更近的三角形 B 同占左半 50%，右半 50%
              为背景。右图展示实际可见结果与仅用覆盖率加单一深度时的矛盾。
            </desc>
            <defs>
              <pattern
                id="cg-aa-bg-hatch-b"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line className="cg-aa-hatch-line" x1="0" y1="0" x2="0" y2="6" />
              </pattern>
            </defs>

            <text className="cg-aa-title" x="14" y="24">
              像素内重叠（B 挡住 A）
            </text>

            {/* Right half background */}
            <rect fill="url(#cg-aa-bg-hatch-b)" x={midX} y={py} width={size / 2} height={size} />
            {/* Left half: A behind B */}
            <rect
              className="cg-aa-tri-a-behind"
              x={px + 6}
              y={py + 6}
              width={size / 2 - 6}
              height={size - 12}
            />
            <rect className="cg-aa-tri-b" x={px} y={py} width={size / 2} height={size} />
            <rect
              className="cg-aa-tri-a-outline"
              x={px + 4}
              y={py + 4}
              width={size / 2 - 8}
              height={size - 8}
            />
            <rect className="cg-aa-pixel-frame" x={px} y={py} width={size} height={size} />

            <text className="cg-aa-tri-label" x={px + 30} y={py + 56} textAnchor="middle">
              B (近)
            </text>
            <text className="cg-aa-tri-sublabel" x={px + 30} y={py + 74} textAnchor="middle">
              挡住 A
            </text>
            <text className="cg-aa-bg-label" x={midX + 30} y={py + 64} textAnchor="middle">
              背景 50%
            </text>

            {/* Right comparison bars */}
            <text className="cg-aa-bar-caption" x="166" y="60">
              实际可见：A 完全被遮挡
            </text>
            <rect className="cg-aa-tri-b" x="166" y="68" width="68" height="24" />
            <rect fill="url(#cg-aa-bg-hatch-b)" x="234" y="68" width="68" height="24" />
            <rect className="cg-aa-bar-frame" x="166" y="68" width="136" height="24" />
            <text className="cg-aa-bar-value" x="200" y="84" textAnchor="middle">
              B 50%
            </text>
            <text className="cg-aa-bar-bg-value" x="268" y="84" textAnchor="middle">
              bg 50%
            </text>

            <text className="cg-aa-bar-caption cg-aa-warn-text" x="166" y="122">
              仅存面积 + 单一 Z 值
            </text>
            <rect className="cg-aa-conflict-box" x="166" y="130" width="136" height="46" rx="6" />
            <text className="cg-aa-conflict-line" x="176" y="149">
              · 更新 Z → 误剔除右半远景
            </text>
            <text className="cg-aa-conflict-line" x="176" y="166">
              · 不更新 → B 反被远景覆盖
            </text>
          </svg>
        </div>
      </div>
      <figcaption>
        只记录每个像素的覆盖率会丢失三角形在像素内的空间位置：左图两个共享边三角形各占
        50%，独立混色会漏出 25% 背景；右图同占左半像素的遮挡关系也无法靠单一覆盖率与单一 depth
        buffer 正确处理。
      </figcaption>
    </figure>
  );
}

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

export const POST_COMPONENTS = { CoverageFailureFigure, SupersamplingFigure };
