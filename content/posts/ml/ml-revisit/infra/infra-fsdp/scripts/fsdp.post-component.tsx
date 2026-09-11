export const FSDP_PARAMETERS = [
  { name: 'W1', rows: 4, columns: 2, tone: 'blue' },
  { name: 'W2', rows: 4, columns: 2, tone: 'lavender' },
  { name: 'W3', rows: 4, columns: 2, tone: 'teal' },
] as const;
const RANKS = [0, 1] as const;
type Version = 1 | 2;
type Parameter = (typeof FSDP_PARAMETERS)[number];

// Both layouts partition the same elements; only the partition boundary differs.
const ELEMENTS = FSDP_PARAMETERS.flatMap((parameter) =>
  Array.from({ length: parameter.rows * parameter.columns }, (_, index) => ({
    parameter: parameter.name,
    index,
    row: Math.floor(index / parameter.columns),
    tone: parameter.tone,
  })),
);

export function fsdpLocalElements(version: Version, rank: number) {
  return ELEMENTS.filter((element, offset) => {
    if (version === 1) return Math.floor(offset / (ELEMENTS.length / RANKS.length)) === rank;
    const parameter = FSDP_PARAMETERS.find(({ name }) => name === element.parameter)!;
    return Math.floor(element.row / (parameter.rows / RANKS.length)) === rank;
  });
}

function Matrix({ parameter, x, y, cell, local = false, cut = false }: {
  parameter: Parameter;
  x: number;
  y: number;
  cell: number;
  local?: boolean;
  cut?: boolean;
}) {
  const rows = parameter.rows / (local ? RANKS.length : 1);
  const width = parameter.columns * cell;
  return (
    <g className={`infra-fsdp-${parameter.tone}`}>
      {Array.from({ length: rows * parameter.columns }, (_, index) => (
        <rect key={index} x={x + (index % parameter.columns) * cell} y={y + Math.floor(index / parameter.columns) * cell} width={cell} height={cell} className="infra-fsdp-cell" />
      ))}
      {cut && <path d={`M ${x - 5} ${y + rows * cell / RANKS.length} h ${width + 10}`} className="infra-fsdp-cut" />}
    </g>
  );
}

function FlowArrow({ version, from, to }: { version: Version; from: number; to: number }) {
  return <path d={`M 192 ${from} V ${to}`} className="infra-fsdp-flow" markerEnd={`url(#fsdp-${version}-arrow)`} />;
}

