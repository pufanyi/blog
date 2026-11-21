import { patches } from './vit-patches.post-component';

const codecFrames = [
  { label: 'I', selected: patches.map(({ index }) => index) },
  { label: 'P₁', selected: [1, 5, 6, 9] },
  { label: 'P₂', selected: [2, 6, 10, 11] },
  { label: 'P₃', selected: [3, 7, 11, 15] },
] as const;

const packedCodecPatches = codecFrames.flatMap((frame, time) =>
  frame.selected.map((patch) => ({ kind: frame.label === 'I' ? 'i' : 'p', patch, time })),
);

function OneVisionCodec() {
  return (
    <figure className="vit-figure">
      <div className="vit-scroll">
        <svg viewBox="0 0 720 350" role="img" aria-labelledby="vit-codec-title vit-codec-desc">
          <title id="vit-codec-title">OneVision-Encoder 在 ViT 前选择视频 patch</title>
          <desc id="vit-codec-desc">
            一个视频 GOP 包含完整保留的 I-frame 和三个 P-frame。运动向量与残差能量为 P-frame 的
            patch 排序，图中每个 P-frame 只保留四个彩色位置。右侧把选中的 RGB patch
            打包为不规则序列，并保留原始时间、高度和宽度坐标。
          </desc>
          <text x="245" y="25" textAnchor="middle">
            一个 GOP 的 codec patchification（示意）
          </text>
          <rect x="108" y="43" width="274" height="42" rx="6" className="vit-codec-selector" />
          <text x="245" y="61" textAnchor="middle" className="vit-small">
            motion vector 幅值 + residual 能量
          </text>
          <text x="245" y="78" textAnchor="middle" className="vit-small">
            只为 P-frame 的 RGB patches 排序
          </text>
          {codecFrames.map((frame, time) => {
            const x = 27 + time * 116;
            return (
              <g key={frame.label}>
                <text x={x + 40} y="111" textAnchor="middle">
                  {frame.label}-frame
                </text>
                {patches.map(({ index, row, col }) => {
                  const retained = frame.selected.some((selected) => selected === index);
                  return (
                    <rect
                      key={index}
                      x={x + col * 20}
                      y={126 + row * 20}
                      width="18"
                      height="18"
                      rx="2"
                      className={
                        retained
                          ? frame.label === 'I'
                            ? 'vit-codec-intra'
                            : 'vit-codec-selected'
                          : 'vit-codec-skipped'
                      }
                    />
                  );
                })}
                <text x={x + 40} y="228" textAnchor="middle" className="vit-small">
                  {frame.selected.length}/16
                </text>
                {time > 0 && <path d={`M${x + 40} 85V119`} className="vit-inject" />}
              </g>
            );
          })}
          <path d="M485 166H525M517 160L525 166L517 172" className="vit-arrow" />
          <rect x="528" y="106" width="166" height="147" rx="7" className="vit-codec-pack" />
          <text x="611" y="129" textAnchor="middle">
            稀疏 ViT 输入
          </text>
          {packedCodecPatches.map(({ kind, patch, time }, index) => (
            <rect
              key={`${time}-${patch}`}
              x={548 + (index % 7) * 19}
              y={143 + Math.floor(index / 7) * 19}
              width="15"
              height="15"
              rx="2"
              className={kind === 'i' ? 'vit-codec-intra' : 'vit-codec-selected'}
            />
          ))}
          <text x="611" y="237" textAnchor="middle" className="vit-small">
            每块保留 (t, h, w)
          </text>
          <path d="M67 244V277H611V259" className="vit-arrow" />
          <text x="340" y="303" textAnchor="middle">
            I-frame 提供完整底图；P-frame 只补充变化区域
          </text>
          <text x="340" y="329" textAnchor="middle" className="vit-small">
            序列相邻不等于时空相邻，3D RoPE 使用原坐标计算相对位移
          </text>
        </svg>
      </div>
      <figcaption>
        图中用 4 × 4 网格和单个 GOP 展示数据流，保留比例仅为示意。I-frame 的所有位置和各 P-frame
        选中的位置都以解码后 RGB patch 进入 ViT；motion vector 与 residual
        只参与选择。右侧序列由同一组选中位置生成，并携带原始三维坐标。
      </figcaption>
    </figure>
  );
}

const compressionExample = {
  side: 448,
  patchSize: 14,
  depth: 27,
  firstBlocks: 7,
};
const compressionPatchCount = (compressionExample.side / compressionExample.patchSize) ** 2;
const compressionRows = [
  { mode: '4×', earlyMerge: false, y: 85 },
  { mode: '16×', earlyMerge: true, y: 240 },
] as const;

