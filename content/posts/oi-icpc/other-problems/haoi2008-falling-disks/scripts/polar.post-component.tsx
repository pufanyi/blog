import {
  type Circle,
  circleIntersections,
  fmt,
  mathAngleArcPath,
  type Point,
  svgArcPath,
} from './geometry';
import { PointDot, PointLabel } from './primitives';

function OverlappingArcsFigure() {
  const toSvg = (p: Point): Point => ({ x: 240 + p.x, y: 152 - p.y });
  const cA: Circle = { center: { x: -65, y: 45 }, r: 88 };
  const cB: Circle = { center: { x: 65, y: 25 }, r: 85 };
  const cC: Circle = { center: { x: -10, y: -58 }, r: 78 };

  const [mABTop, mF] = circleIntersections(cA, cB);
  const [mE, mACBot] = circleIntersections(cA, cC);
  const [mBC1, mBC2] = circleIntersections(cB, cC);

  const sA = toSvg(cA.center);
  const sB = toSvg(cB.center);
  const sC = toSvg(cC.center);
  const sE = toSvg(mE);
  const sF = toSvg(mF);
  const sABTop = toSvg(mABTop);
  const sACBot = toSvg(mACBot);
  const sBC1 = toSvg(mBC1);
  const sBC2 = toSvg(mBC2);

  const overlapArc = svgArcPath(sF, sE, cA.r, 0, 0);

  return (
    <figure className="haoi-disks-figure">
      <div className="haoi-disks-canvas">
        <svg
          viewBox="0 0 480 300"
          role="img"
          aria-label="三个圆 A、B、C 相交，圆 A 上的圆弧 EF 同时位于圆 B 与圆 C 内部，被重复覆盖两次"
        >
          <title>多圆重叠时的重复覆盖圆弧</title>
          <desc>
            圆 B 与圆 C 均覆盖在圆 A 上，其中圆弧 EF 是圆 A 上同时被圆 B 和圆 C
            覆盖的公共部分，计算总覆盖长度时只能减去一次。
          </desc>

          <circle cx={fmt(sA.x)} cy={fmt(sA.y)} r={cA.r} className="haoi-disks-circle-base" />
          <circle cx={fmt(sB.x)} cy={fmt(sB.y)} r={cB.r} className="haoi-disks-circle-cover-soft" />
          <circle cx={fmt(sC.x)} cy={fmt(sC.y)} r={cC.r} className="haoi-disks-circle-cover-soft" />

          <circle cx={fmt(sA.x)} cy={fmt(sA.y)} r={cA.r} className="haoi-disks-circle-stroke" />
          <circle cx={fmt(sB.x)} cy={fmt(sB.y)} r={cB.r} className="haoi-disks-circle-stroke" />
          <circle cx={fmt(sC.x)} cy={fmt(sC.y)} r={cC.r} className="haoi-disks-circle-stroke" />

          <path d={overlapArc} className="haoi-disks-arc-overlap" />

          <PointDot p={sABTop} variant="secondary" />
          <PointDot p={sACBot} variant="secondary" />
          <PointDot p={sBC1} variant="secondary" />
          <PointDot p={sBC2} variant="secondary" />

          <PointDot p={sA} variant="primary" />
          <PointDot p={sB} variant="primary" />
          <PointDot p={sC} variant="primary" />
          <PointDot p={sE} variant="accent" />
          <PointDot p={sF} variant="accent" />

          <PointLabel p={sA} label="A" dx={-12} dy={-8} anchor="end" />
          <PointLabel p={sB} label="B" dx={12} dy={-4} anchor="start" />
          <PointLabel p={sC} label="C" dx={0} dy={15} anchor="middle" />
          <PointLabel p={sE} label="E" dx={13} dy={-2} anchor="start" />
          <PointLabel p={sF} label="F" dx={11} dy={10} anchor="start" />
        </svg>
      </div>
      <figcaption>三个圆相交，圆 A 上的红色圆弧 EF 被圆 B 和圆 C 重复覆盖。</figcaption>
    </figure>
  );
}