function LayoutPanel({ version }: { version: Version }) {
  const flat = version === 1;
  return (
    <svg className="infra-fsdp-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 446" width="384" height="446" role="img" aria-labelledby={`fsdp-${version}-title fsdp-${version}-description`}>
      <title id={`fsdp-${version}-title`}>{`FSDP${version}：${flat ? '先拼成 FlatParameter，再切给两个 rank' : '每个参数分别沿 dim 0 切给两个 rank'}`}</title>
      <desc id={`fsdp-${version}-description`}>
        {flat
          ? '三个 shape 为 (4, 2) 的权重 W1、W2、W3 属于同一个 FSDP unit。拼接后共有 24 个元素，平均分给两个 rank。Rank 0 拿到完整 W1 和 W2 的前半部分；Rank 1 拿到 W2 的后半部分和完整 W3。每个本地 flat shard 有 12 个元素，分片边界穿过 W2。'
          : '同样的三个权重分别表示为 DTensor，沿 dim 0 切分。Rank 0 保存每个权重的前两行，Rank 1 保存后两行。每个 DTensor 的全局 shape 仍为 (4, 2)，本地数据的 shape 为 (2, 2)，每个 rank 总计 12 个元素。同组参数仍可合并通信。'}
      </desc>
      <defs>
        <marker id={`fsdp-${version}-arrow`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M 0 0 L 6 3 L 0 6 Z" className="infra-fsdp-arrowhead" />
        </marker>
      </defs>
      <text x="192" y="22" className="infra-fsdp-note">同组的 3 个权重 · shape (4, 2)</text>
      {FSDP_PARAMETERS.map((parameter, index) => (
        <g key={parameter.name}>
          <text x={72 + index * 120} y="49" className="infra-fsdp-label">{parameter.name}</text>
          <Matrix parameter={parameter} x={60 + index * 120} y={59} cell={12} />
        </g>
      ))}
      <FlowArrow version={version} from={120} to={144} />
      <text x="192" y="169" className="infra-fsdp-action">{flat ? 'flatten + concatenate' : '每个参数分别用 DTensor 表示'}</text>
      {flat ? (
        <g>
          {FSDP_PARAMETERS.map((parameter, index) => (
            <text key={parameter.name} x={88 + index * 104} y="198" className="infra-fsdp-label">{parameter.name}</text>
          ))}
          {ELEMENTS.map((element, index) => (
            <rect key={`${element.parameter}-${element.index}`} x={36 + index * 13} y="209" width="13" height="22" className={`infra-fsdp-cell infra-fsdp-${element.tone}`} />
          ))}
          <path d="M 192 202 V 240" className="infra-fsdp-cut" />
          <text x="192" y="263" className="infra-fsdp-note">FlatParameter · 从中间切成两段</text>
        </g>
      ) : (
        <g>
          {FSDP_PARAMETERS.map((parameter, index) => (
            <Matrix key={parameter.name} parameter={parameter} x={59 + index * 120} y={192} cell={13} cut />
          ))}
          <text x="192" y="263" className="infra-fsdp-note">Shard(0) · 每个权重各取一半行</text>
        </g>
      )}
      <FlowArrow version={version} from={276} to={298} />
      {RANKS.map((rank) => {
        const local = fsdpLocalElements(version, rank);
        return (
          <g key={rank} data-fsdp-rank={rank} data-element-count={local.length}>
            <rect x={10 + rank * 192} y="311" width="172" height="126" rx="6" className="infra-fsdp-rank-box" />
            <text x={96 + rank * 192} y="334" className="infra-fsdp-rank">{`Rank ${rank}`}</text>
            {flat ? (
              <g>
                {FSDP_PARAMETERS.map((parameter) => {
                  const start = local.findIndex((element) => element.parameter === parameter.name);
                  const count = local.filter((element) => element.parameter === parameter.name).length;
                  return count > 0 && <text key={parameter.name} x={24 + rank * 192 + (start + count / 2) * 12} y="364" className="infra-fsdp-label">{parameter.name}</text>;
                })}
                {local.map((element, index) => (
                  <rect key={`${element.parameter}-${element.index}`} x={24 + rank * 192 + index * 12} y="377" width="12" height="20" className={`infra-fsdp-cell infra-fsdp-${element.tone}`} data-parameter={element.parameter} data-element={element.index} />
                ))}
                <text x={96 + rank * 192} y="421" className="infra-fsdp-note">{`flat shard · (${local.length},)`}</text>
              </g>
            ) : (
              <g>
                {FSDP_PARAMETERS.map((parameter, index) => (
                  <g key={parameter.name} data-parameter={parameter.name} data-elements={local.filter((element) => element.parameter === parameter.name).map((element) => element.index).join(',')}>
                    <text x={46 + rank * 192 + index * 50} y="358" className="infra-fsdp-label">{parameter.name}</text>
                    <Matrix parameter={parameter} x={34 + rank * 192 + index * 50} y={369} cell={12} local />
                  </g>
                ))}
                <text x={96 + rank * 192} y="421" className="infra-fsdp-note">{rank === 0 ? '各取前 2 行 · local (2, 2)' : '各取后 2 行 · local (2, 2)'}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function FsdpLayoutComparison() {
  return (
    <figure id="fsdp-layout" className="infra-fsdp-figure">
      <div className="infra-fsdp-scroll" role="region" aria-label="FSDP1 与 FSDP2 参数分片对照，可横向滚动" tabIndex={0}>
        <div className="infra-fsdp-grid">
          {([1, 2] as const).map((version) => (
            <div key={version} className="infra-fsdp-panel">
              <div className="infra-fsdp-heading"><strong>{`FSDP${version}`}</strong><span>{version === 1 ? '先打包，再切分' : '逐参数分片，按组通信'}</span></div>
              <LayoutPanel version={version} />
              <div className="infra-fsdp-takeaway">{version === 1 ? '一个 flat shard 可以跨过参数边界' : '每个参数保留自己的 shape 与分片信息'}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="infra-fsdp-scroll-hint">左右滑动对比 FSDP1 / FSDP2</div>
      <figcaption>
        W1、W2、W3 分别代表三个 Linear 的 weight，同属一个通信分组；两边都分给 2 个 rank，每个 rank 都保存 12 个元素。虚线标出切分位置：FSDP1 的切口穿过 W2，FSDP2 则对每个权重分别按行切分，全局 shape 仍是 (4, 2)。图中只比较参数布局，省略 bias、padding 和计算时临时聚合的完整参数；箭头表示布局变化，不表示通信次数。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { FsdpLayoutComparison };