function MiniCPMCompression() {
  return (
    <figure className="vit-figure">
      <div className="vit-scroll vit-compression">
        <svg
          viewBox="0 0 800 395"
          role="img"
          aria-labelledby="vit-compression-title vit-compression-desc"
        >
          <title id="vit-compression-title">MiniCPM-V 4.6 的两种压缩模式</title>
          <desc id="vit-compression-desc">
            {`同一张处理后为 ${compressionExample.side} 像素见方的视图，在 patch size 为 ${compressionExample.patchSize} 时产生 ${compressionPatchCount} 个位置。4 倍模式的全部 ${compressionExample.depth} 个视觉 blocks 都处理这些位置，最后合并为 ${compressionPatchCount / 4} 个 LLM tokens。16 倍模式先运行 ${compressionExample.firstBlocks} 个 blocks，在内部压到 ${compressionPatchCount / 4} 个位置，再运行余下 ${compressionExample.depth - compressionExample.firstBlocks} 个 blocks，最后合并为 ${compressionPatchCount / 16} 个 LLM tokens。`}
          </desc>
          <text x="400" y="28" textAnchor="middle">
            同一视图：{compressionExample.side} × {compressionExample.side}，输入{' '}
            {compressionPatchCount} 个 patch
          </text>
          {compressionRows.map(({ mode, earlyMerge, y }) => {
            const laterTokens = compressionPatchCount / (earlyMerge ? 4 : 1);
            const outputTokens = laterTokens / 4;
            return (
              <g key={mode}>
                <text x="30" y={y - 15}>
                  {mode} 模式
                </text>
                {earlyMerge ? (
                  <>
                    <rect x="30" y={y} width="150" height="68" rx="6" className="vit-token" />
                    <text x="105" y={y + 26} textAnchor="middle">
                      前 {compressionExample.firstBlocks} 个 blocks
                    </text>
                    <text x="105" y={y + 51} textAnchor="middle">
                      {compressionPatchCount} 个位置
                    </text>
                    <path
                      d={`M180 ${y + 34}H208M200 ${y + 29}L208 ${y + 34}L200 ${y + 39}`}
                      className="vit-arrow"
                    />
                    <rect x="210" y={y} width="125" height="68" rx="6" className="vit-group-0" />
                    <text x="272.5" y={y + 26} textAnchor="middle">
                      内部合并
                    </text>
                    <text x="272.5" y={y + 51} textAnchor="middle">
                      {compressionPatchCount} → {laterTokens}
                    </text>
                    <path
                      d={`M335 ${y + 34}H363M355 ${y + 29}L363 ${y + 34}L355 ${y + 39}`}
                      className="vit-arrow"
                    />
                    <rect x="365" y={y} width="150" height="68" rx="6" className="vit-group-0" />
                    <text x="440" y={y + 26} textAnchor="middle">
                      后 {compressionExample.depth - compressionExample.firstBlocks} 个 blocks
                    </text>
                    <text x="440" y={y + 51} textAnchor="middle">
                      {laterTokens} 个位置
                    </text>
                  </>
                ) : (
                  <>
                    <rect x="30" y={y} width="485" height="68" rx="6" className="vit-token" />
                    <text x="272.5" y={y + 26} textAnchor="middle">
                      ViT：全部 {compressionExample.depth} 个 blocks
                    </text>
                    <text x="272.5" y={y + 51} textAnchor="middle">
                      每层都保留 {compressionPatchCount} 个位置
                    </text>
                  </>
                )}
                <path
                  d={`M515 ${y + 34}H543M535 ${y + 29}L543 ${y + 34}L535 ${y + 39}`}
                  className="vit-arrow"
                />
                <rect x="545" y={y} width="125" height="68" rx="6" className="vit-group-3" />
                <text x="607.5" y={y + 26} textAnchor="middle">
                  输出合并
                </text>
                <text x="607.5" y={y + 51} textAnchor="middle">
                  {laterTokens} → {outputTokens}
                </text>
                <path
                  d={`M670 ${y + 34}H698M690 ${y + 29}L698 ${y + 34}L690 ${y + 39}`}
                  className="vit-arrow"
                />
                <text x="745" y={y + 26} textAnchor="middle">
                  LLM
                </text>
                <text x="745" y={y + 51} textAnchor="middle">
                  {outputTokens} tokens
                </text>
              </g>
            );
          })}
          <text x="400" y="365" textAnchor="middle">
            内部合并同时减轻后续 ViT 与 LLM 的负担；输出合并只影响下游
          </text>
        </svg>
      </div>
      <figcaption>
        {`根据 MiniCPM-V 4.6 配置与实现绘制，固定同一个 ${compressionExample.side} × ${compressionExample.side} 输入视图，只计空间特征位置。16× 模式在零起始索引 6 的 block 后合并，因此是前 ${compressionExample.firstBlocks} 层保持密网格、后 ${compressionExample.depth - compressionExample.firstBlocks} 层使用较短序列；4× 模式跳过这次内部合并。图中数量不包含文字、边界 token 或额外视图。`}
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = {
  OneVisionCodec,
  MiniCPMCompression,
};
