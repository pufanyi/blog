import {
  ALL_BLOCKS,
  BLOCK_COUNT,
  BLOCK_PRESETS,
  BLOCK_SIZE,
  DEFAULT_BLOCK,
  describeBlockDecision,
  fmt,
  GLOBAL_PANEL_VIEW,
  GRID_SIZE,
  getBlockInfo,
  TRIANGLE_VERTICES,
  toGlobalSvgX,
  toGlobalSvgY,
  toZoomSvgX,
  toZoomSvgY,
  ZOOM_PANEL_VIEW,
} from './block-coverage-model';

const globalTrianglePoints = TRIANGLE_VERTICES.map(
  (v) => `${fmt(toGlobalSvgX(v.x))},${fmt(toGlobalSvgY(v.y))}`,
).join(' ');

function GlobalBlocksPanel() {
  const active = getBlockInfo(DEFAULT_BLOCK.bx, DEFAULT_BLOCK.by);
  const gridLeft = GLOBAL_PANEL_VIEW.originX;
  const gridTop = toGlobalSvgY(GRID_SIZE);
  const gridSpan = GRID_SIZE * GLOBAL_PANEL_VIEW.cell;
  const blockSpan = BLOCK_SIZE * GLOBAL_PANEL_VIEW.cell;
  const [vA, vB, vC] = TRIANGLE_VERTICES;

  return (
    <div className="cg-tri-panel">
      <svg
        viewBox={`0 0 ${GLOBAL_PANEL_VIEW.width} ${GLOBAL_PANEL_VIEW.height}`}
        role="img"
        aria-labelledby="cg-tri-global-title cg-tri-global-desc"
      >
        <title id="cg-tri-global-title">
          16 乘 16 像素网格上逆时针三角形 ABC 的 4 乘 4 区块覆盖分类（early-in、else 与 early-out）
        </title>
        <desc id="cg-tri-global-desc">
          16 乘 16 像素网格被划分为 16 个 4 乘 4 像素区块，按与逆时针三角形 ABC 的位置关系分别着色为
          early-in（绿色）、else（红色）与 early-out（空白）。
        </desc>

        <text className="cg-tri-panel-title" x="14" y="21">
          4 × 4 区块粗筛
        </text>

        {/* Legend matching the three block classifications */}
        <g className="cg-tri-legend" transform="translate(14 38)">
          <rect
            x="0"
            y="-8"
            width="11"
            height="11"
            rx="2"
            className="cg-tri-swatch"
            data-role="early-in"
          />
          <text x="15" y="1">
            early-in
          </text>

          <rect
            x="74"
            y="-8"
            width="11"
            height="11"
            rx="2"
            className="cg-tri-swatch"
            data-role="else"
          />
          <text x="89" y="1">
            else
          </text>

          <rect
            x="128"
            y="-8"
            width="11"
            height="11"
            rx="2"
            className="cg-tri-swatch"
            data-role="early-out"
          />
          <text x="143" y="1">
            early-out
          </text>
        </g>

        {/* Base grid canvas */}
        <rect
          x={gridLeft}
          y={gridTop}
          width={gridSpan}
          height={gridSpan}
          className="cg-tri-canvas"
        />

        {/* Soft classification tint for all 16 4x4 blocks */}
        {ALL_BLOCKS.map((block) => (
          <rect
            key={`bg-${block.key}`}
            x={toGlobalSvgX(block.x0)}
            y={toGlobalSvgY(block.y0 + BLOCK_SIZE)}
            width={blockSpan}
            height={blockSpan}
            className="cg-tri-block-tint"
            data-role={block.classification}
          />
        ))}

        {/* Fine 1x1 pixel grid lines */}
        <g className="cg-tri-fine-grid">
          {Array.from({ length: GRID_SIZE - 1 }, (_, idx) => {
            const g = idx + 1;
            if (g % BLOCK_SIZE === 0) return null;
            const gx = toGlobalSvgX(g);
            const gy = toGlobalSvgY(g);
            return (
              <g key={`fine-${g}`}>
                <line x1={gx} y1={gridTop} x2={gx} y2={gridTop + gridSpan} />
                <line x1={gridLeft} y1={gy} x2={gridLeft + gridSpan} y2={gy} />
              </g>
            );
          })}
        </g>

        {/* Coarse 4x4 block grid lines */}
        <g className="cg-tri-coarse-grid">
          {Array.from({ length: BLOCK_COUNT - 1 }, (_, idx) => {
            const g = (idx + 1) * BLOCK_SIZE;
            const gx = toGlobalSvgX(g);
            const gy = toGlobalSvgY(g);
            return (
              <g key={`coarse-${g}`}>
                <line x1={gx} y1={gridTop} x2={gx} y2={gridTop + gridSpan} />
                <line x1={gridLeft} y1={gy} x2={gridLeft + gridSpan} y2={gy} />
              </g>
            );
          })}
        </g>

        {/* Outer 16x16 grid border */}
        <rect
          x={gridLeft}
          y={gridTop}
          width={gridSpan}
          height={gridSpan}
          className="cg-tri-outer-border"
        />

        {/* Continuous triangle interior, outline, and CCW vertices A, B, C */}
        <polygon points={globalTrianglePoints} className="cg-tri-shape-fill" />
        <polygon points={globalTrianglePoints} className="cg-tri-shape-stroke" />
        <circle
          cx={fmt(toGlobalSvgX(vA.x))}
          cy={fmt(toGlobalSvgY(vA.y))}
          r="2.6"
          className="cg-tri-vertex-dot"
        />
        <circle
          cx={fmt(toGlobalSvgX(vB.x))}
          cy={fmt(toGlobalSvgY(vB.y))}
          r="2.6"
          className="cg-tri-vertex-dot"
        />
        <circle
          cx={fmt(toGlobalSvgX(vC.x))}
          cy={fmt(toGlobalSvgY(vC.y))}
          r="2.6"
          className="cg-tri-vertex-dot"
        />

        {/* CCW triangle vertex labels A, B, C placed in clear margins */}
        <text
          x={gridLeft - 10}
          y={fmt(toGlobalSvgY(vA.y) + 3)}
          textAnchor="end"
          className="cg-tri-vertex-label"
        >
          A
        </text>
        <text
          x={gridLeft + gridSpan + 8}
          y={fmt(toGlobalSvgY(vB.y) + 4)}
          className="cg-tri-vertex-label"
        >
          B
        </text>
        <text
          x={fmt(toGlobalSvgX(vC.x))}
          y={gridTop - 6}
          textAnchor="middle"
          className="cg-tri-vertex-label"
        >
          C
        </text>

        {/* Active zoom selection frame */}
        <rect
          data-tri-active-frame=""
          x={toGlobalSvgX(active.x0) + 1}
          y={toGlobalSvgY(active.y0 + BLOCK_SIZE) + 1}
          width={blockSpan - 2}
          height={blockSpan - 2}
          rx="3"
          className="cg-tri-active-frame"
        />

        {/* Block boundary coordinate ticks (0, 4, 8, 12, 16) */}
        {Array.from({ length: BLOCK_COUNT + 1 }, (_, i) => {
          const g = i * BLOCK_SIZE;
          return (
            <g key={`tick-${g}`}>
              <text
                x={toGlobalSvgX(g)}
                y={GLOBAL_PANEL_VIEW.originY + 15}
                textAnchor="middle"
                className="cg-tri-tick"
              >
                {g}
              </text>
              <text
                x={gridLeft - 8}
                y={toGlobalSvgY(g) + 4}
                textAnchor="end"
                className="cg-tri-tick"
              >
                {g}
              </text>
            </g>
          );
        })}
        <text
          x={gridLeft + gridSpan + 12}
          y={GLOBAL_PANEL_VIEW.originY + 4}
          className="cg-tri-axis-var"
        >
          x
        </text>
        <text x={gridLeft - 20} y={gridTop + 4} textAnchor="end" className="cg-tri-axis-var">
          y
        </text>

        {/* Interactive 4x4 block hit targets */}
        <g className="cg-tri-hit-layer">
          {ALL_BLOCKS.map((block) => (
            <rect
              key={`hit-${block.key}`}
              data-tri-block={block.key}
              x={toGlobalSvgX(block.x0)}
              y={toGlobalSvgY(block.y0 + BLOCK_SIZE)}
              width={blockSpan}
              height={blockSpan}
              className="cg-tri-block-hit"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function ZoomBlockPanel() {
  const block = getBlockInfo(DEFAULT_BLOCK.bx, DEFAULT_BLOCK.by);
  const decision = describeBlockDecision(block);
  const gridLeft = ZOOM_PANEL_VIEW.originX;
  const gridTop = ZOOM_PANEL_VIEW.originY - BLOCK_SIZE * ZOOM_PANEL_VIEW.cell;
  const gridSize = BLOCK_SIZE * ZOOM_PANEL_VIEW.cell;
  const sampleLeft = gridLeft + 0.5 * ZOOM_PANEL_VIEW.cell;
  const sampleTop = gridTop + 0.5 * ZOOM_PANEL_VIEW.cell;
  const sampleSize = (BLOCK_SIZE - 1) * ZOOM_PANEL_VIEW.cell;

  const zoomTriPoints = TRIANGLE_VERTICES.map(
    (v) => `${fmt(toZoomSvgX(v.x, block.x0))},${fmt(toZoomSvgY(v.y, block.y0))}`,
  ).join(' ');

  return (
    <div className="cg-tri-panel">
      <svg
        data-tri-zoom-root=""
        data-role={block.classification}
        viewBox={`0 0 ${ZOOM_PANEL_VIEW.width} ${ZOOM_PANEL_VIEW.height}`}
        role="img"
        aria-labelledby="cg-tri-zoom-title cg-tri-zoom-desc"
      >
        <title id="cg-tri-zoom-title">{`局部放大：区块 (${block.bx}, ${block.by}) 的采样包围盒与 ${decision.badgeText} 判定`}</title>
        <desc id="cg-tri-zoom-desc">
          放大单个 4 乘 4 像素区块，显示四角测试采样框 [x_l, x_r] 乘 [y_l, y_r] 与 16
          个像素中心的覆盖状态。
        </desc>
        <defs>
          <clipPath id="cg-tri-zoom-clip">
            <rect x={gridLeft} y={gridTop} width={gridSize} height={gridSize} />
          </clipPath>
        </defs>

        <text data-tri-zoom-heading="" className="cg-tri-panel-title" x="14" y="21">
          {`区块 (${block.bx}, ${block.by}) · ${decision.badgeText}`}
        </text>

        {/* Compact 2-item legend */}
        <g className="cg-tri-legend" transform="translate(14 38)">
          <rect x="0" y="-8" width="11" height="11" rx="1.5" className="cg-tri-legend-sample-box" />
          <text x="15" y="1">
            采样框 [xₗ, xᵣ]×[yₗ, yᵣ]
          </text>

          <rect x="150" y="-8" width="11" height="11" rx="1.5" className="cg-tri-legend-covered" />
          <text x="165" y="1">
            命中像素
          </text>
        </g>

        {/* 4x4 magnified pixel cells */}
        {block.samples.map((sample) => {
          const cellX = gridLeft + sample.localCol * ZOOM_PANEL_VIEW.cell;
          const cellY = ZOOM_PANEL_VIEW.originY - (sample.localRow + 1) * ZOOM_PANEL_VIEW.cell;
          return (
            <rect
              key={`zcell-${sample.localCol}-${sample.localRow}`}
              data-tri-zcell={`${sample.localCol},${sample.localRow}`}
              data-covered={sample.inside ? 'true' : 'false'}
              x={cellX}
              y={cellY}
              width={ZOOM_PANEL_VIEW.cell}
              height={ZOOM_PANEL_VIEW.cell}
              className="cg-tri-zcell"
            />
          );
        })}

        {/* Clipped continuous triangle inside the 4x4 pixel window */}
        <g clipPath="url(#cg-tri-zoom-clip)">
          <polygon
            data-tri-ztriangle-fill=""
            points={zoomTriPoints}
            className="cg-tri-zshape-fill"
          />
          <polygon
            data-tri-ztriangle-stroke=""
            points={zoomTriPoints}
            className="cg-tri-zshape-stroke"
          />
        </g>

        {/* Outer 4x4 pixel block border */}
        <rect
          x={gridLeft}
          y={gridTop}
          width={gridSize}
          height={gridSize}
          className="cg-tri-zpixel-box"
        />

        {/* Tight sample-center bounding box [x_l, x_r] x [y_l, y_r] */}
        <rect
          data-tri-zsample-box=""
          data-role={block.classification}
          x={sampleLeft}
          y={sampleTop}
          width={sampleSize}
          height={sampleSize}
          className="cg-tri-zsample-box"
        />

        {/* 16 sample center markers (4 corners get an outer test ring) */}
        {block.samples.map((sample) => {
          const cx = gridLeft + (sample.localCol + 0.5) * ZOOM_PANEL_VIEW.cell;
          const cy = ZOOM_PANEL_VIEW.originY - (sample.localRow + 0.5) * ZOOM_PANEL_VIEW.cell;
          return (
            <g
              key={`zpt-${sample.localCol}-${sample.localRow}`}
              data-tri-zpt={`${sample.localCol},${sample.localRow}`}
              data-covered={sample.inside ? 'true' : 'false'}
              data-corner={sample.isCorner ? 'true' : 'false'}
            >
              {sample.isCorner && (
                <circle cx={cx} cy={cy} r="6.2" className="cg-tri-zcorner-ring" />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={sample.isCorner ? '3.4' : '2.7'}
                className="cg-tri-zsample-dot"
              />
            </g>
          );
        })}

        {/* Left integer y-axis ticks */}
        {Array.from({ length: BLOCK_SIZE + 1 }, (_, i) => (
          <text
            key={`zy-${i}`}
            data-tri-zy-tick={i}
            x={gridLeft - 8}
            y={ZOOM_PANEL_VIEW.originY - i * ZOOM_PANEL_VIEW.cell + 4}
            textAnchor="end"
            className="cg-tri-tick"
          >
            {block.y0 + i}
          </text>
        ))}
        <text x="18" y={gridTop + 4} className="cg-tri-axis-var">
          y
        </text>

        {/* Bottom integer x-axis ticks */}
        {Array.from({ length: BLOCK_SIZE + 1 }, (_, i) => (
          <text
            key={`zx-${i}`}
            data-tri-zx-tick={i}
            x={gridLeft + i * ZOOM_PANEL_VIEW.cell}
            y={ZOOM_PANEL_VIEW.originY + 16}
            textAnchor="middle"
            className="cg-tri-tick"
          >
            {block.x0 + i}
          </text>
        ))}
        <text
          x={gridLeft + gridSize + 12}
          y={ZOOM_PANEL_VIEW.originY + 4}
          className="cg-tri-axis-var"
        >
          x
        </text>
      </svg>
    </div>
  );
}

function BlockCoverageFigure() {
  const initialBlock = getBlockInfo(DEFAULT_BLOCK.bx, DEFAULT_BLOCK.by);
  const initialDecision = describeBlockDecision(initialBlock);

  return (
    <figure className="cg-tri" data-block-coverage="" data-post-enhancement="block-coverage">
      <div className="cg-tri-heading">
        <strong>三角形区块粗筛：early-in / early-out / else</strong>
        <span>16 × 16 像素 · 4 × 4 区块</span>
      </div>

      <div className="cg-tri-panels">
        <GlobalBlocksPanel />
        <ZoomBlockPanel />
      </div>

      <div className="cg-tri-readout" aria-live="polite">
        <strong data-tri-readout-title="">{initialDecision.readoutTitle}</strong>
        <span data-tri-readout-note="">{initialDecision.boxDiffNote}</span>
      </div>

      <div
        className="cg-tri-controls"
        role="group"
        aria-label="选择要放大查看的 4×4 像素区块"
        data-agent-omit=""
        hidden
      >
        {BLOCK_PRESETS.map((preset) => {
          const isDefault = preset.bx === DEFAULT_BLOCK.bx && preset.by === DEFAULT_BLOCK.by;
          return (
            <button
              key={`${preset.bx},${preset.by}`}
              type="button"
              data-tri-preset={`${preset.bx},${preset.by}`}
              aria-pressed={isDefault ? 'true' : 'false'}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <figcaption>
        将 16 × 16 像素划分为 4 × 4 区块后，线性边函数{' '}
        <span className="math-inline">{String.raw`\(E_{AB}, E_{BC}, E_{CA}\)`}</span> 在采样框{' '}
        <span className="math-inline">{String.raw`\([x_l, x_r] \times [y_l, y_r]\)`}</span>{' '}
        上的极值必在四角取到：三边最小值均{' '}
        <span className="math-inline">{String.raw`\(\ge 0\)`}</span> 时为 <strong>early-in</strong>
        （整块命中）；某边最大值 <span className="math-inline">{String.raw`\(< 0\)`}</span> 时为{' '}
        <strong>early-out</strong>
        （整块剔除）；其余为 <strong>else</strong>，需继续细分。
        <span data-agent-omit="">点击左图任意区块或上方按钮可切换查看。</span>
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { BlockCoverageFigure };
