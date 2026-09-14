import { Figure, MathLabel } from './elements';

const plot = { left: 150, right: 615, min: -3, max: 3 };
const px = (x: number) =>
  plot.left + ((x - plot.min) / (plot.max - plot.min)) * (plot.right - plot.left);
const gaussian = (x: number) => {
  const logDensity = -(x ** 2) / 2 - Math.log(2 * Math.PI) / 2;
  return { x, logDensity, density: Math.exp(logDensity), score: -x };
};
const samples = Array.from({ length: 181 }, (_, i) =>
  gaussian(plot.min + ((plot.max - plot.min) * i) / 180),
);
const probes = [-2, -1, 0, 1, 2].map(gaussian);
const densityY = (density: number) => 177 - 225 * density;
const logY = (logDensity: number) => 222 - 22 * logDensity;
const curve = (y: (sample: ReturnType<typeof gaussian>) => number) =>
  samples.map((sample, i) => `${i ? 'L' : 'M'} ${px(sample.x)} ${y(sample)}`).join(' ');

export function DiffusionScore() {
  const id = 'diffusion-score';
  const transcript = probes.map(({ x, score }) => `x=${x} 时 score=${score}`).join('；');
  return (
    <Figure
      id={id}
      height={473}
      title="Score 指向 log density 增长的方向"
      description={
        '固定时间，取标准 Gaussian。上图是 density，中图是 log density，虚线切线展示局部斜率，下图把斜率画成沿 x 轴的 score 箭头。三行横轴相同。' +
        transcript +
        '。正 score 向右，负 score 向左，零 score 只画圆点。箭长与 score 的绝对值成正比。曲线、切线、箭头和数值都由同一个 Gaussian 解析式计算。'
      }
      caption="同一位置的三行图上下对齐。中图的虚线切线给出 log density 的局部斜率，底部箭头用方向和长度表示这个斜率的正负与大小。在这个 Gaussian 中，峰顶 density 最高，但 score 为零；离均值越远，指回均值的箭头越长。"
    >
      <text x={330} y={26} className="df-label">
        Score 指向 log density 增长的方向
      </text>
      <MathLabel
        x={150}
        y={38}
        width={465}
        height={32}
        tex={String.raw`p_t=\mathcal N(0,1),\qquad s_t(x)=\frac{\mathrm d}{\mathrm dx}\log p_t(x)=-x`}
      />

      <text x={65} y={115} className="df-label">
        Density
      </text>
      <MathLabel x={10} y={122} width={110} tex="p_t(x)" />
      <text x={65} y={272} className="df-label">
        Log density
      </text>
      <MathLabel x={10} y={279} width={110} tex={String.raw`\log p_t(x)`} />
      <text x={65} y={417} className="df-label">
        Score
      </text>
      <MathLabel x={10} y={424} width={110} tex="s_t(x)" />

      {[0, 0.2, 0.4].map((value) => (
        <g key={value}>
          <path
            d={`M ${plot.left} ${densityY(value)} H ${plot.right}`}
            className="df-axis df-dashed"
          />
          <text x={plot.left - 16} y={densityY(value) + 4} className="df-small">
            {value}
          </text>
        </g>
      ))}
      {[0, -2, -4].map((value) => (
        <g key={value}>
          <path d={`M ${plot.left} ${logY(value)} H ${plot.right}`} className="df-axis df-dashed" />
          <text x={plot.left - 16} y={logY(value) + 4} className="df-small">
            {value}
          </text>
        </g>
      ))}
      <path d={`M ${plot.left} 79 V 177 H ${plot.right}`} className="df-axis" />
      <path d={`M ${plot.left} 222 V 344 H ${plot.right}`} className="df-axis" />
      <path d={`M ${plot.left} 419 H ${plot.right}`} className="df-axis" />
      <g className="df-blue">
        <path d={curve(({ density }) => densityY(density))} className="df-curve" />
        <path d={curve(({ logDensity }) => logY(logDensity))} className="df-curve" />
      </g>

      {probes.map(({ x, density, logDensity, score }) => {
        const tone = score > 0 ? 'teal' : score < 0 ? 'clay' : 'purple';
        const arrowEnd = px(x) + 20 * score;
        const direction = Math.sign(score);
        return (
          <g key={x} className={`df-${tone}`}>
            <circle cx={px(x)} cy={densityY(density)} r="3.5" className="df-point" />
            {Math.abs(x) <= 1 && (
              <path
                d={`M ${px(x - 0.6)} ${logY(logDensity - 0.6 * score)} L ${px(x + 0.6)} ${logY(logDensity + 0.6 * score)}`}
                className="df-score-tangent"
              />
            )}
            <circle cx={px(x)} cy={logY(logDensity)} r="3.5" className="df-point" />
            <MathLabel
              x={px(x) - 34}
              y={381}
              width={68}
              height={30}
              tex={score > 0 ? `+${score}` : `${score}`}
            />
            {score !== 0 && (
              <path
                d={`M ${px(x)} 419 H ${arrowEnd} M ${arrowEnd - direction * 6} 415 L ${arrowEnd} 419 L ${arrowEnd - direction * 6} 423`}
                className="df-curve"
              />
            )}
            <circle cx={px(x)} cy={419} r="3" className="df-point" />
            {[197, 364, 445].map((y) => (
              <text key={y} x={px(x)} y={y} className="df-small">
                {x}
              </text>
            ))}
          </g>
        );
      })}
      {[177, 344, 419].map((y) => (
        <MathLabel key={y} x={623} y={y - 9} width={26} height={30} tex="x" />
      ))}
    </Figure>
  );
}

export const POST_COMPONENTS = { DiffusionScore };
