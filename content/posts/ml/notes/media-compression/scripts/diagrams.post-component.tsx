const predictionSource = [52, 53, 54, 55, 55, 56, 57, 57] as const;
const predictionResidual = predictionSource.map((value, index) =>
  index === 0 ? value : value - predictionSource[index - 1],
);
const residualCounts = [...new Set(predictionResidual)].map((value) => ({
  value,
  count: predictionResidual.filter((candidate) => candidate === value).length,
}));

function LosslessPrediction() {
  return (
    <figure className="ic-figure">
      <div className="ic-scroll">
        <svg
          viewBox="0 0 820 330"
          role="img"
          aria-labelledby="ic-prediction-title ic-prediction-description"
        >
          <title id="ic-prediction-title">一行像素经过左侧预测变成 residual</title>
          <desc id="ic-prediction-description">
            原始像素为 52 到 57。第一个值原样保存，后续值减去左邻居后，五个 residual 为 1，两个为
            0，decoder 用逐项相加精确重建原行。
          </desc>

          <text x="36" y="34" className="ic-heading">
            原始像素 x
          </text>
          {predictionSource.map((value, index) => (
            <g key={`source-${index}`}>
              <rect
                x={36 + index * 58}
                y="52"
                width="52"
                height="42"
                rx="5"
                className="ic-cell ic-source"
              />
              <text x={62 + index * 58} y="78" textAnchor="middle" className="ic-number">
                {value}
              </text>
            </g>
          ))}

          <path d="M262 104v35" className="ic-arrow" markerEnd="url(#ic-prediction-arrow)" />
          <text x="280" y="126" className="ic-small">
            首项原样；其后减左邻居
          </text>

          <text x="36" y="160" className="ic-heading">
            residual e
          </text>
          {predictionResidual.map((value, index) => (
            <g key={`residual-${index}`}>
              <rect
                x={36 + index * 58}
                y="178"
                width="52"
                height="42"
                rx="5"
                className={`ic-cell ${index === 0 ? 'ic-side' : 'ic-residual'}`}
              />
              <text x={62 + index * 58} y="204" textAnchor="middle" className="ic-number">
                {value}
              </text>
            </g>
          ))}

          <g transform="translate(544 40)">
            <text x="104" y="0" textAnchor="middle" className="ic-heading">
              residual 频数
            </text>
            <path d="M18 152V24M18 152H210" className="ic-axis" />
            {residualCounts.map(({ value, count }, index) => {
              const height = count * 22;
              return (
                <g key={`count-${value}`} transform={`translate(${42 + index * 54} 0)`}>
                  <rect y={152 - height} width="34" height={height} rx="4" className="ic-bar" />
                  <text x="17" y={144 - height} textAnchor="middle" className="ic-small">
                    {count} 次
                  </text>
                  <text x="17" y="174" textAnchor="middle" className="ic-number">
                    {value}
                  </text>
                </g>
              );
            })}
            <text x="112" y="199" textAnchor="middle" className="ic-small">
              常见符号可分配更短的 code
            </text>
          </g>

          <path d="M492 232v48H62v-48" className="ic-reconstruction" />
          <text x="277" y="303" textAnchor="middle" className="ic-label">
            decoder：x̂₀=e₀，x̂ᵢ=x̂ᵢ₋₁+eᵢ → 精确恢复
          </text>
          <defs>
            <marker
              id="ic-prediction-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0 10 5 0 10Z" className="ic-arrow-head" />
            </marker>
          </defs>
        </svg>
      </div>
      <figcaption>
        Prediction 没有删除任何元素，而是把分布集中到 0 和 1；entropy coding 才利用频数差异减少
        bits。首项 52 是建立预测所需的 side information，在更大图像中会被许多后续样本摊薄。
      </figcaption>
    </figure>
  );
}

const sampleChannels = ['0', '1', '2'] as const;

