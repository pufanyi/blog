import type { ReactNode } from 'react';

const BLOCK_SIZE = 4;
const REQUEST_A = { tokens: 9, blocks: [3, 0, 4] };
const POOL_SIZE = 5;
const PREFIX = ['0', '1', '2', '3'];
const SHARED_TAIL = ['4', '5'];
const BRANCHES = [
  { name: 'A', token: 'a', block: 4, tone: 'blue', copied: true },
  { name: 'B', token: 'b', block: 0, tone: 'teal', copied: false },
] as const;

function Cells({ x, y, tokens, tone = 'blue', cell = 28 }: {
  x: number;
  y: number;
  tokens: readonly string[];
  tone?: string;
  cell?: number;
}) {
  return (
    <g className={`paged-${tone}`}>
      {Array.from({ length: BLOCK_SIZE }, (_, index) => (
        <g key={index}>
          <rect x={x + index * cell} y={y} width={cell - 2} height="30" rx="3" className={index < tokens.length ? 'paged-cell' : 'paged-empty'} />
          {tokens[index] !== undefined && <text x={x + index * cell + (cell - 2) / 2} y={y + 20} className="paged-token">{tokens[index]}</text>}
        </g>
      ))}
    </g>
  );
}

function Diagram({ id, title, description, height, caption, children }: {
  id: string;
  title: string;
  description: string;
  height: number;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="paged-figure" id={id}>
      <div className="paged-scroll" role="region" aria-label={`${title}，窄屏可横向滚动`} tabIndex={0}>
        <svg className="paged-diagram" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 680 ${height}`} width="680" height={height} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <defs>
            <marker id={`${id}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 7 3.5 L 0 7 Z" className="paged-arrowhead" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <div className="paged-scroll-hint">左右滑动查看完整示意图</div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function PagedKvLayout() {
  const logicalBlocks = REQUEST_A.blocks.map((physical, logical) => ({
    physical,
    logical,
    tokens: Array.from({ length: Math.min(BLOCK_SIZE, REQUEST_A.tokens - logical * BLOCK_SIZE) }, (_, offset) => String(logical * BLOCK_SIZE + offset)),
  }));
  const pool = Array.from({ length: POOL_SIZE }, (_, physical) => {
    const block = logicalBlocks.find((candidate) => candidate.physical === physical);
    return block
      ? { name: `A${block.logical}`, tokens: block.tokens, tone: 'blue' }
      : physical === 1
        ? { name: 'Request B', tokens: ['B', 'B', 'B', 'B'], tone: 'teal' }
        : { name: 'Free block', tokens: [], tone: 'neutral' };
  });
  return (
    <Diagram id="paged-kv-layout" title="Logical KV → block table → physical pool" height={340}
      description="每块 4 个 token。请求 A 的 9 个 token 被切成 A0、A1、A2，经 block table 分别映射到 P3、P0、P4。P1 属于请求 B，P2 空闲。A2 只有一个 token，其余三个 slot 留空。"
      caption="每格代表一个 token 的 KV，数字是 token 位置；图中 B = 4，仅示意布局，未按字节比例绘制。A 的 logical block 连续，physical block 可以分散；P2 可分给任意请求，A2 的空位留给 A 继续增长。">
      <text x="340" y="24" className="paged-heading">{`Request A · ${REQUEST_A.tokens} cached tokens`}</text>
      {logicalBlocks.map(({ logical, physical, tokens }) => {
        const center = 132 + logical * 208;
        const destination = 76 + physical * 132;
        return (
          <g key={logical}>
            <text x={center} y="54" className="paged-label">{`A${logical}`}</text>
            <Cells x={center - 55} y={66} tokens={tokens} />
            <path d={`M ${center} 101 V 116`} className="paged-line" />
            <rect x={center - 64} y="120" width="128" height="34" rx="5" className="paged-box" />
            <text x={center} y="142" className="paged-label">{`${logical} → P${physical}`}</text>
            <path d={`M ${center} 154 C ${center} 189, ${destination} 182, ${destination} 218`} className="paged-line" markerEnd="url(#paged-kv-layout-arrow)" />
          </g>
        );
      })}
      {pool.map(({ name, tokens, tone }, physical) => (
        <g key={physical}>
          <text x={76 + physical * 132} y="237" className="paged-label">{`P${physical}`}</text>
          <Cells x={21 + physical * 132} y={249} tokens={tokens} tone={tone} />
          <text x={76 + physical * 132} y="302" className="paged-note">{name}</text>
        </g>
      ))}
      <text x="340" y="330" className="paged-note">GPU KV block pool · dashed cells = unused slots</text>
    </Diagram>
  );
}

const NAIVE_ALLOCATION = { current: 3, final: 5, capacity: 8 };
const FRAGMENTED_POOL = [
  { slots: 2, free: true },
  { slots: 4, free: false },
  { slots: 2, free: true },
];
const NEW_REQUEST_SLOTS = 3;

function PagedKvWaste() {
  const { current, final, capacity } = NAIVE_ALLOCATION;
  const regions = [
    { name: 'Used', start: 0, end: current, tone: 'blue', fill: undefined },
    { name: 'Reservation', start: current, end: final, tone: 'ochre', fill: 'paged-reservation-pattern' },
    { name: 'Internal', start: final, end: capacity, tone: 'clay', fill: 'paged-internal-pattern' },
  ];
  const x = 60;
  const cell = 560 / capacity;
  const free = FRAGMENTED_POOL.filter((region) => region.free).map((region) => region.slots);
  const totalFree = free.reduce((sum, slots) => sum + slots, 0);
  const poolCell = 560 / FRAGMENTED_POOL.reduce((sum, region) => sum + region.slots, 0);
  return (
    <Diagram id="paged-kv-waste" title="Three forms of KV cache memory waste" height={348}
      description={`第一行是一个请求已分配的 ${capacity} 个 slot：${current} 个已有 KV，${final - current} 个预留给未来 token，${capacity - final} 个直到结束也用不到。第二行是独立的 external fragmentation 示例：两段各 ${free[0]} 个 slot 的空闲区域被请求 B 隔开，总空闲量 ${totalFree} 足够，但放不下需要 ${NEW_REQUEST_SLOTS} 个连续 slot 的新请求。`}
      caption="每格代表一个 token 的 BF16 KV 容量，只画 KV 区域，不含权重或 workspace。斜线表示之后才用到的 reservation，交叉线表示最终用不到的 internal fragmentation；第二行的虚线格是分配区外的空闲空间。两行是独立示例。">
      <defs>
        <pattern id="paged-reservation-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M -2 2 L 2 -2 M 0 8 L 8 0 M 6 10 L 10 6" className="paged-waste-hatch paged-ochre" />
        </pattern>
        <pattern id="paged-internal-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 8 8 M 0 8 L 8 0" className="paged-waste-hatch paged-clay" />
        </pattern>
      </defs>
      <text x="340" y="26" className="paged-heading">{`Inside request A · ${capacity} allocated slots`}</text>
      {regions.map(({ name, start, end, tone, fill }) => (
        <g key={name} className={`paged-${tone}`}>
          {Array.from({ length: end - start }, (_, offset) => (
            <g key={offset}>
              <rect x={x + (start + offset) * cell} y="57" width={cell - 2} height="40" rx="3" className="paged-cell" />
              {fill
                ? <rect x={x + (start + offset) * cell} y="57" width={cell - 2} height="40" rx="3" fill={`url(#${fill})`} />
                : <text x={x + (start + offset + 0.5) * cell - 1} y="83" className="paged-token">KV</text>}
            </g>
          ))}
          <text x={x + (start + end) * cell / 2 - 1} y="124" className="paged-label">{`${name} · ${end - start}`}</text>
        </g>
      ))}
      <text x="340" y="158" className="paged-note">{`Current length: ${current} · eventual length: ${final} (known in hindsight)`}</text>
      <text x="340" y="206" className="paged-heading">External fragmentation · between allocations</text>
      {FRAGMENTED_POOL.map((region, index) => {
        const start = FRAGMENTED_POOL.slice(0, index).reduce((sum, previous) => sum + previous.slots, 0);
        return (
          <g key={index} className="paged-teal">
            {Array.from({ length: region.slots }, (_, offset) => (
              <g key={offset}>
                <rect x={x + (start + offset) * poolCell} y="233" width={poolCell - 2} height="40" rx="3" className={region.free ? 'paged-empty' : 'paged-cell'} />
                <text x={x + (start + offset + 0.5) * poolCell - 1} y="259" className="paged-token">{region.free ? 'free' : 'B'}</text>
              </g>
            ))}
          </g>
        );
      })}
      <text x="340" y="307" className="paged-note">{`Free: ${free.join(' + ')} = ${totalFree} slots · largest gap: ${Math.max(...free)}`}</text>
      <text x="340" y="333" className="paged-note">{`New request needs ${NEW_REQUEST_SLOTS} contiguous slots → cannot fit`}</text>
    </Diagram>
  );
}

function PagedKvSharing() {
  return (
    <Diagram id="paged-kv-sharing" title="Shared prefix · copy only the partial tail" height={290}
      description="分叉前 A、B 都指向 P3 和 P0，分别保存位置 0 到 3 和位置 4 到 5 的 KV。A 写入不同的新 token 前，将 P0 复制到 P4。之后 A 指向 P3、P4，B 指向 P3、P0；两条输出仍共享完整的 P3。"
      caption="原论文的 copy-on-write 示例：分叉前两条序列共享 6 个 token，block table 都是 [P3, P0]。A 复制尾块 P0 到 P4 后写入 a；B 独占原来的 P0 后写入 b。a、b 表示新 token 的 KV；完整前缀 P3 始终只存一份。">
      <text x="340" y="26" className="paged-heading">After A and B append different tokens</text>
      <text x="136" y="106" className="paged-label">P3 · shared prefix</text>
      <Cells x={65} y={120} tokens={PREFIX} cell={36} />
      <text x="136" y="178" className="paged-note">refcount = 2</text>
      {BRANCHES.map(({ name, token, block, tone, copied }, index) => {
        const y = 78 + index * 128;
        return (
          <g key={name}>
            <path d={`M 216 ${130 + index * 10} C 294 ${130 + index * 10}, 306 ${y + 15}, 400 ${y + 15}`} className={`paged-line${copied ? '' : ' paged-dashed'}`} markerEnd="url(#paged-kv-sharing-arrow)" />
            <text x="527" y={y - 14} className="paged-label">{`${name}: [P3, P${block}]`}</text>
            <Cells x={413} y={y} tokens={[...SHARED_TAIL, token]} tone={tone} cell={36} />
            <text x="604" y={y + 20} className="paged-label">{`P${block}`}</text>
            <text x="527" y={y + 54} className="paged-note">{`${copied ? 'Copied tail' : 'Original tail'} · refcount = 1`}</text>
          </g>
        );
      })}
    </Diagram>
  );
}

const DECODE_REQUESTS = [
  { name: 'A', steps: 3, ready: 0, tone: 'blue' },
  { name: 'B', steps: 1, ready: 0, tone: 'teal' },
  { name: 'C', steps: 2, ready: 1, tone: 'lavender' },
] as const;

function PagedContinuousBatching() {
  return (
    <Diagram id="paged-batching" title="Continuous batching · refill at iteration boundaries" height={224}
      description="两个并发名额，A 需要三轮 decode，B 需要一轮。C 在第一轮结束后就绪，需要两轮。静态 batch 在 B 结束后留下空位，C 等待 A 结束；continuous batching 在第二轮让 C 加入，与 A 一起执行两轮。"
      caption="只比较 decode 调度，假设最多并发两条序列，且 C 在第 1 轮结束时已经完成 prefill、显存足够。方格是一轮 decode，并非等长的时间单位；实际 prefill 成本与调度策略未画出。">
      {(['Static batch', 'Continuous batch'] as const).map((label, panel) => {
        const origin = 16 + panel * 348;
        const c = DECODE_REQUESTS[2];
        const finish = Math.max(...DECODE_REQUESTS.filter(({ ready }) => ready === 0).map(({ steps }) => steps));
        const cStart = panel === 0 ? finish : c.ready;
        return (
          <g key={label}>
            <text x={origin + 150} y="28" className="paged-heading">{label}</text>
            {Array.from({ length: finish }, (_, iteration) => (
              <g key={iteration}>
                <text x={origin + 56 + iteration * 98} y="57" className="paged-note">{`Step ${iteration + 1}`}</text>
                {[0, 1].map((slot) => {
                  const first = DECODE_REQUESTS[slot]!;
                  const request = iteration < first.steps ? first : slot === 1 && iteration >= cStart && iteration < cStart + c.steps ? c : null;
                  return (
                    <g key={slot} className={`paged-${request?.tone ?? 'neutral'}`}>
                      <rect x={origin + 14 + iteration * 98} y={72 + slot * 52} width="84" height="38" rx="5" className={request ? 'paged-cell' : 'paged-empty'} />
                      <text x={origin + 56 + iteration * 98} y={97 + slot * 52} className="paged-token">{request?.name ?? 'idle'}</text>
                    </g>
                  );
                })}
              </g>
            ))}
            <text x={origin + 150} y="196" className="paged-note">{panel === 0 ? 'C waits until this batch finishes' : 'B finishes → C joins at step 2'}</text>
          </g>
        );
      })}
    </Diagram>
  );
}

export const POST_COMPONENTS = { PagedKvLayout, PagedKvWaste, PagedKvSharing, PagedContinuousBatching };
