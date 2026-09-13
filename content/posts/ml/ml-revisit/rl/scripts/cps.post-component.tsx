import { CPS_EXAMPLE, cpsCoefficients } from './cps-model';
import { Figure, MathLabel } from './diffusion-elements';

export function DiffusionRlCpsBudget() {
  const id = 'rl-diffusion-cps-budget';
  const { t, next, diffusion } = CPS_EXAMPLE;
  const rows = cpsCoefficients(t, next, diffusion);
  const targetVariance = (1 - next) ** 2;
  const scale = 2400;
  const barX = 219;
  const targetX = barX + targetVariance * scale;
  const transcript = rows
    .map(
      (row) =>
        `${row.name}：data coefficient ${row.data.toFixed(2)}，retained noise ${row.retained.toFixed(2)}，fresh noise ${row.fresh.toFixed(2)}，合成标准差 ${row.total.toFixed(3)}`,
    )
    .join('；');
  return (
    <Figure
      id={id}
      height={448}
      title="CPS 把新噪声的方差从原有噪声份额中分出来"
      description={`线性路径的一步 t=${t} 到 s=${next}，h=${next - t}，SDE diffusion coefficient g=${diffusion}。目标 noise coefficient 为 ${1 - next}，目标方差为 ${targetVariance}。${transcript}。条形宽度表示两份 noise 的方差，蓝色实线框是 retained noise，棕色虚线框是 fresh noise；竖虚线标出目标总方差。这是将预测噪声视为单位方差并与 fresh noise 独立时的系数分析，不是经验测量。`}
      caption="横条相加的是方差，右侧显示合成标准差。CPS 把 retained noise 从 0.25 减至 0.15，再加入 0.20 的 fresh noise，恰好满足下一步 0.25 的目标。"
    >
      <MathLabel
        x={20}
        y={8}
        width={620}
        tex={String.raw`t=0.5\to s=0.75,\quad h=0.25,\quad g_t=0.4`}
      />
      <text x={330} y={63} className="dfr-note">
        所有行的 data coefficient 都是 0.75；下面只比较 noise
      </text>
      <text x={94} y={101} className="dfr-label">
        Sampler
      </text>
      <text x={334} y={101} className="dfr-label">
        Noise variance 的组成
      </text>
      <text x={580} y={101} className="dfr-label">
        合成标准差
      </text>
      {rows.map((row, i) => {
        const y = 132 + i * 67;
        const retainedWidth = row.retained ** 2 * scale;
        return (
          <g key={row.name}>
            <path d={`M ${targetX} ${y - 7} V ${y + 28}`} className="dfr-edge dfr-dashed" />
            <text x={97} y={y + 19} className="dfr-label">
              {row.name}
            </text>
            <g className="dfr-blue">
              <rect x={barX} y={y} width={retainedWidth} height={27} className="dfr-bar" />
            </g>
            {row.fresh > 0 && (
              <g className="dfr-clay">
                <rect
                  x={barX + retainedWidth}
                  y={y}
                  width={row.fresh ** 2 * scale}
                  height={27}
                  className="dfr-bar dfr-dashed"
                />
              </g>
            )}
            <MathLabel
              x={barX - 7}
              y={y + 27}
              width={270}
              height={29}
              tex={`${row.retained.toFixed(2)}^2+${row.fresh.toFixed(2)}^2=${row.variance.toFixed(4)}`}
            />
            <MathLabel
              x={520}
              y={y - 4}
              width={122}
              height={37}
              tex={`${row.total.toFixed(3)}${i === 1 || i === 2 ? '>0.25' : '=0.25'}`}
            />
          </g>
        );
      })}
      <text x={targetX} y={401} className="dfr-note">
        目标总方差 0.0625
      </text>
      <g className="dfr-blue">
        <rect x={134} y={423} width={23} height={10} className="dfr-bar" />
      </g>
      <text x={222} y={433} className="dfr-note">
        retained noise
      </text>
      <g className="dfr-clay">
        <rect x={371} y={423} width={23} height={10} className="dfr-bar dfr-dashed" />
      </g>
      <text x={454} y={433} className="dfr-note">
        fresh noise
      </text>
    </Figure>
  );
}

export const POST_COMPONENTS = { DiffusionRlCpsBudget };
