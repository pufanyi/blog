import {
  quantizedCoefficients,
  reconstructedSource,
  reconstructionMse,
  transformCoefficients,
  transformSize,
  transformSource,
  zeroCoefficients,
} from './dct-model';

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
  TransformQuantization,
  MediaCodecPipeline,
};
