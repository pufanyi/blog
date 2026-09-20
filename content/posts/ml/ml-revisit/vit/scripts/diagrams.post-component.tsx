const patches = Array.from({ length: 16 }, (_, index) => ({
  index,
  row: Math.floor(index / 4),
  col: index % 4,
}));

function Scene() {
  return (
    <g>
      <rect width="160" height="160" className="vit-menu-paper" />
      <rect x="8" y="8" width="144" height="31" rx="3" className="vit-token" />
      <text x="80" y="30" textAnchor="middle" className="vit-menu-title">
        MENU
      </text>
      {[
        ['SOUP', '12'],
        ['RICE', '18'],
        ['FISH', '24'],
      ].map(([name, price], index) => (
        <g key={name}>
          <text x="14" y={66 + index * 33} className="vit-menu-label">
            {name}
          </text>
          <text x="145" y={66 + index * 33} textAnchor="end" className="vit-menu-label">
            {price}
          </text>
          <path d={`M12 ${75 + index * 33}H148`} className="vit-menu-rule" />
        </g>
      ))}
    </g>
  );
}

function ViTPatches() {
  return (
    <figure className="vit-figure">
      <div className="vit-scroll">
        <svg viewBox="0 0 720 295" role="img" aria-labelledby="vit-patches-title vit-patches-desc">
          <title id="vit-patches-title">同一幅图像从二维 patch 网格展平为序列</title>
          <desc id="vit-patches-desc">
            一张含 SOUP 12、RICE 18、FISH 24
            的示意菜单被切成四行四列。右侧十六块来自同一幅图的对应位置，再分别投影成向量。第二行菜品的价格是
            18，但它与菜名分布在不同 patch 中。
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
        这张示意菜单的第二行菜品是 RICE，目标答案是 18。图中只切成 4 × 4
        块来展示对应关系；每个小块直接取自左图，下方方柱表示投影后的向量，并非真实模型输出。菜名与价格跨越不同
        patch，需要后续交换信息并利用位置建立联系。
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

export const POST_COMPONENTS = { ViTPatches, ViTMerge, ViTDeepStack };
