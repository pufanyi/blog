import {
  ALL_BLOCKS,
  BLOCK_COUNT,
  BLOCK_PRESETS,
  BLOCK_SIZE,
  CANONICAL_BLOCKS,
  DEFAULT_BLOCK,
  describeBlockDecision,
  fmt,
  GLOBAL_PANEL_VIEW,
  GRID_SIZE,
  getBlockInfo,
  pointInTriangle,
  TRIANGLE_VERTICES,
  toGlobalSvgX,
  toGlobalSvgY,
  toZoomSvgX,
  toZoomSvgY,
  ZOOM_PANEL_VIEW,
} from './block-coverage-model';

const MAX_BOX_INTERSECTIONS = 6;

const globalTrianglePoints = TRIANGLE_VERTICES.map(
  (v) => `${fmt(toGlobalSvgX(v.x))},${fmt(toGlobalSvgY(v.y))}`,
).join(' ');

function GlobalBlocksPanel() {
  const active = getBlockInfo(DEFAULT_BLOCK.bx, DEFAULT_BLOCK.by);
  const gridLeft = GLOBAL_PANEL_VIEW.originX;
  const gridTop = toGlobalSvgY(GRID_SIZE);
  const gridSpan = GRID_SIZE * GLOBAL_PANEL_VIEW.cell;
  const blockSpan = BLOCK_SIZE * GLOBAL_PANEL_VIEW.cell;
  const sampleSpan = (BLOCK_SIZE - 1) * GLOBAL_PANEL_VIEW.cell;
  const [vA, vB, vC] = TRIANGLE_VERTICES;

  return (
    <div className="cg-tri-panel">
      <svg
        viewBox={`0 0 ${GLOBAL_PANEL_VIEW.width} ${GLOBAL_PANEL_VIEW.height}`}
        role="img"
        aria-labelledby="cg-tri-global-title cg-tri-global-desc"
      >
        <title id="cg-tri-global-title">
          16 乘 16 像素网格上逆时针三角形 ABC 的 4 乘 4 区块覆盖分类（early-out、early-in 与 else）
        </title>
        <desc id="cg-tri-global-desc">
          16 乘 16 像素网格被划分为 16 个 4 乘 4 像素区块，每个像素中心为半整数采样点。逆时针三角形
          ABC 覆盖网格中下部：左上区块 (0, 3) 标为 early out；内部区块 (2, 1) 标为 early
          in；顶部区块 (2, 3) 跨过顶点 C 与两侧边，其紧贴采样中心的包围盒标为 else。
        </desc>

        <text className="cg-tri-panel-title" x="14" y="21">
          全局 16 × 16 网格：4 × 4 区块粗筛
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
            data-role="early-out"
          />
          <text x="15" y="1">
            early-out
          </text>

          <rect
            x="80"
            y="-8"
            width="11"
            height="11"
            rx="2"
            className="cg-tri-swatch"
            data-role="early-in"
          />
          <text x="95" y="1">
            early-in
          </text>

          <rect
            x="154"
            y="-8"
            width="11"
            height="11"
            rx="2"
            className="cg-tri-swatch"
            data-role="else"
          />
          <text x="169" y="1">
            else
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

        {/* Continuous triangle interior */}
        <polygon points={globalTrianglePoints} className="cg-tri-shape-fill" />

        {/* Emphasized Slide-44 canonical blocks and their [x_l, x_r] x [y_l, y_r] sample boxes */}
        {ALL_BLOCKS.map((block) => {
          const bxSvg = toGlobalSvgX(block.x0);
          const bySvg = toGlobalSvgY(block.y0 + BLOCK_SIZE);
          const isCanonical = block.canonicalLabel !== undefined;
          return (
            <g key={`bg-${block.key}`}>
              <rect
                x={bxSvg}
                y={bySvg}
                width={blockSpan}
                height={blockSpan}
                className={isCanonical ? 'cg-tri-canonical-fill' : 'cg-tri-block-tint'}
                data-role={block.classification}
              />
              {isCanonical && (
                <rect
                  x={toGlobalSvgX(block.sampleBox.xMin)}
                  y={toGlobalSvgY(block.sampleBox.yMax)}
                  width={sampleSpan}
                  height={sampleSpan}
                  className="cg-tri-canonical-sbox"
                  data-role={block.classification}
                />
              )}
            </g>
          );
        })}

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

        {/* Continuous triangle outline and CCW vertices A, B, C */}
        <polygon points={globalTrianglePoints} className="cg-tri-shape-stroke" />
        <circle
          cx={fmt(toGlobalSvgX(vA.x))}
          cy={fmt(toGlobalSvgY(vA.y))}
          r="2.8"
          className="cg-tri-vertex-dot"
        />
        <circle
          cx={fmt(toGlobalSvgX(vB.x))}
          cy={fmt(toGlobalSvgY(vB.y))}
          r="2.8"
          className="cg-tri-vertex-dot"
        />
        <circle
          cx={fmt(toGlobalSvgX(vC.x))}
          cy={fmt(toGlobalSvgY(vC.y))}
          r="2.8"
          className="cg-tri-vertex-dot"
        />

        {/* All 256 half-integer pixel sample centers */}
        <g className="cg-tri-samples">
          {Array.from({ length: GRID_SIZE }, (_, row) =>
            Array.from({ length: GRID_SIZE }, (_, col) => {
              const inside = pointInTriangle({ x: col + 0.5, y: row + 0.5 });
              const inCanonical = CANONICAL_BLOCKS.some(
                (item) =>
                  col >= item.bx * BLOCK_SIZE &&
                  col < (item.bx + 1) * BLOCK_SIZE &&
                  row >= item.by * BLOCK_SIZE &&
                  row < (item.by + 1) * BLOCK_SIZE,
              );
              return (
                <circle
                  key={`pt-${col}-${row}`}
                  cx={fmt(toGlobalSvgX(col + 0.5))}
                  cy={fmt(toGlobalSvgY(row + 0.5))}
                  r={inCanonical ? '2.05' : inside ? '1.65' : '1.3'}
                  className="cg-tri-sample-dot"
                  data-inside={inside ? 'true' : 'false'}
                  data-canonical={inCanonical ? 'true' : 'false'}
                />
              );
            }),
          )}
        </g>

        {/* Outer 16x16 grid border */}
        <rect
          x={gridLeft}
          y={gridTop}
          width={gridSpan}
          height={gridSpan}
          className="cg-tri-outer-border"
        />

        {/* CCW triangle vertex labels A, B, C placed in clear margins */}
        <text
          x={fmt(toGlobalSvgX(vA.x) + 12)}
          y={GLOBAL_PANEL_VIEW.originY + 15}
          className="cg-tri-vertex-label"
        >
          A
        </text>
        <text
          x={gridLeft + gridSpan + 9}
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

        {/* Canonical block text labels positioned at block midpoints (clear of sample rows) */}
        {CANONICAL_BLOCKS.map((item) => {
          const info = getBlockInfo(item.bx, item.by);
          const centerX = toGlobalSvgX(info.x0 + BLOCK_SIZE / 2);
          const centerY = toGlobalSvgY(info.y0 + BLOCK_SIZE / 2);
          return (
            <text
              key={`lbl-${info.key}`}
              x={fmt(centerX)}
              y={fmt(centerY)}
              textAnchor="middle"
              dominantBaseline="central"
              className="cg-tri-canonical-label"
              data-role={info.classification}
            >
              {item.label}
            </text>
          );
        })}

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
  const sampleRight = sampleLeft + sampleSize;
  const sampleBottom = sampleTop + sampleSize;

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
        <title id="cg-tri-zoom-title">{`局部放大：区块 (${block.bx}, ${block.by}) 的采样包围盒 [x_l, x_r] × [y_l, y_r] 与 ${decision.badgeText} 判定`}</title>
        <desc id="cg-tri-zoom-desc">
          放大单个 4 乘 4 像素区块，对比外圈 4 乘 4 像素边界与内圈紧贴四角半整数采样中心的采样包围盒
          [x_l, x_r] 乘 [y_l, y_r]，标出线性边函数极值判定、边与采样框交点以及 16
          个像素中心的覆盖状态。
        </desc>
        <defs>
          <clipPath id="cg-tri-zoom-clip">
            <rect x={gridLeft} y={gridTop} width={gridSize} height={gridSize} />
          </clipPath>
        </defs>

        <text data-tri-zoom-heading="" className="cg-tri-panel-title" x="14" y="21">
          {`局部放大：区块 (${block.bx}, ${block.by}) · ${decision.badgeText}`}
        </text>

        {/* Sub-legend contrasting 4x4 pixel box vs [x_l, x_r] x [y_l, y_r] sample box */}
        <g className="cg-tri-legend" transform="translate(14 38)">
          <rect x="0" y="-8" width="11" height="11" rx="1.5" className="cg-tri-legend-pixel-box" />
          <text x="15" y="1">
            像素外框 4×4
          </text>

          <rect
            x="100"
            y="-8"
            width="11"
            height="11"
            rx="1.5"
            className="cg-tri-legend-sample-box"
          />
          <text x="115" y="1">
            采样框 [xₗ,xᵣ]×[yₗ,yᵣ]
          </text>

          <g transform="translate(242 -2.5)">
            <polygon points="0,-4.5 4.5,0 0,4.5 -4.5,0" className="cg-tri-hit-diamond" />
          </g>
          <text x="251" y="1">
            边框交点
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

        {/* Outer 4x4 pixel block boundary */}
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

        {/* Pre-allocated intersection diamonds where triangle edges cross [x_l, x_r] x [y_l, y_r] */}
        <g data-tri-zhits="">
          {Array.from({ length: MAX_BOX_INTERSECTIONS }, (_, idx) => {
            const hit = block.sampleBoxIntersections[idx];
            const hx = hit ? toZoomSvgX(hit.x, block.x0) : 0;
            const hy = hit ? toZoomSvgY(hit.y, block.y0) : 0;
            return (
              <g
                key={`zhit-${idx}`}
                data-tri-zhit={idx}
                transform={`translate(${fmt(hx)} ${fmt(hy)})`}
                visibility={hit ? 'visible' : 'hidden'}
              >
                <polygon points="0,-5 5,0 0,5 -5,0" className="cg-tri-hit-diamond" />
              </g>
            );
          })}
        </g>

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
                <circle cx={cx} cy={cy} r="6.8" className="cg-tri-zcorner-ring" />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={sample.isCorner ? '3.7' : '3.1'}
                className="cg-tri-zsample-dot"
              />
            </g>
          );
        })}

        {/* Right-side callouts comparing outer pixel border vs [y_l, y_r] */}
        <line
          x1={gridLeft + gridSize}
          y1={gridTop}
          x2={gridLeft + gridSize + 7}
          y2={gridTop}
          className="cg-tri-callout-line"
        />
        <text x={gridLeft + gridSize + 10} y={gridTop + 4} className="cg-tri-callout-muted">
          像素外框
        </text>

        <line
          x1={sampleRight}
          y1={sampleTop}
          x2={gridLeft + gridSize + 7}
          y2={sampleTop}
          className="cg-tri-callout-line is-sample"
        />
        <text
          data-tri-zy-max=""
          x={gridLeft + gridSize + 10}
          y={sampleTop + 4}
          className="cg-tri-callout-sample"
        >
          {`yᵣ = ${fmt(block.sampleBox.yMax)}`}
        </text>

        <line
          x1={sampleRight}
          y1={sampleBottom}
          x2={gridLeft + gridSize + 7}
          y2={sampleBottom}
          className="cg-tri-callout-line is-sample"
        />
        <text
          data-tri-zy-min=""
          x={gridLeft + gridSize + 10}
          y={sampleBottom + 4}
          className="cg-tri-callout-sample"
        >
          {`yₗ = ${fmt(block.sampleBox.yMin)}`}
        </text>

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
        <text x="16" y={gridTop + 4} className="cg-tri-axis-var">
          y
        </text>

        {/* Bottom integer x-axis ticks and [x_l, x_r] labels */}
        {Array.from({ length: BLOCK_SIZE + 1 }, (_, i) => (
          <text
            key={`zx-${i}`}
            data-tri-zx-tick={i}
            x={gridLeft + i * ZOOM_PANEL_VIEW.cell}
            y={ZOOM_PANEL_VIEW.originY + 15}
            textAnchor="middle"
            className="cg-tri-tick"
          >
            {block.x0 + i}
          </text>
        ))}
        <text
          x={gridLeft + gridSize + 11}
          y={ZOOM_PANEL_VIEW.originY + 4}
          className="cg-tri-axis-var"
        >
          x
        </text>

        <text
          data-tri-zx-min=""
          x={sampleLeft}
          y={ZOOM_PANEL_VIEW.originY + 31}
          textAnchor="middle"
          className="cg-tri-callout-sample"
        >
          {`xₗ = ${fmt(block.sampleBox.xMin)}`}
        </text>
        <text
          data-tri-zx-max=""
          x={sampleRight}
          y={ZOOM_PANEL_VIEW.originY + 31}
          textAnchor="middle"
          className="cg-tri-callout-sample"
        >
          {`xᵣ = ${fmt(block.sampleBox.xMax)}`}
        </text>

        {/* 3-line O(1) linear edge-function decision card */}
        <g transform="translate(14 313)">
          <rect
            data-tri-card-bg=""
            data-role={block.classification}
            x="0"
            y="0"
            width="308"
            height="73"
            rx="8"
            className="cg-tri-card"
          />
          <text data-tri-step1="" x="12" y="21" className="cg-tri-card-step">
            {decision.step1}
          </text>
          <text data-tri-step2="" x="12" y="41" className="cg-tri-card-step">
            {decision.step2}
          </text>
          <text
            data-tri-verdict=""
            data-role={block.classification}
            x="12"
            y="61"
            className="cg-tri-card-verdict"
          >
            {decision.verdict}
          </text>
        </g>
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
        将像素网格划分为 4 × 4 区块时，每个区块用紧贴其最外圈像素中心的采样包围盒{' '}
        <span className="math-inline">{String.raw`\([x_l, x_r] \times [y_l, y_r] = [x_0 + \frac{1}{2},\, x_0 + \frac{7}{2}] \times [y_0 + \frac{1}{2},\, y_0 + \frac{7}{2}]\)`}</span>{' '}
        表示（而非整格像素外框）。由于{' '}
        <span className="math-inline">{String.raw`\(E_{AB}, E_{BC}, E_{CA}\)`}</span>{' '}
        是线性函数，它们在矩形上的极值必在角点取到，从而可{' '}
        <span className="math-inline">{String.raw`\(\mathcal{O}(1)\)`}</span>{' '}
        判别：三边在框上最小值均 <span className="math-inline">{String.raw`\(\ge 0\)`}</span>
        （四角采样点全在内）为 <strong>early-in</strong>；某条边在框上最大值{' '}
        <span className="math-inline">{String.raw`\(< 0\)`}</span>（整块位于该有向边外侧）为{' '}
        <strong>early-out</strong>；其余跨越边界的区块为 <strong>else</strong>
        ，再退回逐像素或更细子块测试。
        <span data-agent-omit="">点击左图任意 4 × 4 区块或上方按钮可查看对应极值与覆盖结果。</span>
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { BlockCoverageFigure };
