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
function Arrowhead({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 8"
        refX="9"
        refY="4"
        markerWidth="7"
        markerHeight="6"
        orient="auto"
      >
        <path d="M 0 0 L 10 4 L 0 8 Z" className="muon-flow-arrow" />
      </marker>
    </defs>
  );
}

function MuonPolarGeometry() {
  const marker = 'muon-polar-arrow';
  const circleRadius = 48;
  const ellipseRadiusY = circleRadius / (SINGULAR_VALUES[0]! / SINGULAR_VALUES[2]!);
  return (
    <Diagram
      id="muon-polar-geometry"
      title="同一个单位圆经过原矩阵与理想 polar factor 后的几何对比"
      height={340}
      description="取最大和最小奇异方向张成的二维截面。上路中，归一化后的原矩阵把输入单位圆映成横纵半轴比例为 16 比 1 的细长椭圆；下路中，polar factor 把相同的输入单位圆映成单位圆。两条映射都把输入主轴 v_1 和 v_3 对应到输出主轴 u_1 和 u_3，区别只在输出半轴长度分别为 1 与十六分之一，或 1 与 1。"
      caption="为比较形状，上路先除以最大奇异值；正的整体缩放不改变 polar factor。原矩阵与 polar factor 保留同一组输入—输出主轴对应关系，但前者产生不均匀伸缩，后者把所有非零半轴长度设为 1。"
    >
      <Arrowhead id={marker} />
      {[104, 250].map((centerY) => (
        <g key={centerY}>
          <path d={`M 38 ${centerY} H 158`} className="muon-polar-axis" />
          <path d={`M 98 ${centerY - 60} V ${centerY + 60}`} className="muon-polar-axis" />
          <circle cx="98" cy={centerY} r={circleRadius} className="muon-polar-input" />
          <circle cx="98" cy={centerY} r="2.5" className="muon-flow-junction" />
        </g>
      ))}
      <path d="M 163 104 H 352" className="muon-polar-map" markerEnd={`url(#${marker})`} />
      <MathLabel x={190} y={55} width={136} tex={String.raw`M/\lVert M\rVert_2`} />
      <path d="M 163 250 H 352" className="muon-polar-map" markerEnd={`url(#${marker})`} />
      <MathLabel x={184} y={202} width={148} tex={String.raw`Q=\operatorname{Polar}(M)`} />
      {[104, 250].map((centerY) => (
        <g key={centerY}>
          <path d={`M 355 ${centerY} H 505`} className="muon-polar-axis" />
          <path d={`M 430 ${centerY - 67} V ${centerY + 67}`} className="muon-polar-axis" />
          <circle cx="430" cy={centerY} r="2.5" className="muon-flow-junction" />
        </g>
      ))}
      <ellipse
        cx="430"
        cy="104"
        rx={circleRadius}
        ry={ellipseRadiusY}
        className="muon-polar-ellipse"
      />
      <circle cx="430" cy="250" r={circleRadius} className="muon-polar-circle" />
      <MathLabel x={500} y={84} width={44} tex={String.raw`u_1`} />
      <MathLabel x={447} y={35} width={48} tex={String.raw`u_3`} />
      <MathLabel x={500} y={230} width={44} tex={String.raw`u_1`} />
      <MathLabel x={447} y={181} width={48} tex={String.raw`u_3`} />
      <MathLabel x={521} y={78} width={126} height={52} tex={String.raw`(1,\;1/16)`} />
      <MathLabel x={521} y={224} width={126} height={52} tex={String.raw`(1,\;1)`} />
      <text x="98" y="169" className="muon-note">
        input unit circle
      </text>
      <text x="98" y="315" className="muon-note">
        input unit circle
      </text>
    </Diagram>
  );
}

