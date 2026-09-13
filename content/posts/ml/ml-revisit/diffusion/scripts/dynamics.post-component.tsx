import { Figure, MathLabel } from './elements';
import {
  flowTrajectory,
  gaussianOde,
  gaussianScale,
  gaussianSde,
  INITIAL_POINTS,
  type Point,
} from './model';

const plot = { width: 244, height: 194, top: 107, min: -2.5, max: 3 };
const px = (left: number, t: number) => left + t * plot.width;
const py = (x: number) => plot.top + ((plot.max - x) / (plot.max - plot.min)) * plot.height;
const path = (points: Point[], left: number) =>
  points
    .map((p, i) => `${i ? 'L' : 'M'} ${px(left, p.t).toFixed(2)} ${py(p.x).toFixed(2)}`)
    .join(' ');
const times = Array.from({ length: 101 }, (_, i) => i / 100);

function Axes({ left }: { left: number }) {
  return (
    <g>
      <path
        d={`M ${left} ${plot.top} V ${plot.top + plot.height} H ${left + plot.width}`}
        className="df-axis"
      />
      {[-2, 0, 2].map((x) => (
        <g key={x}>
          <path d={`M ${left} ${py(x)} H ${left + plot.width}`} className="df-axis df-dashed" />
          <text x={left - 15} y={py(x) + 4} className="df-small">
            {x}
          </text>
        </g>
      ))}
      {[0, 0.5, 1].map((t) => (
        <text key={t} x={px(left, t)} y={plot.top + plot.height + 19} className="df-small">
          {t}
        </text>
      ))}
      <MathLabel x={left - 32} y={plot.top - 32} width={27} tex="x" />
      <MathLabel x={left + plot.width + 4} y={plot.top + plot.height - 5} width={23} tex="t" />
    </g>
  );
}

export function DiffusionConditionalMarginal() {
  const id = 'diffusion-conditional-marginal';
  const endpoints = [1.58, -1.45, 1.32, -1.7, 1.7, -1.32];
  return (
    <Figure
      id={id}
      height={423}
      title="配对的直线监督与沿平均 velocity 的生成轨迹"
      description="一维 toy data distribution 是均值为 -1.5 与 1.5、标准差均为 0.18 的等权 Gaussian mixture。左图选取六对 noise 与 data 值，画出 x_t=t z+(1-t)epsilon 的直线，若配对顺序不同就会相交。右图从相同六个初值出发，用该 mixture 的解析 marginal velocity 积分；每一步都重新取条件平均，得到不相交的弯曲轨迹。右图使用 JavaScript double precision 的 400 步 RK4，不是训练网络的输出。两图横轴为生成时间，纵轴是同一个一维数据坐标。"
      caption="直线是训练 target 的来源，弯曲线是沿 marginal velocity 的采样。两图使用相同坐标范围；颜色与线型仅用于区分示例轨迹，不表示它们仍保留原来的配对关系。"
    >
      <text x={174} y={29} className="df-label">
        已知的独立配对
      </text>
      <text x={492} y={29} className="df-label">
        只知道当前状态
      </text>
      <MathLabel x={64} y={40} width={220} tex={String.raw`x_t=t z+(1-t)\epsilon`} />
      <MathLabel
        x={379}
        y={40}
        width={226}
        tex={String.raw`\dot x_t=\mathbb E[z-\epsilon\mid x_t]`}
      />
      <Axes left={52} />
      <Axes left={370} />
      {INITIAL_POINTS.map((initial, i) => {
        const style = `df-${i % 2 ? 'clay' : 'blue'}`;
        const lineStyle = i % 3 === 0 ? '7 3' : i % 3 === 1 ? '2 3' : undefined;
        return (
          <g key={initial} className={style}>
            <path
              className="df-curve"
              strokeDasharray={lineStyle}
              d={path(
                [
                  { t: 0, x: initial },
                  { t: 1, x: endpoints[i] },
                ],
                52,
              )}
            />
            <circle className="df-point" cx={52} cy={py(initial)} r="3" />
            <circle className="df-point" cx={296} cy={py(endpoints[i])} r="3" />
            <path
              className="df-curve"
              strokeDasharray={lineStyle}
              d={path(
                flowTrajectory(initial).filter((_, j) => j % 4 === 0),
                370,
              )}
            />
            <circle className="df-point" cx={370} cy={py(initial)} r="3" />
          </g>
        );
      })}
      <text x={174} y={351} className="df-note">
        不同配对可以穿过同一个位置
      </text>
      <text x={492} y={351} className="df-note">
        每走一步，重新计算当前位置的平均方向
      </text>
      <MathLabel
        x={47}
        y={373}
        width={567}
        tex={String.raw`p_{\mathrm{data}}=\tfrac12\mathcal N(-1.5,0.18^2)+\tfrac12\mathcal N(1.5,0.18^2)`}
      />
    </Figure>
  );
}

