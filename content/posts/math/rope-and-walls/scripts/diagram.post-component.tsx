import { examples } from './geometry';

const project = ({ x, y }: { x: number; y: number }) => ({ x: 62 + 88 * x, y: 245 - 88 * y });
const origin = project({ x: 0, y: 0 });
const firstTip = project({ x: 1, y: 0 });
const secondTip = project({ x: 1, y: Math.sqrt(3) });

function RopeWallDiagrams() {
  return (
    <figure className="rope-wall-figure">
      <div className="rope-wall-panels">
        {examples.map(({ id, title, length, geometry }) => {
          const { start, end, center, radius, angle, area } = geometry;
          const a = project(start);
          const b = project(end);
          const c = project(center);
          const arcCommand = `A ${88 * radius} ${88 * radius} 0 ${angle > Math.PI ? 1 : 0} 0 ${b.x} ${b.y}`;
          const arc = `M ${a.x} ${a.y} ${arcCommand}`;
          const region = `M ${origin.x} ${origin.y} L ${a.x} ${a.y} ${arcCommand} Z`;
          return (
            <div className="rope-wall-panel" key={id}>
              <p className="rope-wall-panel-title">{title}</p>
              <svg
                viewBox="0 0 320 285"
                role="img"
                aria-labelledby={`rope-${id}-title rope-${id}-desc`}
              >
                <title id={`rope-${id}-title`}>{`${title}的绳子与墙示意图`}</title>
                <desc id={`rope-${id}-desc`}>
                  {`墙角为六十度，墙长分别为一和二，绳长为${length}。阴影面积为${area.toFixed(6)}。粗曲线是绳子，直线是实际墙段，虚线是端点之间的弦。${id === 'sector' ? '圆心与墙角 O 重合。' : id === 'sliding' ? '圆心 C 在长墙线上。' : '圆弧超过半圆，绕过短墙端点。'}`}
                </desc>
                <path d={region} className="rope-wall-region" />
                <path
                  d={`M ${firstTip.x},${firstTip.y} L ${origin.x},${origin.y} L ${secondTip.x},${secondTip.y}`}
                  className="rope-wall-wall"
                />
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="rope-wall-chord" />
                <path d={arc} className="rope-wall-rope" />
                <circle cx={a.x} cy={a.y} r="3" className="rope-wall-point" />
                <circle cx={b.x} cy={b.y} r="3" className="rope-wall-point" />
                <text x={origin.x - 20} y={origin.y + 21}>
                  O
                </text>
                <text x={a.x + 6} y={a.y + 21}>
                  A
                </text>
                <text x={b.x - 21} y={b.y - 8}>
                  B
                </text>
                {id !== 'sector' && (
                  <>
                    <circle cx={c.x} cy={c.y} r="3" className="rope-wall-center" />
                    <text x={c.x + 10} y={c.y + 4}>
                      C
                    </text>
                  </>
                )}
              </svg>
              <p className="rope-wall-panel-value">
                绳长 {length} · 面积 {area.toFixed(6)}
              </p>
            </div>
          );
        })}
      </div>
      <figcaption>
        同一对有限墙，三种绳长：圆心和端点随约束改变，大圆弧可以伸到墙的延长线之外。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { RopeWallDiagrams };
