import { enclosure } from './geometry';

interface Scene {
  title: string;
  length: number;
  a: number;
  b: number;
  theta: number;
  x: number;
  y: number;
}
interface Point {
  x: number;
  y: number;
}

function GeometryPanels({
  id,
  scenes,
  caption,
  walls = true,
  split = false,
  tangents = false,
}: {
  id: string;
  scenes: Scene[];
  caption: string;
  walls?: boolean;
  split?: boolean;
  tangents?: boolean;
}) {
  const models = scenes.map((scene) => ({
    ...scene,
    shape: enclosure(scene.length, scene.a, scene.b, scene.theta),
  }));
  // Share one scale across each comparison; sample only to determine the viewport.
  const bounds = models.flatMap(({ shape, x, y, theta }) => [
    ...(walls
      ? [
          { x: 0, y: 0 },
          { x, y: 0 },
          { x: y * Math.cos(theta), y: y * Math.sin(theta) },
        ]
      : []),
    ...Array.from({ length: 201 }, (_, i) => ({
      x: shape.center.x + shape.radius * Math.cos(shape.startAngle + (shape.angle * i) / 200),
      y: shape.center.y + shape.radius * Math.sin(shape.startAngle + (shape.angle * i) / 200),
    })),
  ]);
  const xmin = Math.min(...bounds.map((p) => p.x));
  const xmax = Math.max(...bounds.map((p) => p.x));
  const ymin = Math.min(...bounds.map((p) => p.y));
  const ymax = Math.max(...bounds.map((p) => p.y));
  const scale = Math.min(260 / (xmax - xmin), 230 / (ymax - ymin));
  const project = (p: Point) => ({
    x: 180 + (p.x - (xmin + xmax) / 2) * scale,
    y: 158 - (p.y - (ymin + ymax) / 2) * scale,
  });
  const coordinates = (p: Point) => `${project(p).x} ${project(p).y}`;
  return (
    <figure className="rope-wall-figure">
      <div className={`rope-wall-panels${scenes.length === 1 ? ' rope-wall-single' : ''}`}>
        {models.map(({ title, length, x, y, theta, shape }, i) => {
          const { start, end, center, radius, angle, area } = shape;
          const o = { x: 0, y: 0 };
          const arc = `A ${scale * radius} ${scale * radius} 0 ${angle > Math.PI ? 1 : 0} 0 ${coordinates(end)}`;
          const rope = `M ${coordinates(start)} ${arc}`;
          const region = `M ${coordinates(o)} L ${coordinates(start)} ${arc} Z`;
          const titleId = `${id}-${i}-title`;
          const descId = `${id}-${i}-desc`;
          return (
            <div className="rope-wall-panel" key={title}>
              <p className="rope-wall-panel-title">{title}</p>
              <svg viewBox="0 0 360 315" role="img" aria-labelledby={`${titleId} ${descId}`}>
                <title id={titleId}>{title}</title>
                <desc
                  id={descId}
                >{`${caption} 本图绳长 ${length.toFixed(3)}，圆弧角 ${((angle * 180) / Math.PI).toFixed(1)} 度。${walls ? `所围面积 ${area.toFixed(6)}。` : '各图端点和弦长完全相同。'}`}</desc>
                {walls && <path d={region} className="rope-wall-region" />}
                {(split || !walls) && <path d={`${rope} Z`} className="rope-wall-segment" />}
                {walls && (
                  <path
                    d={`M ${coordinates({ x, y: 0 })} L ${coordinates(o)} L ${coordinates({ x: y * Math.cos(theta), y: y * Math.sin(theta) })}`}
                    className="rope-wall-wall"
                  />
                )}
                {!tangents && (
                  <path
                    d={`M ${coordinates(start)} L ${coordinates(end)}`}
                    className="rope-wall-chord"
                  />
                )}
                {tangents &&
                  [start, end].map((p, j) => {
                    const radial = { x: (p.x - center.x) / radius, y: (p.y - center.y) / radius };
                    const tangent = { x: -radial.y, y: radial.x };
                    const q = (r: number, t: number) => ({
                      x: p.x + r * radial.x + t * tangent.x,
                      y: p.y + r * radial.y + t * tangent.y,
                    });
                    const size = 12 / scale;
                    return (
                      <g key={j}>
                        <path
                          d={`M ${coordinates(q(0, -28 / scale))} L ${coordinates(q(0, 28 / scale))}`}
                          className="rope-wall-tangent"
                        />
                        <path
                          d={`M ${coordinates(q(-size, 0))} L ${coordinates(q(-size, j ? -size : size))} L ${coordinates(q(0, j ? -size : size))}`}
                          className="rope-wall-right-angle"
                        />
                      </g>
                    );
                  })}
                <path d={rope} className="rope-wall-rope" />
                {[
                  [start, 'A', 8, 21],
                  [end, 'B', -20, tangents ? -24 : -9],
                  ...(walls
                    ? [
                        [
                          o,
                          start.x === 0 ? 'O / A' : 'O',
                          start.x === 0 ? -60 : -25,
                          start.x === 0 ? 12 : 24,
                        ],
                      ]
                    : []),
                ].map((entry, j) => {
                  const [point, label, dx, dy] = entry as [Point, string, number, number];
                  if (walls && start.x === 0 && label === 'A') return null;
                  const p = project(point);
                  return (
                    <g key={j}>
                      <circle cx={p.x} cy={p.y} r="3" className="rope-wall-point" />
                      <text x={p.x + dx} y={p.y + dy}>
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p className="rope-wall-panel-value">
                {walls
                  ? `绳长 ${Number(length.toFixed(3))} · 面积 ${area.toFixed(6)}`
                  : `绳长 ${length.toFixed(3)} · 圆弧角 ${((angle * 180) / Math.PI).toFixed(1)}°`}
              </p>
            </div>
          );
        })}
      </div>
      {split && (
        <p className="rope-wall-legend">
          <span className="rope-wall-triangle-key" />
          墙角三角形 <span className="rope-wall-segment-key" />
          弦外圆弓形 <span className="rope-wall-line-key" />
          绳子
        </p>
      )}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

const base = { theta: Math.PI / 3, x: 1, y: 2 };
function RopeProblemDiagram() {
  return (
    <GeometryPanels
      id="rope-problem"
      scenes={[{ ...base, title: '墙提供两条边，绳子补上弯曲的一边', length: 2, a: 1, b: 1.7 }]}
      caption="从墙角 O 沿第一面墙走到 A，再沿绳子走到 B，最后沿第二面墙回到 O。阴影就是要最大化的面积；B 后面那一小段墙没有参与围边。"
    />
  );
}
function RopeArcFamily() {
  return (
    <GeometryPanels
      id="rope-arcs"
      walls={false}
      scenes={[
        { title: '绳子略长于弦', length: 1.1 },
        { title: '恰好围成半圆', length: Math.PI / 2 },
        { title: '继续加长，变成大圆弧', length: 3 },
      ].map((scene) => ({
        ...scene,
        theta: Math.PI / 2,
        a: Math.SQRT1_2,
        b: Math.SQRT1_2,
        x: 1,
        y: 1,
      }))}
      caption="固定同一对端点，弦长均为一，三图比例相同。这里只改变绳长：圆弧从不足半圆变成超过半圆。虚线是弦，不是绳子；第三图的较大面积来自更多绳长，不能拿它当作等绳长比较。"
    />
  );
}
function RopePerpendicularDiagram() {
  return (
    <GeometryPanels
      id="rope-perpendicular"
      tangents
      scenes={[
        {
          theta: Math.PI / 3,
          x: 1.45,
          y: 1.45,
          a: 1,
          b: 1,
          length: Math.PI / 3,
          title: '两个直角，把圆心钉在墙角',
        },
      ]}
      caption="蓝色短线表示绳子在端点的切线，小方框标出直角。端点可自由滑动时，切线必须垂直墙面，于是半径沿墙，两个半径的交点就是 O。图中的墙继续延伸，端点并未被墙端限制。"
    />
  );
}
function RopeAreaDiagram() {
  return (
    <GeometryPanels
      id="rope-area"
      split
      scenes={[
        { ...base, title: '小圆弧：三角形加小弓形', a: 1, b: 1, length: 1.3 },
        { ...base, title: '大圆弧：仍然是两部分相加', a: 1, b: 2, length: 4 },
      ]}
      caption="沿虚线 AB 切开，绿色部分是墙角三角形，棕色部分是圆弓形。超过半圆时，弓形依然完整位于弦背离 O 的一侧；改变的是圆弧角和圆心位置，面积拆分方法没有改变。两图比较拆分方式，绳长与端点并不相同。"
    />
  );
}
function RopeLongComparison() {
  return (
    <GeometryPanels
      id="rope-long"
      scenes={[
        { title: '两面墙都用满', a: 1, b: 1 },
        { title: '把一个端点移到墙角', a: 0, b: 1 },
      ].map((scene) => ({ ...scene, theta: Math.PI / 6, x: 1, y: 1, length: 10 }))}
      caption="这次两图的绳长、墙长、夹角和绘图比例完全相同：绳长为十，两面墙各长一，夹角三十度。右图的弦更长，围出的面积也更大。第一面墙留在区域内部，绳子从它的墙端外面绕过，没有穿墙。"
    />
  );
}

export const POST_COMPONENTS = {
  RopeProblemDiagram,
  RopeArcFamily,
  RopePerpendicularDiagram,
  RopeAreaDiagram,
  RopeLongComparison,
};
