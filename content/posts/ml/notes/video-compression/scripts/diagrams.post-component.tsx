import type { ReactNode } from 'react';

const blockSize = 4 as const;
const sourceBlock = [52, 54, 56, 58, 53, 72, 74, 59, 54, 73, 78, 60, 55, 57, 59, 61];
const predictionBlock = [51, 53, 55, 57, 52, 56, 58, 58, 53, 57, 59, 59, 54, 56, 58, 60];
const residualBlock = sourceBlock.map((value, index) => value - predictionBlock[index]);
const quantizationStep = 4;

function dctCoefficient(values: readonly number[], frequencyRow: number, frequencyColumn: number) {
  const rowScale = frequencyRow === 0 ? Math.sqrt(1 / blockSize) : Math.sqrt(2 / blockSize);
  const columnScale = frequencyColumn === 0 ? Math.sqrt(1 / blockSize) : Math.sqrt(2 / blockSize);

  let sum = 0;
  for (let row = 0; row < blockSize; row += 1) {
    for (let column = 0; column < blockSize; column += 1) {
      sum +=
        values[row * blockSize + column] *
        Math.cos(((2 * row + 1) * frequencyRow * Math.PI) / (2 * blockSize)) *
        Math.cos(((2 * column + 1) * frequencyColumn * Math.PI) / (2 * blockSize));
    }
  }

  return rowScale * columnScale * sum;
}

const quantizedCoefficients = Array.from({ length: blockSize * blockSize }, (_, index) => {
  const row = Math.floor(index / blockSize);
  const column = index % blockSize;
  return Math.round(dctCoefficient(residualBlock, row, column) / quantizationStep);
});

type BlockKind = 'source' | 'prediction' | 'residual' | 'coefficient';

function MathLabel({
  x,
  y,
  width,
  height,
  children,
  className = '',
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div className={`vc-math${className ? ` ${className}` : ''}`}>{children}</div>
    </foreignObject>
  );
}

function InlineMath({ tex }: { tex: string }) {
  return <span>{`\\(${tex}\\)`}</span>;
}

