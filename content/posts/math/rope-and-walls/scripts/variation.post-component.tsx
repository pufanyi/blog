import type { ReactNode } from 'react';

interface Point {
  x: number;
  y: number;
}
const xy = (p: Point) => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
const line = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'} ${xy(p)}`).join(' ');

function Arrow({ from, to }: { from: Point; to: Point }) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const wing = (sign: number) => ({
    x: to.x - 7 * Math.cos(angle) + sign * 3 * Math.sin(angle),
    y: to.y - 7 * Math.sin(angle) - sign * 3 * Math.cos(angle),
  });
  return (
    <path
      d={`${line([from, to])} ${line([wing(-1), to, wing(1)])}`}
      className="rope-variation-arrow"
    />
  );
}

function Panel({
  id,
  title,
  description,
  children,
  formula,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  formula?: string;
}) {
  return (
    <div className="rope-wall-panel rope-variation-panel">
      <p className="rope-wall-panel-title">{title}</p>
      <svg viewBox="0 35 320 210" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>{title}</title>
        <desc id={`${id}-desc`}>{description}</desc>
        {children}
      </svg>
      {formula && <p className="rope-variation-formula">{formula}</p>}
    </div>
  );
}

// Both comparisons use the same scale, original arc length, and outward displacement.
const scale = 55;
const arcLength = 1.8;
const displacement = 0.2;
function CirclePatch({ radius, offset = false }: { radius: number; offset?: boolean }) {
  const center = { x: 160, y: 213 };
  const halfAngle = arcLength / radius / 2;
  const point = (angle: number, r = radius) => ({
    x: center.x + scale * r * Math.sin(angle),
    y: center.y - scale * r * Math.cos(angle),
  });
  const sample = (r: number) =>
    Array.from({ length: 61 }, (_, i) => point(-halfAngle + (2 * halfAngle * i) / 60, r));
  const original = sample(radius);
  const moved = sample(radius + displacement);
  const middle = point(0);
  return (
    <>
      {offset && (
        <path
          d={`${line(original)} ${line([...moved].reverse()).replace('M', 'L')} Z`}
          className="rope-wall-region"
        />
      )}
      <path
        d={line([
          point(-halfAngle, radius + (offset ? displacement : 0)),
          center,
          point(halfAngle, radius + (offset ? displacement : 0)),
        ])}
        className="rope-wall-chord"
        fill="none"
      />
      <path d={line(original)} className="rope-wall-rope" />
      <circle cx={center.x} cy={center.y} r="3" className="rope-wall-point" />
      <text x="150" y="237">
        C
      </text>
      <path d={line([center, middle])} className="rope-wall-chord" />
      <text x="169" y={(center.y + middle.y) / 2 + 5}>
        R
      </text>
      {offset ? (
        <>
          <path d={line(moved)} className="rope-variation-moved" />
          <Arrow from={middle} to={point(0, radius + displacement)} />
          <text x="139" y={middle.y - 20}>
            u
          </text>
        </>
      ) : (
        <>
          {[-halfAngle, halfAngle].map((angle, i) => {
            const p = point(angle);
            const to = { x: p.x - 38 * Math.cos(angle), y: p.y - 38 * Math.sin(angle) };
            return (
              <g key={angle}>
                <Arrow from={p} to={to} />
                <text x={i ? p.x + 10 : to.x - 12} y={i ? p.y - 12 : to.y + 17}>
                  T
                </text>
              </g>
            );
          })}
          <Arrow from={middle} to={point(0, radius + 0.65)} />
          <text x="172" y={middle.y - 29}>
            n
          </text>
        </>
      )}
    </>
  );
}

function RopeCurvatureDiagram() {
  return (
    <figure className="rope-wall-figure" data-rope-variation="curvature">
      <div className="rope-wall-panels">
        {[2, 1].map((radius) => (
          <Panel
            key={radius}
            id={`rope-curvature-${radius}`}
            title={radius === 2 ? '缓弯：走一段，方向转得少' : '急弯：走一样远，方向转得多'}
            description={`圆弧半径为 ${radius}，弧长均为 ${arcLength}，切线方向转过 ${arcLength / radius} 弧度。T 沿绳子指向前进方向，n 指向区域外侧，C 在内侧。`}
            formula={String.raw`\(R=${radius},\quad \kappa=${1 / radius},\quad \Delta\varphi=${arcLength / radius}\)`}
          >
            <CirclePatch radius={radius} />
          </Panel>
        ))}
      </div>
      <figcaption>
        两图比例相同，棕色弧的长度也相同。沿弧从右向左走，蓝色箭头 T
        随之转向；右图的方向变化更大，所以曲率更大。n 垂直绳子、朝向外侧，圆心 C
        位于反方向。这里用两段圆弧说明局部弯曲程度，并未假设整根绳子已经是圆。
      </figcaption>
    </figure>
  );
}

