import { Figure, MathLabel } from './elements';

const noiseScale = 0.6;
const retainedScale = Math.sqrt(1 - noiseScale ** 2);
const cases = [
  { label: '只加 noise', retained: 1, fresh: noiseScale },
  { label: '只向均值收缩', retained: retainedScale, fresh: 0 },
  { label: '收缩后再加 noise', retained: retainedScale, fresh: noiseScale },
].map((item) => ({ ...item, variance: item.retained ** 2 + item.fresh ** 2 }));
const plot = { baseline: 258, min: -3.5, max: 3.5, width: 160, scale: 168 };
const normal = (x: number, variance: number) =>
  Math.exp(-(x ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance);
const coordinate = (left: number, x: number) =>
  left + ((x - plot.min) / (plot.max - plot.min)) * plot.width;
const densityCurve = (left: number, variance: number) =>
  Array.from({ length: 141 }, (_, i) => {
    const x = plot.min + ((plot.max - plot.min) * i) / 140;
    return `${i ? 'L' : 'M'} ${coordinate(left, x).toFixed(3)} ${(plot.baseline - plot.scale * normal(x, variance)).toFixed(3)}`;
  }).join(' ');
const update = (retained: number, fresh: number) => {
  const signal = retained === 1 ? 'X' : retained.toFixed(1) + 'X';
  return "X'=" + signal + (fresh ? '+' + fresh.toFixed(1) + '\\xi' : '');
};

export function DiffusionNoiseBalance() {
  const id = 'diffusion-noise-balance';
  const description = cases
    .map(
      ({ label, retained, fresh, variance }) =>
        label +
        '：原样本系数 ' +
        retained.toFixed(1) +
        '，新 noise 系数 ' +
        fresh.toFixed(1) +
        '，更新后方差 ' +
        variance.toFixed(2),
    )
    .join('；');
  return (
    <Figure
      id={id}
      height={383}
      title="只加 noise 会变宽，只收缩会变窄，配合起来可以保持分布"
      description={
        '三个独立对比都从标准 Gaussian X 开始，xi 是独立标准 Gaussian。' +
        description +
        '。三图使用相同的坐标范围和 density 纵轴尺度，灰色虚线是原来的标准 Gaussian，蓝色实线是更新后的理论 density。最后一图两条曲线重合。曲线由 Gaussian density 解析计算，不是训练模型或有限样本的统计结果。'
      }
      caption="每列都从同一个标准 Gaussian 分布出发。虚线是更新前，实线是更新后；最后一列两者重合，表示样本可以随机移动，而整体分布保持不变。"
    >
      <MathLabel
        x={80}
        y={5}
        width={500}
        tex={String.raw`X\sim\mathcal N(0,1),\qquad\xi\sim\mathcal N(0,1)`}
      />
      {cases.map(({ label, retained, fresh, variance }, i) => {
        const left = 18 + i * 213;
        const axisLeft = left + 24;
        const actual = densityCurve(axisLeft, variance);
        return (
          <g key={label} className="df-blue">
            <text x={left + 101} y={74} className="df-label">
              {label}
            </text>
            <MathLabel x={left + 1} y={87} width={200} tex={update(retained, fresh)} />
            <path
              d={`M ${axisLeft} 154 V ${plot.baseline} H ${axisLeft + plot.width}`}
              className="df-axis"
            />
            {[0.2, 0.4].map((level) => (
              <g key={level}>
                <path
                  d={`M ${axisLeft} ${plot.baseline - plot.scale * level} H ${axisLeft + plot.width}`}
                  className="df-axis df-dashed"
                />
                <text
                  x={axisLeft - 15}
                  y={plot.baseline - plot.scale * level + 4}
                  className="df-small"
                >
                  {level}
                </text>
              </g>
            ))}
            <path d={actual} className="df-curve" />
            <path d={densityCurve(axisLeft, 1)} className="df-edge df-dashed" />
            {[-2, 0, 2].map((x) => (
              <text key={x} x={coordinate(axisLeft, x)} y={plot.baseline + 18} className="df-small">
                {x}
              </text>
            ))}
            <MathLabel
              x={left}
              y={290}
              width={202}
              tex={String.raw`\operatorname{Var}(X')=${variance.toFixed(2)}`}
            />
          </g>
        );
      })}
      <path d="M 118 353 H 160" className="df-edge df-dashed" />
      <text x={222} y={357} className="df-note">
        更新前的 density
      </text>
      <g className="df-blue">
        <path d="M 367 353 H 409" className="df-curve" />
      </g>
      <text x={471} y={357} className="df-note">
        更新后的 density
      </text>
    </Figure>
  );
}

export const POST_COMPONENTS = { DiffusionNoiseBalance };