function PolarAnglesFigure() {
  const scale = 34;
  const toSvg = (p: Point): Point => ({
    x: 105 + p.x * scale,
    y: 300 - p.y * scale,
  });

  const cA: Circle = { center: { x: 1.0, y: 2.2 }, r: 2.8 };
  const cC: Circle = { center: { x: 4.8, y: 4.9 }, r: 3.2 };
  const [mB, mD] = circleIntersections(cA, cC);
  const mE: Point = { x: 6.2, y: 2.2 };

  const sA = toSvg(cA.center);
  const sB = toSvg(mB);
  const sC = toSvg(cC.center);
  const sD = toSvg(mD);
  const sE = toSvg(mE);

  const angleAE = 0;
  const angleAC = Math.atan2(cC.center.y - cA.center.y, cC.center.x - cA.center.x);
  const angleAB = Math.atan2(mB.y - cA.center.y, mB.x - cA.center.x);
  const angleAD = Math.atan2(mD.y - cA.center.y, mD.x - cA.center.x);

  const xAxisStart = toSvg({ x: -2.4, y: 0 });
  const xAxisEnd = toSvg({ x: 8.8, y: 0 });
  const yAxisStart = toSvg({ x: 0, y: -1.0 });
  const yAxisEnd = toSvg({ x: 0, y: 8.5 });
  const rayStart = toSvg({ x: -2.2, y: 2.2 });
  const rayEnd = toSvg({ x: 8.6, y: 2.2 });
  const originSvg = toSvg({ x: 0, y: 0 });

  const gridXs = [-2, -1, 1, 2, 3, 4, 5, 6, 7, 8];
  const gridYs = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <figure className="haoi-disks-figure">
      <div className="haoi-disks-canvas">
        <svg
          viewBox="0 0 460 340"
          role="img"
          aria-label="在平面直角坐标系中，圆 A 与圆 C 相交于 B、D，过圆心 A 作平行于 x 轴的射线 AE，通过圆心连线 AC 的极角与角 CAB 确定覆盖圆弧的极角区间"
        >
          <title>用极角表示覆盖圆弧区间</title>
          <desc>
            坐标系中圆 A 与圆 C 交于 B、D 两点，AE 平行于 x 轴。先由 AC 斜率求得极角 CAE，再结合角
            CAB 与角 CAD 即可得到角 BAE 与角 EAD，从而确定圆弧对应的极角区间。
          </desc>

          <defs>
            <marker
              id="haoi-axis-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 1 2 L 9 5 L 1 8 z" className="haoi-disks-axis-arrow" />
            </marker>
          </defs>

          {gridXs.map((gx) => {
            const p1 = toSvg({ x: gx, y: -0.9 });
            const p2 = toSvg({ x: gx, y: 8.3 });
            return (
              <line
                key={`gx-${gx}`}
                x1={fmt(p1.x)}
                y1={fmt(p1.y)}
                x2={fmt(p2.x)}
                y2={fmt(p2.y)}
                className="haoi-disks-grid"
              />
            );
          })}
          {gridYs.map((gy) => {
            const p1 = toSvg({ x: -2.3, y: gy });
            const p2 = toSvg({ x: 8.6, y: gy });
            return (
              <line
                key={`gy-${gy}`}
                x1={fmt(p1.x)}
                y1={fmt(p1.y)}
                x2={fmt(p2.x)}
                y2={fmt(p2.y)}
                className="haoi-disks-grid"
              />
            );
          })}

          <line
            x1={fmt(xAxisStart.x)}
            y1={fmt(xAxisStart.y)}
            x2={fmt(xAxisEnd.x)}
            y2={fmt(xAxisEnd.y)}
            className="haoi-disks-axis"
            markerEnd="url(#haoi-axis-arrow)"
          />
          <line
            x1={fmt(yAxisStart.x)}
            y1={fmt(yAxisStart.y)}
            x2={fmt(yAxisEnd.x)}
            y2={fmt(yAxisEnd.y)}
            className="haoi-disks-axis"
            markerEnd="url(#haoi-axis-arrow)"
          />

          <circle
            cx={fmt(sA.x)}
            cy={fmt(sA.y)}
            r={fmt(cA.r * scale)}
            className="haoi-disks-circle-base"
          />
          <circle
            cx={fmt(sC.x)}
            cy={fmt(sC.y)}
            r={fmt(cC.r * scale)}
            className="haoi-disks-circle-cover"
          />
          <circle
            cx={fmt(sA.x)}
            cy={fmt(sA.y)}
            r={fmt(cA.r * scale)}
            className="haoi-disks-circle-stroke"
          />
          <circle
            cx={fmt(sC.x)}
            cy={fmt(sC.y)}
            r={fmt(cC.r * scale)}
            className="haoi-disks-circle-stroke"
          />

          <line
            x1={fmt(rayStart.x)}
            y1={fmt(rayStart.y)}
            x2={fmt(rayEnd.x)}
            y2={fmt(rayEnd.y)}
            className="haoi-disks-horizontal-ref"
          />

          <path
            d={mathAngleArcPath(cA.center, 1.05, angleAE, angleAC, toSvg)}
            className="haoi-disks-angle-arc"
          />
          <path
            d={mathAngleArcPath(cA.center, 0.72, angleAC, angleAB, toSvg)}
            className="haoi-disks-angle-arc-alt"
          />
          <path
            d={mathAngleArcPath(cA.center, 0.72, angleAD, angleAC, toSvg)}
            className="haoi-disks-angle-arc-alt"
          />

          <line
            x1={fmt(sA.x)}
            y1={fmt(sA.y)}
            x2={fmt(sB.x)}
            y2={fmt(sB.y)}
            className="haoi-disks-segment"
          />
          <line
            x1={fmt(sA.x)}
            y1={fmt(sA.y)}
            x2={fmt(sD.x)}
            y2={fmt(sD.y)}
            className="haoi-disks-segment"
          />
          <line
            x1={fmt(sC.x)}
            y1={fmt(sC.y)}
            x2={fmt(sB.x)}
            y2={fmt(sB.y)}
            className="haoi-disks-segment"
          />
          <line
            x1={fmt(sC.x)}
            y1={fmt(sC.y)}
            x2={fmt(sD.x)}
            y2={fmt(sD.y)}
            className="haoi-disks-segment"
          />
          <line
            x1={fmt(sA.x)}
            y1={fmt(sA.y)}
            x2={fmt(sC.x)}
            y2={fmt(sC.y)}
            className="haoi-disks-segment-aux"
          />

          <PointDot p={sA} variant="primary" />
          <PointDot p={sC} variant="primary" />
          <PointDot p={sE} variant="primary" />
          <PointDot p={sB} variant="accent" />
          <PointDot p={sD} variant="accent" />

          <PointLabel p={xAxisEnd} label="x" dx={6} dy={12} anchor="middle" />
          <PointLabel p={yAxisEnd} label="y" dx={-12} dy={6} anchor="middle" />
          <PointLabel p={originSvg} label="O" dx={-10} dy={12} anchor="middle" />

          <PointLabel p={sA} label="A" dx={-11} dy={11} anchor="end" />
          <PointLabel p={sB} label="B" dx={-6} dy={-13} anchor="end" />
          <PointLabel p={sC} label="C" dx={11} dy={-8} anchor="start" />
          <PointLabel p={sD} label="D" dx={4} dy={15} anchor="middle" />
          <PointLabel p={sE} label="E" dx={0} dy={-13} anchor="middle" />
        </svg>
      </div>
      <figcaption>以平行于 x 轴的 AE 为基准，通过圆心连线 AC 确定覆盖圆弧的极角区间。</figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = {
  OverlappingArcsFigure,
  PolarAnglesFigure,
};
