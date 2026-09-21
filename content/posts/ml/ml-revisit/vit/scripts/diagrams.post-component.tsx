const patches = Array.from({ length: 16 }, (_, index) => ({
  index,
  row: Math.floor(index / 4),
  col: index % 4,
}));

const DOG_IMAGE = '/assets/examples/dog.avif';

function Scene() {
  return <image href={DOG_IMAGE} width="160" height="160" />;
}

function ViTPatches() {
  return (
    <figure className="vit-figure">
      <div className="vit-scroll">
        <svg viewBox="0 0 720 295" role="img" aria-labelledby="vit-patches-title vit-patches-desc">
          <title id="vit-patches-title">同一幅图像从二维 patch 网格展平为序列</title>
          <desc id="vit-patches-desc">
            一张小狗图像被切成四行四列。右侧十六块来自同一幅图的对应位置，按行展开后再分别投影成向量。
          </desc>
          <defs>
            <clipPath id="vit-patch-clip">
              <rect width="40" height="40" />
            </clipPath>
          </defs>
          <text x="110" y="27" textAnchor="middle">
            图像与 patch 网格
          </text>
          <g transform="translate(30 55)">
            <Scene />
            {patches.map(({ index, col, row }) => (
              <rect
                key={index}
                x={col * 40}
                y={row * 40}
                width="40"
                height="40"
                className="vit-grid"
              />
            ))}
          </g>
          <path d="M207 132H249M239 126L249 132L239 138" className="vit-arrow" />
          <text x="465" y="27" textAnchor="middle">
            按行展平，保留每块内部的像素
          </text>
          {patches.map(({ index, col, row }) => (
            <g key={index} transform={`translate(${270 + index * 26} 75)`}>
              <svg width="24" height="60" viewBox="0 0 40 40" aria-hidden="true">
                <g clipPath="url(#vit-patch-clip)">
                  <g transform={`translate(${-col * 40} ${-row * 40})`}>
                    <Scene />
                  </g>
                </g>
                <rect width="40" height="40" className="vit-grid" />
              </svg>
              <text x="12" y="80" textAnchor="middle" className="vit-small">
                {index + 1}
              </text>
              <path d="M12 92V112M7 105L12 112L17 105" className="vit-arrow" />
              <rect x="3" y="122" width="18" height="43" rx="3" className="vit-token" />
            </g>
          ))}
          <text x="470" y="270" textAnchor="middle">
            共享投影 → 16 个 patch embeddings
          </text>
        </svg>
      </div>
      <figcaption>
        图中只切成 4 × 4
        块来展示对应关系；每个小块直接取自左侧的小狗图像，下方方柱表示投影后的向量，并非真实模型输出。相邻轮廓会落在不同
        patch 中，需要后续交换信息并利用位置重新建立联系。
      </figcaption>
    </figure>
  );
}

function ViTMerge() {
  return (
    <figure className="vit-figure">
      <div className="vit-scroll">
        <svg viewBox="0 0 720 270" role="img" aria-labelledby="vit-merge-title vit-merge-desc">
          <title id="vit-merge-title">相邻特征合并改变空间位置数与通道数</title>
          <desc id="vit-merge-desc">
            四行四列的十六个特征按相邻二乘二区域分成 A、B、C、D 四组。每组四个向量先沿通道拼接，再经
            MLP 得到一个向量，最后恢复为二行二列。组内相对位置在拼接时保留。
          </desc>
          <text x="115" y="26" textAnchor="middle">
            16 个空间位置
          </text>
          {patches.map(({ index, row, col }) => {
            const group = Math.floor(row / 2) * 2 + Math.floor(col / 2);
            const within = (row % 2) * 2 + (col % 2) + 1;
            return (
              <g key={index}>
                <rect
                  x={30 + col * 43}
                  y={48 + row * 43}
                  width="39"
                  height="39"
                  rx="4"
                  className={`vit-group-${group}`}
                />
                <text x={49.5 + col * 43} y={73 + row * 43} textAnchor="middle">
                  {String.fromCharCode(65 + group)}
                  {within}
                </text>
              </g>
            );
          })}
          <path d="M216 130H252M242 124L252 130L242 136" className="vit-arrow" />
          <text x="351" y="26" textAnchor="middle">
            每组沿通道拼接
          </text>
          {[0, 1, 2, 3].map((group) => (
            <g key={group}>
              {[1, 2, 3, 4].map((within) => (
                <g key={within}>
                  <rect
                    x={269 + (within - 1) * 43}
                    y={48 + group * 43}
                    width="40"
                    height="36"
                    rx="3"
                    className={`vit-group-${group}`}
                  />
                  <text x={289 + (within - 1) * 43} y={72 + group * 43} textAnchor="middle">
                    {String.fromCharCode(65 + group)}
                    {within}
                  </text>
                </g>
              ))}
            </g>
          ))}
          <path d="M449 130H531M521 124L531 130L521 136" className="vit-arrow" />
          <text x="490" y="111" textAnchor="middle">
            MLP
          </text>
          <text x="615" y="26" textAnchor="middle">
            4 个空间位置
          </text>
          {[0, 1, 2, 3].map((group) => (
            <g key={group}>
              <rect
                x={551 + (group % 2) * 65}
                y={69 + Math.floor(group / 2) * 65}
                width="59"
                height="59"
                rx="5"
                className={`vit-group-${group}`}
              />
              <text
                x={580.5 + (group % 2) * 65}
                y={104 + Math.floor(group / 2) * 65}
                textAnchor="middle"
              >
                {String.fromCharCode(65 + group)}
              </text>
            </g>
          ))}
          <text x="360" y="252" textAnchor="middle">
            位置数量减少到 1/4；每个输出仍对应一个空间区域
          </text>
        </svg>
      </div>
      <figcaption>
        每个 2 × 2 邻域先拼接四份通道，再学习投影。A1–A4 的次序保留组内布局；输出 A–D
        保留组间布局。此操作发生在 encoder 之后时，前面的 ViT 仍计算了全部 16 个位置。
      </figcaption>
    </figure>
  );
}

