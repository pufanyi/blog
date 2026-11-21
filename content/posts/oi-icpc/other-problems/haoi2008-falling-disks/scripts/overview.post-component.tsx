import { TwoDisksBase } from './primitives';

function ProblemStatementFigure() {
  const disks: { cx: number; cy: number; r: number }[] = [
    { cx: 195, cy: 120, r: 72 },
    { cx: 350, cy: 130, r: 86 },
    { cx: 245, cy: 232, r: 44 },
    { cx: 365, cy: 235, r: 36 },
    { cx: 165, cy: 192, r: 62 },
    { cx: 242, cy: 78, r: 52 },
    { cx: 392, cy: 190, r: 66 },
    { cx: 235, cy: 152, r: 16 },
    { cx: 378, cy: 204, r: 14 },
    { cx: 65, cy: 150, r: 24 },
  ];

  return (
    <figure className="haoi-disks-figure">
      <div className="haoi-disks-canvas">
        <svg
          viewBox="0 0 500 300"
          role="img"
          aria-label="多个圆盘依次从天而降，后落下的圆盘覆盖先落下的圆盘，所有未被覆盖的红色圆弧总长度即为最终封闭区域的周长"
        >
          <title>下落的圆盘问题示意图</title>
          <desc>
            十个不同半径的圆盘依次重叠排列，后落下的圆盘完全遮挡其内部区域，最终所有可见边界以红色线条标出，包括孤立圆盘和落在大圆盘内部的小圆盘。
          </desc>
          {disks.map((d, idx) => (
            <circle
              key={`disk-${idx}`}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              className="haoi-disks-problem-disk"
            />
          ))}
        </svg>
      </div>
      <figcaption>圆盘依次下落后，红色线条表示未被覆盖的圆周，其总长度即为所求。</figcaption>
    </figure>
  );
}

function TwoDisksFigure() {
  return (
    <figure className="haoi-disks-figure">
      <div className="haoi-disks-canvas">
        <TwoDisksBase showCosineTriangle={false} />
      </div>
      <figcaption>圆 B 覆盖圆 A，两个圆交于 C、D（虚线标出圆 A 被覆盖的圆弧）。</figcaption>
    </figure>
  );
}

function CosineRuleFigure() {
  return (
    <figure className="haoi-disks-figure">
      <div className="haoi-disks-canvas">
        <TwoDisksBase showCosineTriangle />
      </div>
      <figcaption>连接圆心和交点，用三角形 ABC 的余弦定理求覆盖圆弧的圆心角。</figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = {
  ProblemStatementFigure,
  TwoDisksFigure,
  CosineRuleFigure,
};
