const QUERY_HEADS = 8;
const HEAD_WIDTH = 14;
const HEAD_HEIGHT = 34;
const QUERY_Y = 172;
const KEY_Y = 84;
const VALUE_Y = 24;

const variants = [
  { id: 'mha', name: 'Multi-Head Attention', kvHeads: QUERY_HEADS },
  { id: 'gqa', name: 'Grouped-Query Attention', kvHeads: 2 },
  { id: 'mqa', name: 'Multi-Query Attention', kvHeads: 1 },
] as const;

function queryX(index: number) {
  return 78 + index * 27;
}

function Head({ x, y, pattern }: { x: number; y: number; pattern?: string }) {
  return (
    <g>
      <rect
        x={x - HEAD_WIDTH / 2}
        y={y}
        width={HEAD_WIDTH}
        height={HEAD_HEIGHT}
        rx="2"
        className={pattern ? 'attention-head-kv' : 'attention-head-query'}
      />
      {pattern && (
        <rect
          x={x - HEAD_WIDTH / 2}
          y={y}
          width={HEAD_WIDTH}
          height={HEAD_HEIGHT}
          rx="2"
          fill={`url(#${pattern})`}
        />
      )}
    </g>
  );
}

function AttentionPanel({ variant }: { variant: (typeof variants)[number] }) {
  const id = `attention-heads-${variant.id}`;
  const queriesPerGroup = QUERY_HEADS / variant.kvHeads;
  const groups = Array.from({ length: variant.kvHeads }, (_, group) => {
    const queries = Array.from(
      { length: queriesPerGroup },
      (_, offset) => group * queriesPerGroup + offset,
    );
    const x = queryX(group * queriesPerGroup + (queriesPerGroup - 1) / 2);
    return { x, queries };
  });
  const cachePercent = (groups.length / QUERY_HEADS) * 100;
  const sharing =
    queriesPerGroup === 1
      ? '每个 Query head 独享一组 K/V'
      : `每 ${queriesPerGroup} 个 Query heads 共享一组 K/V`;

  return (
    <div className="attention-head-panel">
      <div className="attention-head-heading">
        <strong>{variant.id.toUpperCase()}</strong>
        <span>{variant.name}</span>
      </div>
      <div
        className="attention-head-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${variant.id.toUpperCase()} head 共享关系图，可横向滚动`}
      >
        <svg
          className="attention-head-diagram"
          viewBox="0 0 288 232"
          width="288"
          height="232"
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{`${variant.name} 的 Query 与 Key/Value heads`}</title>
          <desc id={`${id}-desc`}>
            {`${QUERY_HEADS} 个 Query heads，${groups.length} 个 Key heads 和 ${groups.length} 个 Value heads。${sharing}。斜线填充的 K/V 在自回归推理时缓存；连线表示各 Query head 使用哪组 K/V。`}
          </desc>
          <defs>
            <pattern
              id={`${id}-cache`}
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
            >
              <path d="M-1 1L1-1M0 5L5 0M4 6L6 4" className="attention-head-hatch" />
            </pattern>
          </defs>
          {[
            { label: 'Values', y: VALUE_Y },
            { label: 'Keys', y: KEY_Y },
            { label: 'Queries', y: QUERY_Y },
          ].map(({ label, y }) => (
            <text key={label} x="55" y={y + HEAD_HEIGHT / 2} className="attention-head-label">
              {label}
            </text>
          ))}
          {groups.map(({ x, queries }, group) => (
            <g key={group}>
              <line
                x1={x}
                y1={VALUE_Y + HEAD_HEIGHT}
                x2={x}
                y2={KEY_Y}
                className="attention-head-pair"
              />
              {queries.map((query) => (
                <line
                  key={query}
                  x1={x}
                  y1={KEY_Y + HEAD_HEIGHT}
                  x2={queryX(query)}
                  y2={QUERY_Y}
                  className="attention-head-sharing"
                />
              ))}
              <Head x={x} y={VALUE_Y} pattern={`${id}-cache`} />
              <Head x={x} y={KEY_Y} pattern={`${id}-cache`} />
              {queries.map((query) => (
                <g key={query}>
                  <Head x={queryX(query)} y={QUERY_Y} />
                  <text x={queryX(query)} y="224" className="attention-head-index">
                    {query + 1}
                  </text>
                </g>
              ))}
            </g>
          ))}
        </svg>
      </div>
      <div className="attention-head-sharing-label">{sharing}</div>
      <div className="attention-head-cache">
        <div className="attention-head-cache-label">
          <span>{groups.length} 组 K/V</span>
          <strong>{cachePercent}%</strong>
        </div>
        <div className="attention-head-cache-track" aria-hidden="true">
          <div style={{ width: `${cachePercent}%` }} />
        </div>
      </div>
    </div>
  );
}

function AttentionHeadsDiagram() {
  return (
    <figure className="attention-head-figure">
      <div className="attention-head-legend">
        <span>相同的 {QUERY_HEADS} 个 Query heads</span>
        <span>
          <i className="attention-head-cache-swatch" aria-hidden="true" />
          自回归推理时缓存的 K/V
        </span>
      </div>
      <div className="attention-head-grid">
        {variants.map((variant) => (
          <AttentionPanel key={variant.id} variant={variant} />
        ))}
      </div>
      <figcaption>
        连线表示各 Query head 使用哪组 K/V；GQA 以 {QUERY_HEADS} 个 Query heads 分成{' '}
        {variants[1].kvHeads} 组为例。下方比例为相对 MHA 的 KV cache
        大小，假设序列长度、每个 head 的维度、层数、batch size 和缓存精度相同。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { AttentionHeadsDiagram };
