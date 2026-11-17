import {
  BRESENHAM_STEPS,
  computeZoomGeometry,
  DEFAULT_STEP,
  END_POINT,
  fmt,
  GLOBAL_VIEW,
  GRID_COLS,
  GRID_ROWS,
  getGlobalCellRole,
  START_POINT,
  toGlobalX,
  toGlobalY,
  ZOOM_VIEW,
} from './bresenham-model';

const STEP_INPUT_ID = 'cg-bres-step-input';
const GLOBAL_X_TICKS = [0, 2, 4, 6, 8, 10] as const;
const GLOBAL_Y_TICKS = [0, 2, 4, 6] as const;

function GlobalGridPanel() {
  const zoom = computeZoomGeometry(DEFAULT_STEP);
  const { step, winX0, winY0 } = zoom;
  const scanX = toGlobalX(step.sampleX);
  const hitY = toGlobalY(step.exactY);
  const winSvgX = toGlobalX(winX0);
  const winSvgY = toGlobalY(winY0 + 2);
  const winSize = GLOBAL_VIEW.cell * 2;

  return (
    <div className="cg-bres-panel">
      <svg
        viewBox={`0 0 ${GLOBAL_VIEW.width} ${GLOBAL_VIEW.height}`}
        role="img"
        aria-labelledby="cg-bres-global-title cg-bres-global-desc"
      >
        <title id="cg-bres-global-title">全局像素网格：沿列中心从左向右逐列扫描直线</title>
        <desc id="cg-bres-global-desc">
          11 乘 6 像素网格，理想直线从 (0.5, 0.5) 连到 (10.5, 4.5)，斜率为
          0.4；绿色方格为已选出的像素，蓝色虚线框标出右侧放大的 2 乘 2 局部窗口。
        </desc>

        <text className="cg-bres-panel-title" x="14" y="21">
          全局扫描
        </text>

        {/* Compact legend in top-right */}
        <g className="cg-bres-legend" transform="translate(216 17)">
          <line x1="0" y1="0" x2="16" y2="0" className="cg-bres-ideal" />
          <text x="20" y="3.5">
            理想直线
          </text>
          <rect
            x="78"
            y="-5.5"
            width="11"
            height="11"
            rx="2"
            className="cg-bres-cell"
            data-role="scanned"
          />
          <text x="93" y="3.5">
            选中像素
          </text>
        </g>

        {/* Pixel grid cells and center dots */}
        {Array.from({ length: GRID_ROWS }, (_, row) =>
          Array.from({ length: GRID_COLS }, (_, col) => {
            const role = getGlobalCellRole(col, row, DEFAULT_STEP);
            const cx = toGlobalX(col + 0.5);
            const cy = toGlobalY(row + 0.5);
            return (
              <g
                key={`${col},${row}`}
                data-bres-cell={`${col},${row}`}
                data-role={role}
                className="cg-bres-cell-group"
              >
                <rect
                  x={toGlobalX(col)}
                  y={toGlobalY(row + 1)}
                  width={GLOBAL_VIEW.cell}
                  height={GLOBAL_VIEW.cell}
                  className="cg-bres-cell"
                  data-role={role}
                />
                <circle cx={cx} cy={cy} r="1.9" className="cg-bres-dot" />
              </g>
            );
          }),
        )}

        {/* Sparse integer coordinate ticks */}
        {GLOBAL_X_TICKS.map((gx) => (
          <text
            key={`gx-${gx}`}
            className="cg-bres-tick"
            x={toGlobalX(gx)}
            y={GLOBAL_VIEW.originY + 14}
            textAnchor="middle"
          >
            {gx}
          </text>
        ))}
        {GLOBAL_Y_TICKS.map((gy) => (
          <text
            key={`gy-${gy}`}
            className="cg-bres-tick"
            x={GLOBAL_VIEW.originX - 8}
            y={toGlobalY(gy) + 4}
            textAnchor="end"
          >
            {gy}
          </text>
        ))}
        <text
          className="cg-bres-axis-var"
          x={toGlobalX(GRID_COLS) + 10}
          y={GLOBAL_VIEW.originY + 4}
        >
          x
        </text>
        <text
          className="cg-bres-axis-var"
          x={GLOBAL_VIEW.originX - 18}
          y={toGlobalY(GRID_ROWS) + 4}
          textAnchor="end"
        >
          y
        </text>

        {/* 2x2 zoom window frame linking to the right panel */}
        <rect
          data-bres-window=""
          x={winSvgX}
          y={winSvgY}
          width={winSize}
          height={winSize}
          rx="3"
          className="cg-bres-window"
        />

        {/* Active vertical scan line x = x_i + 0.5 */}
        <line
          data-bres-scan=""
          x1={scanX}
          y1={toGlobalY(GRID_ROWS) - 4}
          x2={scanX}
          y2={GLOBAL_VIEW.originY + 6}
          className="cg-bres-scan"
        />
        <text
          data-bres-scan-text=""
          x={scanX}
          y={GLOBAL_VIEW.originY + 28}
          textAnchor="middle"
          className="cg-bres-scan-label"
        >
          {`x = ${fmt(step.sampleX)}`}
        </text>

        {/* Ideal continuous line and endpoints */}
        <line
          className="cg-bres-ideal"
          x1={toGlobalX(START_POINT.x)}
          y1={toGlobalY(START_POINT.y)}
          x2={toGlobalX(END_POINT.x)}
          y2={toGlobalY(END_POINT.y)}
        />
        <circle
          className="cg-bres-endpoint"
          cx={toGlobalX(START_POINT.x)}
          cy={toGlobalY(START_POINT.y)}
          r="2.8"
        />
        <circle
          className="cg-bres-endpoint"
          cx={toGlobalX(END_POINT.x)}
          cy={toGlobalY(END_POINT.y)}
          r="2.8"
        />

        {/* Exact line intersection on active scan column */}
        <circle data-bres-hit="" cx={scanX} cy={hitY} r="3.6" className="cg-bres-hit" />

        {/* Interactive column hit strips (active after client enhancement) */}
        <g className="cg-bres-hit-layer">
          {BRESENHAM_STEPS.map((colStep) => (
            <rect
              key={`hit-${colStep.x}`}
              data-bres-col={colStep.x}
              x={toGlobalX(colStep.x)}
              y={toGlobalY(GRID_ROWS)}
              width={GLOBAL_VIEW.cell}
              height={GRID_ROWS * GLOBAL_VIEW.cell}
              className="cg-bres-col-hit"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function ZoomDecisionPanel() {
  const zoom = computeZoomGeometry(DEFAULT_STEP);
  const { step, winX0, winY0 } = zoom;
  const gridLeft = ZOOM_VIEW.originX;
  const gridTop = ZOOM_VIEW.originY - ZOOM_VIEW.cell * 2;
  const gridSize = ZOOM_VIEW.cell * 2;
  const col0CenterX = gridLeft + ZOOM_VIEW.cell * 0.5;
  const col1CenterX = gridLeft + ZOOM_VIEW.cell * 1.5;

  return (
    <div className="cg-bres-panel">
      <svg
        viewBox={`0 0 ${ZOOM_VIEW.width} ${ZOOM_VIEW.height}`}
        role="img"
        aria-labelledby="cg-bres-zoom-title cg-bres-zoom-desc"
      >
        <title id="cg-bres-zoom-title">{`局部放大：在 x = ${fmt(step.sampleX)} 处比较上下两个候选像素`}</title>
        <desc id="cg-bres-zoom-desc">
          放大相邻两列、上下两行的 2 乘 2
          像素窗口。水平红色虚线为上下两候选像素的整数分界线，理想直线高度越过该分界时取整上移一行，否则保持同行。
        </desc>
        <defs>
          <clipPath id="cg-bres-zoom-clip">
            <rect x={gridLeft} y={gridTop} width={gridSize} height={gridSize} />
          </clipPath>
          <marker
            id="cg-bres-snap-arrow"
            viewBox="0 0 8 8"
            refX="6.5"
            refY="4"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto"
          >
            <path d="M0 1L7.5 4L0 7Z" className="cg-bres-snap-head" />
          </marker>
        </defs>

        <text data-bres-zoom-heading="" className="cg-bres-panel-title" x="14" y="21">
          {`局部放大 · x = ${fmt(step.sampleX)}`}
        </text>

        {/* 2x2 magnified cells */}
        {[0, 1].map((colOffset) =>
          [0, 1].map((rowOffset) => {
            const role = zoom.cellRoles[colOffset][rowOffset];
            const cellX = gridLeft + colOffset * ZOOM_VIEW.cell;
            const cellY = ZOOM_VIEW.originY - (rowOffset + 1) * ZOOM_VIEW.cell;
            const cx = cellX + ZOOM_VIEW.cell * 0.5;
            const cy = cellY + ZOOM_VIEW.cell * 0.5;
            return (
              <g
                key={`z-${colOffset}-${rowOffset}`}
                data-bres-zcell={`${colOffset},${rowOffset}`}
                data-role={role}
                className="cg-bres-cell-group"
              >
                <rect
                  x={cellX}
                  y={cellY}
                  width={ZOOM_VIEW.cell}
                  height={ZOOM_VIEW.cell}
                  className="cg-bres-cell"
                  data-role={role}
                />
                <circle cx={cx} cy={cy} r="3" className="cg-bres-dot" />
              </g>
            );
          }),
        )}

        {/* Horizontal decision threshold line y = winY0 + 1 */}
        <line
          x1={gridLeft}
          y1={zoom.boundarySvgY}
          x2={gridLeft + gridSize + 6}
          y2={zoom.boundarySvgY}
          className="cg-bres-boundary"
        />

        {/* Active scan line x = x_i + 0.5 */}
        <line
          data-bres-zscan=""
          x1={zoom.activeCenterX}
          y1={gridTop - 4}
          x2={zoom.activeCenterX}
          y2={ZOOM_VIEW.originY + 6}
          className="cg-bres-scan"
        />

        {/* Clipped ideal line segment */}
        <line
          data-bres-zline=""
          clipPath="url(#cg-bres-zoom-clip)"
          x1={zoom.idealLine.x1}
          y1={zoom.idealLine.y1}
          x2={zoom.idealLine.x2}
          y2={zoom.idealLine.y2}
          className="cg-bres-ideal"
        />

        {/* Snap connector from exactY to chosen pixel center */}
        <line
          data-bres-zsnap=""
          visibility={Math.abs(zoom.exactSvgY - zoom.chosenCenterSvgY) < 4 ? 'hidden' : 'visible'}
          x1={zoom.activeCenterX}
          y1={zoom.exactSvgY}
          x2={zoom.activeCenterX}
          y2={zoom.chosenCenterSvgY + (zoom.chosenCenterSvgY > zoom.exactSvgY ? -5 : 5)}
          markerEnd="url(#cg-bres-snap-arrow)"
          className="cg-bres-snap"
        />

        {/* Chosen center highlight ring */}
        <circle
          data-bres-zchosen=""
          cx={zoom.activeCenterX}
          cy={zoom.chosenCenterSvgY}
          r="5.5"
          className="cg-bres-chosen-ring"
        />

        {/* Continuous intersection point on scan line */}
        <circle
          data-bres-zhit=""
          cx={zoom.activeCenterX}
          cy={zoom.exactSvgY}
          r="4"
          className="cg-bres-hit"
        />
        <text
          data-bres-zexact=""
          x={zoom.exactLabelX}
          y={zoom.exactLabelY}
          textAnchor={zoom.exactLabelAnchor}
          className="cg-bres-exact-label"
        >
          {`y = ${fmt(step.exactY)}`}
        </text>

        {/* Left integer y-axis ticks */}
        <text
          data-bres-zy-top=""
          x={gridLeft - 8}
          y={gridTop + 4}
          textAnchor="end"
          className="cg-bres-tick"
        >
          {winY0 + 2}
        </text>
        <text
          data-bres-zy-mid=""
          x={gridLeft - 8}
          y={zoom.boundarySvgY + 4}
          textAnchor="end"
          className="cg-bres-tick cg-bres-tick-boundary"
        >
          {winY0 + 1}
        </text>
        <text
          data-bres-zy-bot=""
          x={gridLeft - 8}
          y={ZOOM_VIEW.originY + 4}
          textAnchor="end"
          className="cg-bres-tick"
        >
          {winY0}
        </text>
        <text x="16" y={gridTop + 4} className="cg-bres-axis-var">
          y
        </text>

        {/* Single clean bottom row of half-integer column centers */}
        <text
          data-bres-zc0=""
          x={col0CenterX}
          y={ZOOM_VIEW.originY + 20}
          textAnchor="middle"
          className={
            zoom.activeColIndex === 0 ? 'cg-bres-center-tick is-active' : 'cg-bres-center-tick'
          }
        >
          {zoom.activeColIndex === 0 ? `x = ${fmt(winX0 + 0.5)}` : fmt(winX0 + 0.5)}
        </text>
        <text
          data-bres-zc1=""
          x={col1CenterX}
          y={ZOOM_VIEW.originY + 20}
          textAnchor="middle"
          className={
            zoom.activeColIndex === 1 ? 'cg-bres-center-tick is-active' : 'cg-bres-center-tick'
          }
        >
          {zoom.activeColIndex === 1 ? `x = ${fmt(winX0 + 1.5)}` : fmt(winX0 + 1.5)}
        </text>

        {/* Concise single-line right-side callouts */}
        <text
          data-bres-upper-status=""
          x={gridLeft + gridSize + 10}
          y={zoom.upperCenterY + 4}
          className={step.steppedUp ? 'cg-bres-callout-sub is-selected' : 'cg-bres-callout-sub'}
        >
          {zoom.upperStatus}
        </text>

        <text
          data-bres-boundary-title=""
          x={gridLeft + gridSize + 10}
          y={zoom.boundarySvgY + 4}
          className="cg-bres-callout-boundary"
        >
          {`分界 y = ${winY0 + 1}`}
        </text>

        <text
          data-bres-lower-status=""
          x={gridLeft + gridSize + 10}
          y={zoom.lowerCenterY + 4}
          className={!step.steppedUp ? 'cg-bres-callout-sub is-selected' : 'cg-bres-callout-sub'}
        >
          {zoom.lowerStatus}
        </text>
      </svg>
    </div>
  );
}

function BresenhamFigure() {
  const initialZoom = computeZoomGeometry(DEFAULT_STEP);
  const { step } = initialZoom;

  return (
    <figure className="cg-bres" data-bresenham="" data-post-enhancement="bresenham">
      <div className="cg-bres-heading">
        <strong>Bresenham 直线光栅化</strong>
        <span>(0.5, 0.5) → (10.5, 4.5) · 斜率 m = 0.4</span>
      </div>

      <div className="cg-bres-panels">
        <GlobalGridPanel />
        <ZoomDecisionPanel />
      </div>

      <div className="cg-bres-readout" aria-live="polite">
        <span data-bres-formula-x="">{`采样 x = ${fmt(step.sampleX)}`}</span>
        <span data-bres-formula-y="">{`高度 y = ${fmt(step.exactY)}`}</span>
        <strong data-bres-formula-decision="">{initialZoom.decisionSummary}</strong>
      </div>

      <div className="cg-bres-controls" data-agent-omit="" hidden>
        <button type="button" data-bres-play="" aria-pressed="false">
          播放
        </button>
        <button type="button" data-bres-prev="">
          上一步
        </button>
        <button type="button" data-bres-next="">
          下一步
        </button>
        <label htmlFor={STEP_INPUT_ID}>扫描列</label>
        <input
          id={STEP_INPUT_ID}
          data-bres-slider=""
          type="range"
          min="0"
          max={GRID_COLS - 1}
          step="1"
          defaultValue={DEFAULT_STEP}
          aria-valuetext={`第 ${DEFAULT_STEP + 1} 列（共 ${GRID_COLS} 列）：x = ${fmt(step.sampleX)}，选像素 (${step.x}, ${step.y})`}
        />
        <output htmlFor={STEP_INPUT_ID} data-bres-output="">
          {`第 ${step.x + 1} / ${GRID_COLS} 列 · (${step.x}, ${step.y})`}
        </output>
      </div>

      <figcaption>
        左图沿列中心 <span className="math-inline">{String.raw`\(x_i + \frac{1}{2}\)`}</span>{' '}
        逐列扫描；右图放大当前 2 × 2 窗口，只需判断交点高度{' '}
        <span className="math-inline">{String.raw`\(y\)`}</span> 是否越过上下两候选像素的整数分界线{' '}
        <span className="math-inline">{String.raw`\(y_{i-1} + 1\)`}</span> 即可决定是否上移一行。
        <span data-agent-omit="">点击左图任意列或拖动滑块可逐步查看。</span>
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { BresenhamFigure };