function FullColorGrid({ x, channelPrefix }: { x: number; channelPrefix: 'rgb' | 'ycc' }) {
  return (
    <g transform={`translate(${x} 84)`}>
      {[0, 1, 2, 3].map((pixel) => {
        const row = Math.floor(pixel / 2);
        const column = pixel % 2;
        return (
          <g key={`${channelPrefix}-${pixel}`} transform={`translate(${column * 82} ${row * 72})`}>
            <rect width="72" height="62" rx="6" className="ic-pixel" />
            {sampleChannels.map((channel, channelIndex) => (
              <rect
                key={`${channelPrefix}-${pixel}-${channel}`}
                x={9 + channelIndex * 19}
                y="14"
                width="15"
                height="34"
                rx="3"
                className={`ic-channel ic-${channelPrefix}-${channel}`}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function ChromaSampling() {
  return (
    <figure className="ic-figure">
      <div className="ic-scroll">
        <svg
          viewBox="0 0 850 330"
          role="img"
          aria-labelledby="ic-chroma-title ic-chroma-description"
        >
          <title id="ic-chroma-title">RGB、YCbCr 4:4:4 与 YCbCr 4:2:0 的样本数量</title>
          <desc id="ic-chroma-description">
            一个 2 乘 2 区域在 RGB 和 YCbCr 4:4:4 中都有 12 个样本；4:2:0
            保留四个亮度样本，只共享两个色度样本，共六个。
          </desc>

          <g transform="translate(28 0)">
            <text x="82" y="34" textAnchor="middle" className="ic-heading">
              RGB
            </text>
            <text x="82" y="58" textAnchor="middle" className="ic-small">
              每像素 R + G + B
            </text>
            <FullColorGrid x={0} channelPrefix="rgb" />
            <text x="82" y="258" textAnchor="middle" className="ic-label">
              4 × 3 = 12 samples
            </text>
          </g>

          <path d="M209 164h49" className="ic-arrow" markerEnd="url(#ic-chroma-arrow)" />
          <text x="234" y="147" textAnchor="middle" className="ic-small">
            color transform
          </text>

          <g transform="translate(284 0)">
            <text x="82" y="34" textAnchor="middle" className="ic-heading">
              YCbCr 4:4:4
            </text>
            <text x="82" y="58" textAnchor="middle" className="ic-small">
              每像素 Y + Cb + Cr
            </text>
            <FullColorGrid x={0} channelPrefix="ycc" />
            <text x="82" y="258" textAnchor="middle" className="ic-label">
              4 × 3 = 12 samples
            </text>
          </g>

          <path
            d="M465 164h49"
            className="ic-arrow ic-lossy-arrow"
            markerEnd="url(#ic-chroma-arrow)"
          />
          <text x="490" y="139" textAnchor="middle" className="ic-small">
            chroma
          </text>
          <text x="490" y="153" textAnchor="middle" className="ic-small">
            subsampling
          </text>

          <g transform="translate(540 0)">
            <text x="126" y="34" textAnchor="middle" className="ic-heading">
              YCbCr 4:2:0
            </text>
            <text x="126" y="58" textAnchor="middle" className="ic-small">
              四个 Y，共享一组 Cb / Cr
            </text>
            <g transform="translate(0 84)">
              {[0, 1, 2, 3].map((pixel) => {
                const row = Math.floor(pixel / 2);
                const column = pixel % 2;
                return (
                  <g key={`luma-${pixel}`} transform={`translate(${column * 82} ${row * 72})`}>
                    <rect width="72" height="62" rx="6" className="ic-pixel" />
                    <rect
                      x="24"
                      y="14"
                      width="24"
                      height="34"
                      rx="4"
                      className="ic-channel ic-ycc-0"
                    />
                    <text x="36" y="37" textAnchor="middle" className="ic-channel-label">
                      Y
                    </text>
                  </g>
                );
              })}
              <path d="M173 4v130" className="ic-share" />
              <rect x="194" y="28" width="34" height="40" rx="5" className="ic-channel ic-ycc-1" />
              <rect x="194" y="80" width="34" height="40" rx="5" className="ic-channel ic-ycc-2" />
              <text x="211" y="53" textAnchor="middle" className="ic-channel-label">
                Cb
              </text>
              <text x="211" y="105" textAnchor="middle" className="ic-channel-label">
                Cr
              </text>
            </g>
            <text x="126" y="258" textAnchor="middle" className="ic-label">
              4 + 1 + 1 = 6 samples
            </text>
          </g>

          <g transform="translate(233 291)">
            <rect width="384" height="25" rx="12" className="ic-lossy-tag" />
            <text x="192" y="17" textAnchor="middle" className="ic-small">
              坐标变换不减样本；4:2:0 才在这里丢掉空间色度信息
            </text>
          </g>
          <defs>
            <marker
              id="ic-chroma-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0 10 5 0 10Z" className="ic-arrow-head" />
            </marker>
          </defs>
        </svg>
      </div>
      <figcaption>
        同一个 $2\times2$ 区域：YCbCr 只是重排颜色信息；4:2:0 才把 12 个 samples 减到 6
        个。图中共享关系是采样结构示意，不规定具体的 chroma siting 或上采样 filter。
      </figcaption>
    </figure>
  );
}

const transformSize = 4 as const;
const transformSource = [
  82, 83, 84, 86, 82, 84, 87, 91, 83, 86, 96, 108, 84, 88, 110, 140,
] as const;
const quantizationTable = [4, 4, 6, 8, 4, 6, 8, 10, 6, 8, 10, 12, 8, 10, 12, 16] as const;

function dctScale(index: number) {
  return index === 0 ? Math.sqrt(1 / transformSize) : Math.sqrt(2 / transformSize);
}

function dct2(values: readonly number[]) {
  return Array.from({ length: transformSize * transformSize }, (_, index) => {
    const u = Math.floor(index / transformSize);
    const v = index % transformSize;
    let sum = 0;
    for (let x = 0; x < transformSize; x += 1) {
      for (let y = 0; y < transformSize; y += 1) {
        sum +=
          (values[x * transformSize + y] - 128) *
          Math.cos(((2 * x + 1) * u * Math.PI) / (2 * transformSize)) *
          Math.cos(((2 * y + 1) * v * Math.PI) / (2 * transformSize));
      }
    }
    return dctScale(u) * dctScale(v) * sum;
  });
}

function inverseDct2(coefficients: readonly number[]) {
  return Array.from({ length: transformSize * transformSize }, (_, index) => {
    const x = Math.floor(index / transformSize);
    const y = index % transformSize;
    let sum = 0;
    for (let u = 0; u < transformSize; u += 1) {
      for (let v = 0; v < transformSize; v += 1) {
        sum +=
          dctScale(u) *
          dctScale(v) *
          coefficients[u * transformSize + v] *
          Math.cos(((2 * x + 1) * u * Math.PI) / (2 * transformSize)) *
          Math.cos(((2 * y + 1) * v * Math.PI) / (2 * transformSize));
      }
    }
    return Math.max(0, Math.min(255, Math.round(sum + 128)));
  });
}

const transformCoefficients = dct2(transformSource);
const quantizedCoefficients = transformCoefficients.map((value, index) =>
  Math.round(value / quantizationTable[index]),
);
const dequantizedCoefficients = quantizedCoefficients.map(
  (value, index) => value * quantizationTable[index],
);
const reconstructedSource = inverseDct2(dequantizedCoefficients);
const zeroCoefficients = quantizedCoefficients.filter((value) => value === 0).length;
const reconstructionMse =
  transformSource.reduce(
    (sum, value, index) => sum + (value - reconstructedSource[index]) ** 2,
    0,
  ) / transformSource.length;

function Matrix({
  x,
  label,
  values,
  kind,
}: {
  x: number;
  label: string;
  values: readonly number[];
  kind: 'source' | 'coefficient' | 'quantized' | 'reconstructed';
}) {
  const cellSize = 34;
  return (
    <g>
      <text x={x + 2 * cellSize} y="43" textAnchor="middle" className="ic-heading">
        {label}
      </text>
      {values.map((value, index) => {
        const row = Math.floor(index / transformSize);
        const column = index % transformSize;
        return (
          <g key={`${kind}-${row}-${column}`}>
            <rect
              x={x + column * cellSize}
              y={72 + row * cellSize}
              width={cellSize}
              height={cellSize}
              className={`ic-matrix-cell ic-${kind}${kind === 'quantized' && value === 0 ? ' ic-zero' : ''}`}
            />
            <text
              x={x + column * cellSize + cellSize / 2}
              y={72 + row * cellSize + 22}
              textAnchor="middle"
              className="ic-matrix-number"
            >
              {Math.round(value)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function TransformQuantization() {
  return (
    <figure className="ic-figure">
      <div className="ic-scroll">
        <svg
          viewBox="0 0 920 360"
          role="img"
          aria-labelledby="ic-transform-title ic-transform-description"
        >
          <title id="ic-transform-title">四乘四像素块的 DCT、量化与重建</title>
          <desc id="ic-transform-description">
            十六个源像素经过 DCT
            后仍有十六个系数。逐频率量化使其中多个系数变成零，逆变换得到略有不同的十六个重建像素。
          </desc>
          <Matrix x={18} label="像素 x" values={transformSource} kind="source" />
          <Matrix
            x={250}
            label="DCT C（四舍五入显示）"
            values={transformCoefficients}
            kind="coefficient"
          />
          <Matrix x={496} label="量化 q" values={quantizedCoefficients} kind="quantized" />
          <Matrix x={754} label="重建 x̂" values={reconstructedSource} kind="reconstructed" />

          <path d="M164 140h68" className="ic-arrow" markerEnd="url(#ic-transform-arrow)" />
          <text x="198" y="124" textAnchor="middle" className="ic-small">
            DCT
          </text>
          <path
            d="M396 140h82"
            className="ic-arrow ic-lossy-arrow"
            markerEnd="url(#ic-transform-arrow)"
          />
          <text x="437" y="112" textAnchor="middle" className="ic-small">
            q=round(C/Q)
          </text>
          <text x="437" y="128" textAnchor="middle" className="ic-loss-label">
            有损
          </text>
          <path d="M642 140h94" className="ic-arrow" markerEnd="url(#ic-transform-arrow)" />
          <text x="689" y="112" textAnchor="middle" className="ic-small">
            ×Q, IDCT
          </text>

          <g transform="translate(123 255)">
            <rect width="674" height="67" rx="10" className="ic-summary" />
            <text x="337" y="25" textAnchor="middle" className="ic-label">
              DCT：16 pixels → 16 coefficients；量化后 {zeroCoefficients}/16 为零
            </text>
            <text x="337" y="49" textAnchor="middle" className="ic-small">
              本例重建 MSE = {reconstructionMse.toFixed(2)}；改变 Q 会同时改变 rate 与 distortion
            </text>
          </g>
          <defs>
            <marker
              id="ic-transform-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0 10 5 0 10Z" className="ic-arrow-head" />
            </marker>
          </defs>
        </svg>
      </div>
      <figcaption>
        一个真实计算的微型例子。DCT 集中能量但不减少数量；frequency-dependent quantization
        产生零和不可逆误差，后续扫描与 entropy coding 才能用短 bitstream 表示这些零。
      </figcaption>
    </figure>
  );
}

const encoderStages = [
  { label: 'Media samples', detail: '像素 / PCM / 帧', kind: 'source' },
  { label: '表示 / 分块', detail: '颜色、声道、时间', kind: 'color' },
  { label: '预测 / 变换', detail: '集中相关性', kind: 'transform' },
  { label: '量化', detail: '控制失真', kind: 'lossy' },
  { label: '熵编码', detail: '概率 → bits', kind: 'entropy' },
] as const;

function MediaCodecPipeline() {
  return (
    <figure className="ic-figure">
      <div className="ic-scroll">
        <svg
          viewBox="0 0 900 360"
          role="img"
          aria-labelledby="ic-pipeline-title ic-pipeline-description"
        >
          <title id="ic-pipeline-title">图像、音频与视频共享的编码和解码管线</title>
          <desc id="ic-pipeline-description">
            编码器依次选择媒体表示和分块，进行预测或变换、量化与熵编码。解码器反向熵解码、反量化、逆变换并重建媒体
            samples；量化和某些降采样是有损边界。
          </desc>
          <text x="30" y="38" className="ic-heading">
            Encoder：让分布更集中，再决定舍弃多少
          </text>
          {encoderStages.map((stage, index) => {
            const x = 28 + index * 174;
            return (
              <g key={stage.label}>
                <rect
                  x={x}
                  y="64"
                  width="142"
                  height="76"
                  rx="9"
                  className={`ic-stage ic-stage-${stage.kind}`}
                />
                <text x={x + 71} y="94" textAnchor="middle" className="ic-label">
                  {stage.label}
                </text>
                <text x={x + 71} y="119" textAnchor="middle" className="ic-small">
                  {stage.detail}
                </text>
                {index < encoderStages.length - 1 && (
                  <path
                    d={`M${x + 142} 102h28`}
                    className="ic-arrow"
                    markerEnd="url(#ic-pipeline-arrow)"
                  />
                )}
              </g>
            );
          })}

          <path d="M795 140v78" className="ic-bitstream" markerEnd="url(#ic-pipeline-arrow)" />
          <text x="777" y="184" textAnchor="end" className="ic-small">
            bitstream
          </text>

          {[
            ['重建 samples', '播放 / 显示'],
            ['表示还原', '颜色 / 声道 / 分块'],
            ['逆变换', '合成 / 加回预测'],
            ['反量化', 'q × Q'],
            ['熵解码', 'bits → symbols'],
          ].map(([label, detail], index) => {
            const x = 28 + index * 174;
            return (
              <g key={label}>
                <rect
                  x={x}
                  y="218"
                  width="142"
                  height="76"
                  rx="9"
                  className="ic-stage ic-decoder-stage"
                />
                <text x={x + 71} y="248" textAnchor="middle" className="ic-label">
                  {label}
                </text>
                <text x={x + 71} y="273" textAnchor="middle" className="ic-small">
                  {detail}
                </text>
                {index > 0 && (
                  <path
                    d={`M${x} 256h-28`}
                    className="ic-arrow"
                    markerEnd="url(#ic-pipeline-arrow)"
                  />
                )}
              </g>
            );
          })}

          <g transform="translate(241 320)">
            <rect width="418" height="25" rx="12" className="ic-lossy-tag" />
            <text x="209" y="17" textAnchor="middle" className="ic-small">
              常见有损边界：subsampling 与 quantization；entropy coding 可逆
            </text>
          </g>
          <defs>
            <marker
              id="ic-pipeline-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0 10 5 0 10Z" className="ic-arrow-head" />
            </marker>
          </defs>
        </svg>
      </div>
      <figcaption>
        图像、音频和视频可以共享同一份双向账本。Decoder 不会猜 encoder 的选择；bitstream
        携带必要参数与量化后的符号。具体 codec 可以省略、合并或重新排列部分阶段。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = {
  LosslessPrediction,
  ChromaSampling,
  TransformQuantization,
  MediaCodecPipeline,
};
