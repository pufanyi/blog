import { Diagram, MathLabel } from './elements';

const SINGULAR_VALUES = [8, 2, 0.5];
const COEFFICIENTS = { a: 3.4445, b: -4.775, c: 2.0315 };
const STEPS = 5;
const EPSILON = 1e-7;
const TONES = ['blue', 'teal', 'clay'];
const norm = Math.hypot(...SINGULAR_VALUES);
const iterates = [SINGULAR_VALUES.map((value) => value / (norm + EPSILON))];
for (let step = 0; step < STEPS; step++) {
  const { a, b, c } = COEFFICIENTS;
  iterates.push(iterates[step]!.map((value) => a * value + b * value ** 3 + c * value ** 5));
}
const finalValues = iterates[STEPS]!;
const display = (values: number[]) => values.map((value) => value.toFixed(3)).join(', ');

function MuonSpectrum() {
  const panels = [
    { title: 'Frobenius normalization', values: iterates[0]!, note: 'Same ratio: 16 : 4 : 1' },
    {
      title: 'Ideal polar factor',
      values: SINGULAR_VALUES.map(() => 1),
      note: 'All nonzero values become 1',
    },
    { title: 'Five quintic steps', values: finalValues, note: 'Similar scale, not exactly 1' },
  ];
  const baseline = 230;
  const scale = 125;
  return (
    <Diagram
      id="muon-spectrum"
      title="整体归一化、理想 polar 变换与五步近似的奇异值"
      height={314}
      description={`示例矩阵的奇异值为 ${SINGULAR_VALUES.join(', ')}。Frobenius 归一化后为 ${display(iterates[0]!)}，理想 polar 变换后为 1, 1, 1，五步五次迭代后为 ${display(finalValues)}。三栏共用相同纵轴尺度，柱子始终按原始奇异方向排列，不按迭代后的数值重新排序。`}
      caption="三栏使用相同尺度，虚线标出 1；颜色和下标跟踪同一个原始奇异方向。整体归一化保留比例，理想 polar 变换将非零奇异值设为 1，实际五步近似只将它们拉到相近尺度。"
    >
      {panels.map((panel, panelIndex) => {
        const left = panelIndex * 220;
        return (
          <g key={panel.title}>
            <text x={left + 110} y="30" className="muon-heading">
              {panel.title}
            </text>
            <path
              d={`M ${left + 24} ${baseline - scale} H ${left + 207}`}
              className="muon-reference"
            />
            <text x={left + 15} y={baseline - scale + 4} className="muon-note">
              1
            </text>
            <path d={`M ${left + 24} ${baseline} H ${left + 207}`} className="muon-axis" />
            {panel.values.map((value, index) => {
              const center = left + 53 + index * 59;
              const top = baseline - value * scale;
              return (
                <g key={index} className={`muon-${TONES[index]}`}>
                  <rect
                    x={center - 15}
                    y={top}
                    width="30"
                    height={baseline - top}
                    rx="3"
                    className="muon-bar"
                  />
                  <text x={center} y={top - 10} className="muon-value">
                    {value.toFixed(3)}
                  </text>
                  <MathLabel x={center - 26} y={236} width={52} tex={`\\sigma_${index + 1}`} />
                </g>
              );
            })}
            <text x={left + 110} y="295" className="muon-note">
              {panel.note}
            </text>
          </g>
        );
      })}
    </Diagram>
  );
}

function MuonIteration() {
  const plotX = (step: number) => 72 + step * 104;
  const plotY = (value: number) => 258 - value * 134;
  return (
    <>
      <Diagram
        id="muon-iteration"
        title="五次多项式如何改变每个奇异值"
        height={352}
        description={`沿用同一个对角矩阵，横轴是一次更新内部的迭代次数 0 到 ${STEPS}，纵轴是各个原始奇异方向上的值。小值被迅速放大，之后围绕 1 上下变化，并非单调收敛。每步数值见图后的折叠表格。`}
        caption="实线、长虚线和点线分别跟踪三个原始奇异方向；圆点表示实际迭代值，连线仅用于跟踪。虚线水平线是理想目标 1。这是矩阵内部的数值迭代，不是训练 loss 曲线。"
      >
        <text x="330" y="27" className="muon-heading">
          One update · five polynomial iterations
        </text>
        {[0, 0.5, 1, 1.5].map((value) => (
          <g key={value}>
            <path
              d={`M 72 ${plotY(value)} H 592`}
              className={value === 1 ? 'muon-reference' : 'muon-grid'}
            />
            <text x="45" y={plotY(value) + 4} className="muon-note">
              {value.toFixed(1)}
            </text>
          </g>
        ))}
        <path d="M 72 48 V 258 H 592" className="muon-axis" />
        {iterates.map((_, step) => (
          <text key={step} x={plotX(step)} y="283" className="muon-note">
            {step}
          </text>
        ))}
        <MathLabel x={600} y={267} width={40} tex="k" />
        {SINGULAR_VALUES.map((_, direction) => (
          <g key={direction} className={`muon-${TONES[direction]} muon-series-${direction}`}>
            <path
              d={iterates
                .map(
                  (values, step) =>
                    `${step === 0 ? 'M' : 'L'} ${plotX(step)} ${plotY(values[direction]!)}`,
                )
                .join(' ')}
              className="muon-curve"
            />
            {iterates.map((values, step) => (
              <circle
                key={step}
                cx={plotX(step)}
                cy={plotY(values[direction]!)}
                r="3.5"
                className="muon-point"
              />
            ))}
            <path d={`M ${149 + direction * 155} 327 h 32`} className="muon-curve" />
            <MathLabel
              x={184 + direction * 155}
              y={310}
              width={58}
              tex={`\\sigma_${direction + 1}`}
            />
          </g>
        ))}
      </Diagram>
      <details>
        <summary>示例每步的奇异值</summary>
        <p>
          从对角矩阵的奇异值 {SINGULAR_VALUES.join('、')} 开始，先除以 Frobenius norm 加 {EPSILON}
          ，再使用正文的五次多项式。表格保留三位小数，各列跟踪原始方向。
        </p>
        <table>
          <thead>
            <tr>
              <th>迭代次数</th>
              {SINGULAR_VALUES.map((_, index) => (
                <th key={index}>{`\\(\\sigma_${index + 1}\\)`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {iterates.map((values, step) => (
              <tr key={step}>
                <td>{step}</td>
                {values.map((value, index) => (
                  <td key={index}>{value.toFixed(3)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

export const POST_COMPONENTS = { MuonSpectrum, MuonIteration };