export function DiffusionOdeSde() {
  const id = 'diffusion-ode-sde';
  const starts = [-1.4, -0.7, 0, 0.7, 1.4];
  const band = (left: number) =>
    `${path(
      times.map((t) => ({ t, x: t + gaussianScale(t) })),
      left,
    )} ${path(
      [...times].reverse().map((t) => ({ t, x: t - gaussianScale(t) })),
      left,
    ).replace(/^M/, 'L')} Z`;
  return (
    <Figure
      id={id}
      height={509}
      title="ODE 和 SDE：轨迹不同，但可以具有同一条边缘分布路径"
      description="解析一维 Gaussian 例子：p_t=N(t,(1-0.6t)^2)。ODE 使用精确直线解 x_t=t+(1-0.6t)x_0。SDE 在相同 velocity 上加入 0.65^2/2 倍的真实 score correction 和 0.65 倍 Brownian motion，图中按其解析 Gaussian transition 抽取 100 个间隔的状态。两图从相同五个初值展示少量轨迹；绿色带表示共同理论分布均值加减一个标准差，不是这些少量样本的经验统计。下方共同的理论密度在 t=0、0.5、1 分别是 N(0,1)、N(0.5,0.7^2)、N(1,0.4^2)。"
      caption="同一条 probability path 可以配上不同的随机过程。色带与下方曲线来自共同的理论 density；图中的几条路径只是示例，不用于估计 marginal。"
    >
      <text x={174} y={27} className="df-label">
        ODE：确定性轨迹
      </text>
      <text x={492} y={27} className="df-label">
        SDE：沿途持续随机探索
      </text>
      <MathLabel x={56} y={37} width={240} tex={String.raw`\mathrm dx=u_t(x)\mathrm dt`} />
      <MathLabel
        x={359}
        y={33}
        width={280}
        height={47}
        tex={String.raw`\mathrm dx=(u_t+\tfrac{g^2}{2}s_t)\mathrm dt+g\,\mathrm dW`}
      />
      <path d={band(52)} className="df-band" />
      <path d={band(370)} className="df-band" />
      <Axes left={52} />
      <Axes left={370} />
      {starts.map((initial, i) => (
        <g key={initial} className={`df-${i % 2 ? 'clay' : 'blue'}`}>
          <path
            d={path(
              times.map((t) => ({ t, x: gaussianOde(initial, t) })),
              52,
            )}
            className="df-curve"
            strokeDasharray={i % 2 ? '5 3' : undefined}
          />
          <path
            d={path(gaussianSde(initial, 7123 + i * 301), 370)}
            className="df-curve"
            strokeDasharray={i % 2 ? '5 3' : undefined}
          />
        </g>
      ))}
      <text x={330} y={350} className="df-note">
        共同的理论 density（色带：均值 ± 一个标准差）
      </text>
      {[0, 0.5, 1].map((t, i) => {
        const left = 39 + i * 213;
        const q = gaussianScale(t);
        const curve = Array.from({ length: 91 }, (_, j) => {
          const value = -3 + j / 15;
          const density =
            Math.exp(-((value - t) ** 2) / (2 * q ** 2)) / (Math.sqrt(2 * Math.PI) * q);
          return `${j ? 'L' : 'M'} ${left + j * 2} ${433 - density * 57}`;
        }).join(' ');
        return (
          <g key={t}>
            <path d={`M ${left} 433 H ${left + 180}`} className="df-axis" />
            <path d={`${curve} L ${left + 180} 433 L ${left} 433 Z`} className="df-density" />
            {[-2, 0, 2].map((value) => (
              <text key={value} x={left + (value + 3) * 30} y={450} className="df-small">
                {value}
              </text>
            ))}
            <MathLabel
              x={left - 7}
              y={463}
              width={194}
              tex={String.raw`p_{${t}}=\mathcal N(${t},${q.toFixed(1)}^2)`}
            />
          </g>
        );
      })}
    </Figure>
  );
}

export const POST_COMPONENTS = { DiffusionConditionalMarginal, DiffusionOdeSde };
