import {
  type Circle,
  circleIntersections,
  fmt,
  mathAngleArcPath,
  type Point,
  svgArcPath,
} from './geometry';

export function PointDot({
  p,
  variant = 'primary',
}: {
  p: Point;
  variant?: 'primary' | 'secondary' | 'accent';
}) {
  return <circle cx={fmt(p.x)} cy={fmt(p.y)} r="3.6" className={`haoi-disks-dot-${variant}`} />;
}

export function PointLabel({
  p,
  label,
  dx = 0,
  dy = 0,
  anchor = 'middle',
}: {
  p: Point;
  label: string;
  dx?: number;
  dy?: number;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <text
      x={fmt(p.x + dx)}
      y={fmt(p.y + dy)}
      textAnchor={anchor}
      dominantBaseline="central"
      className="haoi-disks-label"
    >
      {label}
    </text>
  );
}

export function TwoDisksBase({ showCosineTriangle }: { showCosineTriangle: boolean }) {
  const toSvg = (p: Point): Point => ({ x: 185 + p.x, y: 135 - p.y });
  const cA: Circle = { center: { x: 0, y: 0 }, r: 92 };
  const cB: Circle = { center: { x: 126, y: 0 }, r: 84 };
  const [mC, mD] = circleIntersections(cA, cB);

  const sA = toSvg(cA.center);
  const sB = toSvg(cB.center);
  const sC = toSvg(mC);
  const sD = toSvg(mD);

  const angleAC = Math.atan2(mC.y - cA.center.y, mC.x - cA.center.x);
  const angleAD = Math.atan2(mD.y - cA.center.y, mD.x - cA.center.x);
  const angleAB = Math.atan2(cB.center.y - cA.center.y, cB.center.x - cA.center.x);

  const coveredArc = svgArcPath(sD, sC, cA.r, 0, 0);

  return (
    <svg
      viewBox="0 0 480 270"
      role="img"
      aria-label={
        showCosineTriangle
          ? '圆 B 覆盖圆 A，连接圆心 A、B 与两圆交点 C、D 构成全等三角形 ABC 与 ABD，用于余弦定理求圆心角'
          : '圆 B 覆盖圆 A，两圆交于点 C 和 D，连接圆心 A 与交点 C、D'
      }
    >
      <title>{showCosineTriangle ? '余弦定理求覆盖圆心角' : '两圆相交的简化模型'}</title>
      <desc>
        {showCosineTriangle
          ? '圆 A 与圆 B 相交于 C、D 两点，连结 AC、AD、BC、BD、AB 后得到三角形 ABC 与三角形 ABD，可在三角形 ABC 中用余弦定理求出角 CAB。'
          : '圆 B 覆盖在圆 A 上，两圆相交于 C、D，圆 A 上位于圆 B 内部的圆弧 CD 被覆盖。'}
      </desc>

      <circle cx={fmt(sA.x)} cy={fmt(sA.y)} r={cA.r} className="haoi-disks-circle-base" />
      <circle cx={fmt(sB.x)} cy={fmt(sB.y)} r={cB.r} className="haoi-disks-circle-cover" />

      {showCosineTriangle && (
        <polygon
          points={`${fmt(sA.x)},${fmt(sA.y)} ${fmt(sB.x)},${fmt(sB.y)} ${fmt(sC.x)},${fmt(sC.y)}`}
          className="haoi-disks-triangle-fill"
        />
      )}

      <path d={coveredArc} className="haoi-disks-arc-covered" />

      <circle cx={fmt(sA.x)} cy={fmt(sA.y)} r={cA.r} className="haoi-disks-circle-stroke" />
      <circle cx={fmt(sB.x)} cy={fmt(sB.y)} r={cB.r} className="haoi-disks-circle-stroke" />

      <path
        d={mathAngleArcPath(
          cA.center,
          showCosineTriangle ? 24 : 22,
          showCosineTriangle ? angleAB : angleAD,
          angleAC,
          toSvg,
        )}
        className="haoi-disks-angle-arc"
      />

      <line
        x1={fmt(sA.x)}
        y1={fmt(sA.y)}
        x2={fmt(sC.x)}
        y2={fmt(sC.y)}
        className="haoi-disks-segment"
      />
      <line
        x1={fmt(sA.x)}
        y1={fmt(sA.y)}
        x2={fmt(sD.x)}
        y2={fmt(sD.y)}
        className="haoi-disks-segment"
      />
      {showCosineTriangle && (
        <>
          <line
            x1={fmt(sB.x)}
            y1={fmt(sB.y)}
            x2={fmt(sC.x)}
            y2={fmt(sC.y)}
            className="haoi-disks-segment"
          />
          <line
            x1={fmt(sB.x)}
            y1={fmt(sB.y)}
            x2={fmt(sD.x)}
            y2={fmt(sD.y)}
            className="haoi-disks-segment"
          />
          <line
            x1={fmt(sA.x)}
            y1={fmt(sA.y)}
            x2={fmt(sB.x)}
            y2={fmt(sB.y)}
            className="haoi-disks-segment-aux"
          />
        </>
      )}

      <PointDot p={sA} variant="primary" />
      <PointDot p={sB} variant="primary" />
      <PointDot p={sC} variant="accent" />
      <PointDot p={sD} variant="accent" />

      <PointLabel p={sA} label="A" dx={-12} dy={0} anchor="end" />
      <PointLabel p={sB} label="B" dx={12} dy={0} anchor="start" />
      <PointLabel p={sC} label="C" dx={2} dy={-14} anchor="middle" />
      <PointLabel p={sD} label="D" dx={2} dy={15} anchor="middle" />
    </svg>
  );
}