function MuonNewtonSchulzStep() {
  const marker = 'muon-ns-step-arrow';
  const firstStep = iterates[0]!.map((value, index) => ({
    index,
    input: value,
    gain: iterates[1]![index]! / value,
    output: iterates[1]![index]!,
  }));
  const boxes = [
    { x: 18, width: 80, note: 'iterate', tex: String.raw`X_k` },
    { x: 124, width: 140, note: 'Gram matrix', tex: String.raw`A_k=X_kX_k^\top` },
    {
      x: 300,
      width: 170,
      note: 'polynomial gain',
      tex: String.raw`P_k=aI+bA_k+cA_k^2`,
    },
    { x: 506, width: 138, note: 'next iterate', tex: String.raw`X_{k+1}=P_kX_k` },
  ];
  return (
    <Diagram
      id="muon-newton-schulz-step"
      title="一次 Newton–Schulz 迭代怎样用 Gram matrix 计算方向增益"
      height={478}
      description={`上半部分展示实际矩阵计算：从 X_k 计算 A_k 等于 X_k X_k 转置，再计算多项式增益矩阵 P_k 等于 aI 加 bA_k 加 cA_k 平方，最后左乘 X_k 得到 X_{k+1}。下半部分沿单个奇异方向展开同一运算：先平方奇异值，代入增益多项式，再乘回原奇异值。示例第一步中，三个奇异值和增益分别为 ${firstStep.map(({ input, gain, output }) => `${input.toFixed(3)} 乘 ${gain.toFixed(3)} 得 ${output.toFixed(3)}`).join('；')}。`}
      caption="上半部分是实现真正执行的矩阵乘法，不需要求出 SVD；下半部分只是用 SVD 坐标解释这些乘法。Gram matrix 将奇异值变成平方，矩阵多项式据此给每个方向算出增益，再乘回原矩阵：第一步压低最强方向，同时快速放大两个较弱方向。"
    >
      <Arrowhead id={marker} />
      <text x="330" y="27" className="muon-heading">
        Matrix computation · no SVD required
      </text>
      {boxes.map((box, index) => (
        <g key={box.note} className={index === 1 ? 'muon-clay' : 'muon-teal'}>
          <rect x={box.x} y="59" width={box.width} height="91" rx="7" className="muon-flow-box" />
          <text x={box.x + box.width / 2} y="83" className="muon-note">
            {box.note}
          </text>
          <MathLabel x={box.x + 5} y={91} width={box.width - 10} height={45} tex={box.tex} />
          {index < boxes.length - 1 && (
            <path
              d={`M ${box.x + box.width + 5} 104 H ${boxes[index + 1]!.x - 7}`}
              className="muon-ns-arrow"
              markerEnd={`url(#${marker})`}
            />
          )}
        </g>
      ))}
      <path d="M 28 181 H 632" className="muon-ns-divider" />
      <text x="330" y="211" className="muon-heading">
        The same step along singular direction i
      </text>
      <text x="65" y="244" className="muon-note">
        axis length
      </text>
      <text x="205" y="244" className="muon-note">
        square it
      </text>
      <text x="380" y="244" className="muon-note">
        compute gain
      </text>
      <text x="570" y="244" className="muon-note">
        multiply back
      </text>
      <MathLabel x={20} y={250} width={90} height={48} tex={String.raw`\sigma_i^{(k)}`} />
      <path d="M 112 274 H 132" className="muon-ns-arrow" markerEnd={`url(#${marker})`} />
      <MathLabel x={135} y={250} width={140} height={48} tex={String.raw`z_i=(\sigma_i^{(k)})^2`} />
      <path d="M 277 274 H 297" className="muon-ns-arrow" markerEnd={`url(#${marker})`} />
      <MathLabel x={300} y={250} width={160} height={48} tex={String.raw`g_i=a+bz_i+cz_i^2`} />
      <path d="M 462 274 H 482" className="muon-ns-arrow" markerEnd={`url(#${marker})`} />
      <MathLabel
        x={485}
        y={250}
        width={170}
        height={48}
        tex={String.raw`\sigma_i^{(k+1)}=g_i\sigma_i^{(k)}`}
      />
      <text x="330" y="329" className="muon-heading">
        First iteration in the running example
      </text>
      {firstStep.map(({ index, input, gain, output }, row) => (
        <g key={index} className={`muon-${TONES[index]}`}>
          <circle cx="121" cy={363 + 42 * row} r="4" className="muon-ns-sample" />
          <MathLabel
            x={140}
            y={342 + 42 * row}
            width={342}
            height={42}
            tex={String.raw`\sigma_${index + 1}:\;${input.toFixed(3)}\times${gain.toFixed(3)}\longrightarrow${output.toFixed(3)}`}
          />
          <text x="542" y={367 + 42 * row} className="muon-note">
            {gain < 1 ? 'gain < 1 · shrink' : 'gain > 1 · expand'}
          </text>
        </g>
      ))}
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

export const POST_COMPONENTS = { MuonPolarGeometry, MuonNewtonSchulzStep, MuonIteration };
