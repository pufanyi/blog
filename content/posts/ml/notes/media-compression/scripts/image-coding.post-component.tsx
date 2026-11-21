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
        同一个 {String.raw`\(2\times2\)`} 区域：YCbCr 只是重排颜色信息；4:2:0 才把 12 个 samples
        减到 6 个。图中共享关系是采样结构示意，不规定具体的 chroma siting 或上采样 filter。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = {
  LosslessPrediction,
  ChromaSampling,
};