function NumericBlock({
  values,
  x,
  label,
  formulaTex,
  kind,
}: {
  values: readonly number[];
  x: number;
  label: string;
  formulaTex: string;
  kind: BlockKind;
}) {
  const cellSize = 34;
  return (
    <g>
      <MathLabel x={x} y={8} width={4 * cellSize} height={32} className="vc-math-label">
        {`${label} `}
        <InlineMath tex={formulaTex} />
      </MathLabel>
      {values.map((value, index) => {
        const row = Math.floor(index / blockSize);
        const column = index % blockSize;
        const coefficientClass = value === 0 ? ' vc-zero' : ' vc-nonzero';
        return (
          <g key={`${kind}-${row}-${column}`}>
            <rect
              x={x + column * cellSize}
              y={48 + row * cellSize}
              width={cellSize}
              height={cellSize}
              className={`vc-cell vc-${kind}${kind === 'coefficient' ? coefficientClass : ''}`}
            />
            <text
              x={x + column * cellSize + cellSize / 2}
              y={48 + row * cellSize + 22}
              textAnchor="middle"
              className="vc-number"
            >
              {value}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function PredictionResidual() {
  return (
    <figure className="vc-figure">
      <div className="vc-scroll">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="780"
          height="275"
          viewBox="0 0 780 275"
          role="img"
          aria-labelledby="vc-residual-title vc-residual-desc"
        >
          <title id="vc-residual-title">原始块减去预测块，再变换和量化为稀疏系数</title>
          <desc id="vc-residual-desc">
            四个四乘四数值矩阵依次展示原始亮度、预测亮度、两者逐元素相减所得残差，以及对同一残差执行二维正交离散余弦变换并按步长四量化后的系数。最后一个矩阵有多个零。
          </desc>
          <NumericBlock values={sourceBlock} x={20} label="原始块" formulaTex="x" kind="source" />
          <MathLabel x={155} y={96} width={38} height={40} className="vc-math-operator">
            <InlineMath tex="-" />
          </MathLabel>
          <NumericBlock
            values={predictionBlock}
            x={194}
            label="预测块"
            formulaTex="p"
            kind="prediction"
          />
          <MathLabel x={329} y={96} width={38} height={40} className="vc-math-operator">
            <InlineMath tex="=" />
          </MathLabel>
          <NumericBlock
            values={residualBlock}
            x={368}
            label="残差"
            formulaTex="e=x-p"
            kind="residual"
          />
          <path d="M521 116H563M555 110L563 116L555 122" className="vc-arrow" />
          <MathLabel x={515} y={74} width={54} height={28} className="vc-math-small">
            <InlineMath tex={String.raw`\operatorname{DCT}`} />
          </MathLabel>
          <MathLabel x={515} y={128} width={54} height={28} className="vc-math-small">
            <InlineMath tex={String.raw`\div 4`} />
          </MathLabel>
          <NumericBlock
            values={quantizedCoefficients}
            x={574}
            label="量化系数"
            formulaTex="q"
            kind="coefficient"
          />
          <MathLabel x={126} y={207} width={598} height={30} className="vc-math-small">
            {'数值由图中 '}
            <InlineMath tex="x-p" />
            {' 逐项计算；系数采用正交 '}
            <InlineMath tex={String.raw`4\times4`} />
            {' DCT 与 '}
            <InlineMath tex={String.raw`\Delta=4`} />
          </MathLabel>
          <g transform="translate(652 242)">
            <rect width="13" height="13" className="vc-cell vc-coefficient vc-zero" />
            <text x="19" y="11" className="vc-small">
              零系数
            </text>
            <rect x="83" width="13" height="13" className="vc-cell vc-coefficient vc-nonzero" />
            <text x="102" y="11" className="vc-small">
              非零
            </text>
          </g>
        </svg>
      </div>
      <figcaption>
        示例只处理一块亮度值。预测已经解释了大部分平缓背景，残差主要留下中央变化；DCT
        把这种相关图样集中到较少频率，量化再把小系数变成零。最后的系数由左侧同一组数值现场计算，并非手填结果。
      </figcaption>
    </figure>
  );
}

function HybridCodec() {
  return (
    <figure className="vc-figure">
      <div className="vc-scroll">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="780"
          height="470"
          viewBox="0 0 780 470"
          role="img"
          aria-labelledby="vc-hybrid-title vc-hybrid-desc"
        >
          <title id="vc-hybrid-title">混合视频编码器包含与播放端一致的本地解码闭环</title>
          <desc id="vc-hybrid-desc">
            原始块减去预测得到残差，经变换量化和熵编码成为比特流。同时量化结果在编码器内部反量化、逆变换并加回同一个预测，经过环路滤波成为重建参考。参考缓冲区反馈给预测器。虚线表示语法控制，实线表示像素或系数数据流。
          </desc>
          <defs>
            <marker
              id="vc-hybrid-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0 0L8 4L0 8Z" className="vc-arrow-head" />
            </marker>
          </defs>
          <text x="390" y="27" textAnchor="middle" className="vc-heading">
            Encoder：一边发送语法，一边重建 decoder 将看到的参考
          </text>

          <rect x="22" y="82" width="105" height="48" rx="6" className="vc-box vc-source-box" />
          <MathLabel x={22} y={90} width={105} height={32}>
            {'原始块 '}
            <InlineMath tex="x" />
          </MathLabel>
          <circle cx="176" cy="106" r="19" className="vc-sum" />
          <text x="176" y="112" textAnchor="middle" className="vc-operator">
            −
          </text>
          <rect x="225" y="82" width="128" height="48" rx="6" className="vc-box vc-transform-box" />
          <text x="289" y="102" textAnchor="middle">
            变换与量化
          </text>
          <MathLabel x={225} y={105} width={128} height={25} className="vc-math-small">
            <InlineMath tex={String.raw`q=Q(T(e))`} />
          </MathLabel>
          <rect x="405" y="82" width="116" height="48" rx="6" className="vc-box vc-bit-box" />
          <text x="463" y="102" textAnchor="middle">
            熵编码
          </text>
          <MathLabel x={405} y={105} width={116} height={25} className="vc-math-small">
            {'模式 + 向量 + '}
            <InlineMath tex="q" />
          </MathLabel>
          <rect x="570" y="82" width="116" height="48" rx="6" className="vc-box vc-bit-box" />
          <text x="628" y="111" textAnchor="middle">
            bitstream
          </text>

          <path d="M127 106H156" className="vc-flow" />
          <path d="M195 106H225" className="vc-flow" />
          <path d="M353 106H405" className="vc-flow" />
          <path d="M521 106H570" className="vc-flow" />

          <rect
            x="225"
            y="197"
            width="128"
            height="48"
            rx="6"
            className="vc-box vc-transform-box"
          />
          <text x="289" y="217" textAnchor="middle">
            反量化与逆变换
          </text>
          <MathLabel x={225} y={220} width={128} height={25} className="vc-math-small">
            <InlineMath tex={String.raw`\hat e=T^{-1}\!\left(Q^{-1}(q)\right)`} />
          </MathLabel>
          <circle cx="405" cy="221" r="19" className="vc-sum" />
          <text x="405" y="227" textAnchor="middle" className="vc-operator">
            +
          </text>
          <rect x="455" y="197" width="112" height="48" rx="6" className="vc-box vc-filter-box" />
          <text x="511" y="217" textAnchor="middle">
            in-loop
          </text>
          <text x="511" y="235" textAnchor="middle" className="vc-small">
            filters
          </text>
          <rect
            x="616"
            y="197"
            width="146"
            height="48"
            rx="6"
            className="vc-box vc-reference-box"
          />
          <text x="689" y="217" textAnchor="middle">
            重建参考缓冲区
          </text>
          <MathLabel x={616} y={220} width={146} height={25} className="vc-math-small">
            <InlineMath tex={String.raw`\hat{x}_r`} />
          </MathLabel>
          <path d="M289 130V197" className="vc-flow" />
          <path d="M353 221H386" className="vc-flow" />
          <path d="M424 221H455" className="vc-flow" />
          <path d="M567 221H616" className="vc-flow" />

          <rect x="302" y="320" width="150" height="48" rx="6" className="vc-box vc-predict-box" />
          <text x="377" y="340" textAnchor="middle">
            intra / inter 预测
          </text>
          <MathLabel x={302} y={343} width={150} height={25} className="vc-math-small">
            {'产生 '}
            <InlineMath tex="p" />
            {' 与预测语法'}
          </MathLabel>
          <path d="M689 245V344H452" className="vc-flow" />
          <path d="M377 320V271H405V240" className="vc-flow" />
          <path d="M302 344H176V125" className="vc-flow" />
          <path d="M452 344H540V139H463V130" className="vc-control" />

          <line x1="250" y1="400" x2="306" y2="400" className="vc-flow" />
          <text x="315" y="405" className="vc-small">
            重建数据流
          </text>
          <line x1="450" y1="400" x2="506" y2="400" className="vc-control" />
          <text x="515" y="405" className="vc-small">
            模式语法
          </text>
          <MathLabel x={75} y={427} width={630} height={32} className="vc-math-small">
            {'后续预测只能读取 '}
            <InlineMath tex={String.raw`\hat{x}_r`} />
            {'；若 encoder 偷看原始参考，decoder 会逐帧漂移'}
          </MathLabel>
        </svg>
      </div>
      <figcaption>
        上路把 residual 变成 bitstream；下路在 encoder 内部执行 decoder 的重建步骤。预测器把同一个
        prediction 同时送到减法与加法节点，滤波后的重建帧才进入 reference
        buffer。图中省略色度路径、多个参考帧和具体滤波阶段。
      </figcaption>
    </figure>
  );
}

const gopFrames = [
  { label: 'I_0', type: 'i', presentation: 0, decoding: 0 },
  { label: 'B_1', type: 'b', presentation: 1, decoding: 2 },
  { label: 'B_2', type: 'b', presentation: 2, decoding: 3 },
  { label: 'P_3', type: 'p', presentation: 3, decoding: 1 },
  { label: 'B_4', type: 'b', presentation: 4, decoding: 5 },
  { label: 'P_5', type: 'p', presentation: 5, decoding: 4 },
] as const;

const referenceEdges = [
  { from: 0, to: 1, bend: -37 },
  { from: 3, to: 1, bend: -57 },
  { from: 0, to: 2, bend: -62 },
  { from: 3, to: 2, bend: -38 },
  { from: 3, to: 4, bend: -38 },
  { from: 5, to: 4, bend: -56 },
  { from: 0, to: 3, bend: -84 },
  { from: 3, to: 5, bend: -69 },
] as const;

function GopTimeline() {
  const startX = 74;
  const step = 118;
  const y = 153;
  return (
    <figure className="vc-figure">
      <div className="vc-scroll">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="760"
          height="335"
          viewBox="0 0 760 335"
          role="img"
          aria-labelledby="vc-gop-title vc-gop-desc"
        >
          <title id="vc-gop-title">含双向预测帧的显示顺序、参考关系和解码顺序</title>
          <desc id="vc-gop-desc">
            显示顺序为 I0、B1、B2、P3、B4、P5。弧线箭头从参考帧指向被预测帧。由于 B1 和 B2
            依赖稍后显示的 P3，示例解码顺序变为 I0、P3、B1、B2、P5、B4。
          </desc>
          <defs>
            <marker
              id="vc-gop-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0L7 3.5L0 7Z" className="vc-reference-head" />
            </marker>
          </defs>
          <text x="34" y="31" className="vc-label">
            参考
          </text>
          {referenceEdges.map(({ from, to, bend }) => {
            const fromX = startX + from * step;
            const toX = startX + to * step;
            const controlY = y + bend;
            return (
              <path
                key={`${from}-${to}`}
                d={`M${fromX} ${y - 23} Q${(fromX + toX) / 2} ${controlY} ${toX} ${y - 23}`}
                className="vc-reference"
              />
            );
          })}
          <text x="20" y={y + 6} textAnchor="middle" className="vc-label">
            显示
          </text>
          {gopFrames.map((frame) => {
            const x = startX + frame.presentation * step;
            return (
              <g key={frame.label}>
                <rect
                  x={x - 30}
                  y={y - 22}
                  width="60"
                  height="44"
                  rx="7"
                  className={`vc-frame vc-frame-${frame.type}`}
                />
                <MathLabel x={x - 30} y={y - 17} width={60} height={34} className="vc-math-frame">
                  <InlineMath tex={frame.label} />
                </MathLabel>
                <MathLabel x={x - 38} y={y + 27} width={76} height={28} className="vc-math-small">
                  <InlineMath tex={`t=${frame.presentation}`} />
                </MathLabel>
              </g>
            );
          })}
          <path d="M44 208H724" className="vc-timeline" />
          <text x="20" y="254" textAnchor="middle" className="vc-label">
            解码
          </text>
          {[...gopFrames]
            .sort((left, right) => left.decoding - right.decoding)
            .map((frame, index) => {
              const x = startX + index * step;
              return (
                <g key={`decode-${frame.label}`}>
                  <rect
                    x={x - 30}
                    y="230"
                    width="60"
                    height="40"
                    rx="7"
                    className={`vc-frame vc-frame-${frame.type}`}
                  />
                  <MathLabel x={x - 30} y={233} width={60} height={34} className="vc-math-frame">
                    <InlineMath tex={frame.label} />
                  </MathLabel>
                </g>
              );
            })}
          <path d="M44 288H724" className="vc-timeline" />
          <g transform="translate(235 309)">
            {[
              ['i', 'I：帧内'],
              ['p', 'P：过去参考'],
              ['b', 'B：可双向参考'],
            ].map(([type, label], index) => (
              <g key={type} transform={`translate(${index * 145} 0)`}>
                <rect width="16" height="12" rx="2" className={`vc-frame vc-frame-${type}`} />
                <text x="23" y="11" className="vc-small">
                  {label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <figcaption>
        一种示意性 GOP：箭头从参考帧指向使用它预测的帧。B₁、B₂ 必须等 P₃ 先解码，B₄ 必须等
        P₅，因此解码顺序不同于显示顺序。实际 codec 可采用更深的层级
        B、不同参考集合或低延迟结构；图中关系不代表唯一配置。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { PredictionResidual, HybridCodec, GopTimeline };