function RopeNormalVariation() {
  const base = (x: number) => ({ x, y: 137 - 32 * Math.cos(((x - 160) * Math.PI) / 260) });
  const bump = (x: number, center: number) => Math.max(0, 1 - ((x - center) / 47) ** 2) ** 3;
  const shifted = (x: number) => {
    const p = base(x);
    const slope = ((32 * Math.PI) / 260) * Math.sin(((x - 160) * Math.PI) / 260);
    const norm = Math.hypot(slope, 1);
    const u = 32 * (bump(x, 98) - bump(x, 222));
    return { x: p.x + (u * slope) / norm, y: p.y - u / norm };
  };
  const xs = Array.from({ length: 131 }, (_, i) => 30 + 2 * i);
  const band = (left: number, right: number) => {
    const points = xs.filter((x) => x >= left && x <= right);
    return `${line(points.map(base))} ${line(points.reverse().map(shifted)).replace('M', 'L')} Z`;
  };
  return (
    <figure className="rope-wall-figure" data-rope-variation="normal">
      <div className="rope-wall-panels rope-wall-single">
        <Panel
          id="rope-normal"
          title="只挪动内部，两个端点不动"
          description="同一条曲线的左侧沿外法线向外推，绿色窄带表示增加的面积；右侧沿外法线的反方向向内收，棕色窄带表示失去的面积。扰动在两端附近为零。虚线表示扰动后的曲线。"
          formula={String.raw`\(\gamma_\varepsilon=\gamma+\varepsilon f n\)`}
        >
          <path
            d={`${line(xs.map(base))} L 290 199 L 30 199 Z`}
            className="rope-variation-interior"
          />
          <path d={band(50, 146)} className="rope-wall-region" />
          <path d={band(174, 270)} className="rope-wall-segment" />
          <path d={line(xs.map(base))} className="rope-wall-rope" />
          <path d={line(xs.map(shifted))} className="rope-variation-moved" />
          {[98, 222].map((x) => (
            <Arrow key={x} from={base(x)} to={shifted(x)} />
          ))}
          <text x="277" y="159">
            A
          </text>
          <text x="26" y="159">
            B
          </text>
          <text x="74" y="60" className="rope-variation-label">
            向外推
          </text>
          <text x="203" y="177" className="rope-variation-label">
            向内收
          </text>
          <text x="116" y="215" className="rope-variation-label">
            区域内部
          </text>
          {[30, 290].map((x) => (
            <circle key={x} cx={x} cy={base(x).y} r="3" className="rope-wall-point" />
          ))}
        </Panel>
      </div>
      <figcaption>
        实线是原绳子，虚线是移动后的绳子，箭头沿原曲线的法线。向外推时 f 为正，向内收时 f
        为负；移动距离为了看清而放大。两块窄带分别增加、减少面积，这幅图只示意允许的动作，尚未要求两处长度变化抵消。
      </figcaption>
    </figure>
  );
}

function RopeLengthCost() {
  return (
    <figure className="rope-wall-figure" data-rope-variation="cost">
      <div className="rope-wall-panels">
        {[2, 1].map((radius) => (
          <Panel
            key={radius}
            id={`rope-cost-${radius}`}
            title={radius === 2 ? '缓弯向外推：较少的长度成本' : '急弯向外推：两倍的长度成本'}
            description={`原圆弧半径 ${radius}、弧长 ${arcLength}，沿外法线推出 ${displacement}。保持两条半径的方向不变，新弧长增加 ${((displacement * arcLength) / radius).toFixed(2)}；绿色表示扫过的窄带。`}
            formula={String.raw`\(\Delta L=${((displacement * arcLength) / radius).toFixed(2)},\quad \Delta\mathcal A\approx ${(displacement * arcLength).toFixed(2)}\)`}
          >
            <CirclePatch radius={radius} offset />
          </Panel>
        ))}
      </div>
      <figcaption>
        沿用上面的两段弧：原弧长都为 1.8，向外移动距离都为
        0.2。虚线新弧与原弧夹着绿色窄带；它们的面积增量在一阶相同，右图的长度增量却是左图的两倍。这里截取的是内部小段，截面的端点可以移动；完整扰动会在两旁平滑地降为零。面积只比较一阶项，有限宽度下还有二阶差异。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { RopeCurvatureDiagram, RopeNormalVariation, RopeLengthCost };
