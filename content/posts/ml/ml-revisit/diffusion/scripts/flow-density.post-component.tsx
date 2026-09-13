import { Figure, MathLabel } from './elements';

const plot = { left: 64, right: 616, min: -3, max: 9, densityScale: 210 };
const px = (x: number) =>
  plot.left + ((x - plot.min) / (plot.max - plot.min)) * (plot.right - plot.left);
const normal = (x: number, mean: number, scale: number) =>
  Math.exp(-0.5 * ((x - mean) / scale) ** 2) / (Math.sqrt(2 * Math.PI) * scale);
const stages = [
  { mean: 0, scale: 1, baseline: 135, variable: '\\epsilon', density: 'p_0' },
  { mean: 3, scale: 2, baseline: 375, variable: 'x', density: 'p_X' },
];

function curve(mean: number, scale: number, baseline: number, start: number, end: number) {
  return Array.from({ length: 161 }, (_, i) => {
    const x = start + ((end - start) * i) / 160;
    const y = baseline - normal(x, mean, scale) * plot.densityScale;
    return (i ? 'L' : 'M') + ' ' + px(x).toFixed(3) + ' ' + y.toFixed(3);
  }).join(' ');
}

export function DiffusionFlowDensity() {
  const id = 'diffusion-flow-density';
  const transcript = stages
    .map(
      ({ mean, scale }) =>
        '均值 ' +
        mean +
        '，标准差 ' +
        scale +
        '，阴影区间 [' +
        (mean - scale) +
        ',' +
        (mean + scale) +
        ']' +
        '，区间宽度 ' +
        2 * scale +
        '，峰值 density ' +
        normal(mean, mean, scale).toFixed(3),
    )
    .join('；');
  return (
    <Figure
      id={id}
      height={496}
      title="样本拉伸两倍，density 减半，对应区间的概率保持不变"
      description={
        '解析变换 x=2 epsilon+3 把标准 Gaussian 映射为 N(3,2^2)。两图使用相同的横轴单位与 density 纵轴单位，横轴显示 -3 到 9。' +
        transcript +
        '。同一份概率从输入区间 [-1,1] 移到输出区间 [1,5]，两个阴影面积相等。曲线由 Gaussian density 直接计算，未使用样本直方图或训练模型。'
      }
      caption="两图使用相同坐标尺度。平移改变位置，拉伸把同一份概率摊到更宽的区间：阴影宽度翻倍，对应位置的 density 减半，面积保持不变。"
    >
      {stages.map(({ mean, scale, baseline, variable, density }) => {
        const start = mean - scale;
        const end = mean + scale;
        return (
          <g key={density} className="df-blue">
            <MathLabel
              x={190}
              y={baseline - 132}
              width={280}
              tex={
                variable +
                '\\sim\\mathcal N(' +
                mean +
                ',' +
                (scale === 1 ? '1' : scale + '^2') +
                ')'
              }
            />
            <path
              d={'M ' + plot.left + ' ' + (baseline - 101) + ' V ' + baseline + ' H ' + plot.right}
              className="df-axis"
            />
            {[0.2, 0.4].map((level) => (
              <g key={level}>
                <path
                  d={
                    'M ' +
                    plot.left +
                    ' ' +
                    (baseline - level * plot.densityScale) +
                    ' H ' +
                    plot.right
                  }
                  className="df-axis df-dashed"
                />
                <text
                  x={plot.left - 20}
                  y={baseline - level * plot.densityScale + 4}
                  className="df-small"
                >
                  {level}
                </text>
              </g>
            ))}
            <path
              d={
                curve(mean, scale, baseline, start, end) +
                ' L ' +
                px(end) +
                ' ' +
                baseline +
                ' L ' +
                px(start) +
                ' ' +
                baseline +
                ' Z'
              }
              className="df-band"
            />
            <path d={curve(mean, scale, baseline, plot.min, plot.max)} className="df-curve" />
            {[start, end].map((bound) => (
              <path
                key={bound}
                d={
                  'M ' +
                  px(bound) +
                  ' ' +
                  baseline +
                  ' V ' +
                  (baseline - normal(bound, mean, scale) * plot.densityScale)
                }
                className="df-edge df-dashed"
              />
            ))}
            {[-2, 0, 2, 4, 6, 8].map((value) => (
              <text key={value} x={px(value)} y={baseline + 18} className="df-small">
                {value}
              </text>
            ))}
            <MathLabel x={620} y={baseline - 8} width={30} tex={variable} />
            <MathLabel
              x={408}
              y={baseline - 75}
              width={206}
              tex={density + '(' + mean + ')\\approx' + normal(mean, mean, scale).toFixed(3)}
            />
            <MathLabel
              x={140}
              y={baseline + 29}
              width={380}
              tex={
                variable +
                '\\in[' +
                start +
                ',' +
                end +
                '],\\qquad\\Delta ' +
                variable +
                '=' +
                2 * scale
              }
            />
          </g>
        );
      })}
      <MathLabel x={180} y={200} width={300} tex="x=2\epsilon+3" />
      <MathLabel x={70} y={450} width={520} tex="\Pr(-1\le\epsilon\le1)=\Pr(1\le x\le5)" />
    </Figure>
  );
}

export const POST_COMPONENTS = { DiffusionFlowDensity };