const deepStackLevels = [8, 16, 24] as const;

function ViTDeepStack() {
  return (
    <figure className="vit-figure">
      <div className="vit-scroll">
        <svg viewBox="0 0 720 445" role="img" aria-labelledby="vit-stack-title vit-stack-desc">
          <title id="vit-stack-title">Qwen3-VL-8B 的最终层输入与三路 DeepStack 注入</title>
          <desc id="vit-stack-desc">
            左列是视觉 encoder 的第 9、17、25、27 层；第 27 层经主 merger 产生 LLM 输入视觉
            token。前三个抽取层分别经过独立 merger，把特征加到右列 LLM 的第 1、2、3
            层对应视觉位置。实线表示主要数据流，虚线表示额外注入；所有注入复用同一组位置。
          </desc>
          <text x="129" y="24" textAnchor="middle">
            视觉 encoder
          </text>
          <text x="572" y="24" textAnchor="middle">
            LLM 的视觉位置
          </text>
          <rect x="500" y="40" width="150" height="38" rx="5" className="vit-token" />
          <text x="575" y="65" textAnchor="middle">
            输入视觉 tokens
          </text>
          <path d="M575 78V110M570 102L575 110L580 102" className="vit-arrow" />
          {deepStackLevels.map((index, level) => {
            const y = 110 + level * 78;
            return (
              <g key={index}>
                <rect x="64" y={y} width="132" height="38" rx="5" className="vit-token" />
                <text x="130" y={y + 25} textAnchor="middle">
                  ViT 第 {index + 1} 层
                </text>
                <path
                  d={`M130 ${y + 38}V${y + 78}M125 ${y + 70}L130 ${y + 78}L135 ${y + 70}`}
                  className="vit-arrow"
                />
                <path
                  d={`M196 ${y + 19}H279M271 ${y + 14}L279 ${y + 19}L271 ${y + 24}`}
                  className="vit-inject"
                />
                <rect
                  x="280"
                  y={y}
                  width="115"
                  height="38"
                  rx="5"
                  className={`vit-group-${level}`}
                />
                <text x="337.5" y={y + 25} textAnchor="middle">
                  merger {level + 1}
                </text>
                <path
                  d={`M395 ${y + 19}H499M491 ${y + 14}L499 ${y + 19}L491 ${y + 24}`}
                  className="vit-inject"
                />
                <rect x="500" y={y} width="150" height="38" rx="5" className="vit-token" />
                <text x="575" y={y + 25} textAnchor="middle">
                  第 {level + 1} 层 + 注入
                </text>
                {level < 2 && (
                  <path
                    d={`M575 ${y + 38}V${y + 78}M570 ${y + 70}L575 ${y + 78}L580 ${y + 70}`}
                    className="vit-arrow"
                  />
                )}
              </g>
            );
          })}
          <rect x="64" y="344" width="132" height="38" rx="5" className="vit-token" />
          <text x="130" y="369" textAnchor="middle">
            ViT 第 27 层
          </text>
          <path d="M196 363H280M272 358L280 363L272 368" className="vit-arrow" />
          <rect x="280" y="344" width="115" height="38" rx="5" className="vit-token" />
          <text x="337.5" y="369" textAnchor="middle">
            主 merger
          </text>
          <path d="M395 363H688V59H650M658 54L650 59L658 64" className="vit-arrow" />
          <text x="360" y="420" textAnchor="middle">
            主路径提供输入；三路额外特征在已有位置上相加
          </text>
        </svg>
      </div>
      <figcaption>
        根据 Qwen3-VL 报告与 8B 配置绘制。配置索引 8、16、24 是从零计数的第 9、17、25 层。
        图中省略未抽取的 ViT 层、文字位置及后续 LLM 层。每个 merger 都对齐空间位置与语言 hidden
        dimension；虚线补充特征，不延长序列。
      </figcaption>
    </figure>
  );
}

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

export const POST_COMPONENTS = { ViTPatches, ViTMerge, ViTDeepStack, OneVisionCodec };
