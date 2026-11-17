import { initialLine } from './bresenham-model';

function BresenhamFigure() {
  return (
    <figure className="bres-figure" data-bresenham="" data-post-enhancement="bresenham">
      <svg viewBox="0 0 480 255" role="img" aria-label="Bresenham 将理想直线近似为一串像素">
        <title>Bresenham 直线光栅化</title>
        <desc>从像素中心 (2, 3) 到 (13, 8)，虚线为理想直线，填色方格为 Bresenham 选择的像素。</desc>
        {Array.from({ length: 84 }, (_, i) => {
          const x = (i % 14) + 1;
          const y = Math.floor(i / 14) + 3;
          return (
            <rect
              key={i}
              data-cell={`${x},${y}`}
              x={16 + (x - 1) * 32}
              y={24 + (8 - y) * 32}
              width="32"
              height="32"
              className={
                initialLine.points.some((p) => p.x === x && p.y === y)
                  ? 'bres-cell bres-selected'
                  : 'bres-cell'
              }
            />
          );
        })}
        <line className="bres-ideal" x1="64" y1="200" x2="416" y2="40" />
        <text x="64" y="238" textAnchor="middle">
          (2, 3)
        </text>
        <text x="416" y="16" textAnchor="middle">
          (13, 8)
        </text>
      </svg>
      <div className="bres-controls" data-agent-omit="" hidden>
        <button type="button" data-next="">
          下一步
        </button>
        <button type="button" data-reset="">
          重置
        </button>
        <span role="status" data-status="" />
      </div>
      <figcaption>
        虚线是理想直线，填色方格是 Bresenham
        选出的像素。图中以整数标记像素中心；每向右一格，选择同一行或上一行的像素。
      </figcaption>
    </figure>
  );
}
export const POST_COMPONENTS = { BresenhamFigure };
