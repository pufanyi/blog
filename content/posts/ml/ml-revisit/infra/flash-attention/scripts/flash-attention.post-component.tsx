import type { ReactNode } from 'react';

function Formula({ children }: { children: string }) {
  return <span className="math-inline">{`\\(${children}\\)`}</span>;
}

function Label({ x, y, width, height = 28, kind = 'label', children }: {
  x: number;
  y: number;
  width: number;
  height?: number;
  kind?: 'label' | 'note' | 'heading';
  children: ReactNode;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div className={`flash-svg-label flash-svg-${kind}`}>
        <span className="flash-svg-content">{children}</span>
      </div>
    </foreignObject>
  );
}

function Diagram({ id, title, description, height, caption, children }: {
  id: string;
  title: string;
  description: string;
  height: number;
  caption: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="flash-figure" id={id}>
      <div className="flash-scroll" role="region" aria-label={`${title}，窄屏可横向滚动`} tabIndex={0}>
        <svg className="flash-diagram" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 680 ${height}`} width="680" height={height} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <defs>
            <marker id={`${id}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 7 3.5 L 0 7 Z" className="flash-arrowhead" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <div className="flash-scroll-hint">左右滑动查看完整示意图</div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Box({ x, y, width, label, note, tone = 'neutral' }: {
  x: number;
  y: number;
  width: number;
  label: ReactNode;
  note?: ReactNode;
  tone?: string;
}) {
  return (
    <g className={`flash-${tone}`}>
      <rect x={x} y={y} width={width} height={note ? 58 : 38} rx="5" className="flash-box" />
      <Label x={x + 4} y={y + 2} width={width - 8} height={34}>{label}</Label>
      {note && <Label x={x + 4} y={y + 35} width={width - 8} height={20} kind="note">{note}</Label>}
    </g>
  );
}

function Arrow({ id, path, dashed = false }: { id: string; path: string; dashed?: boolean }) {
  return <path d={path} className={`flash-line${dashed ? ' flash-dashed' : ''}`} markerEnd={`url(#${id}-arrow)`} />;
}

function FlashMemoryFlow() {
  const id = 'flash-memory-flow';
  const stages = [
    { label: String.raw`\frac{QK^\top}{\sqrt d}`, note: 'matmul', tone: 'neutral' },
    { label: 'S', note: <>HBM · <Formula>{String.raw`N\times N`}</Formula></>, tone: 'clay' },
    { label: String.raw`\operatorname{softmax}`, note: 'row reduction', tone: 'neutral' },
    { label: 'P', note: <>HBM · <Formula>{String.raw`N\times N`}</Formula></>, tone: 'clay' },
    { label: 'PV', note: 'matmul', tone: 'neutral' },
    { label: 'O', note: <>HBM · <Formula>{String.raw`N\times d`}</Formula></>, tone: 'blue' },
  ];
  return (
    <Diagram id={id} title="Attention intermediates: HBM tensors versus on-chip tiles" height={360}
      description="上方三个独立算子将完整 score S 和概率 P 分别写入并读出 HBM。下方将一个 score tile 的矩阵乘法、online softmax 和 value 加权求和融合在片上，保留运行状态并复用临时空间，最终输出 O。"
      caption={<>上：箭头穿过 <Formula>{'S,P'}</Formula> 时分别发生 HBM 写入与读回。下：虚线框内只容纳当前 tile 与运行状态，<Formula>{'S,P'}</Formula> 不形成完整的 HBM 张量。示意数据流，不按容量或耗时比例绘制。</>}>
      <Label x={20} y={5} width={640} kind="heading">Separate kernels · <Formula>{'Q,K,V'}</Formula> start in HBM</Label>
      {stages.map((stage, index) => (
        <g key={stage.label}>
          <Box x={14 + index * 111} y={49} width={97} {...stage} label={<Formula>{stage.label}</Formula>} />
          {index < stages.length - 1 && <Arrow id={id} path={`M ${113 + index * 111} 78 H ${122 + index * 111}`} />}
        </g>
      ))}
      <Label x={20} y={117} width={640} height={24} kind="note"><Formula>{'S'}</Formula> and <Formula>{'P'}</Formula> each make a write → read round trip</Label>
      <path d="M 20 153 H 660" className="flash-divider" />
      <text x="340" y="181" className="flash-heading">Fused tiled kernel · one query tile at a time</text>
      <rect x="20" y="202" width="508" height="130" rx="7" className="flash-chip" />
      <text x="274" y="224" className="flash-note">On chip · shared memory + registers</text>
      <Box x={34} y={239} width={136} label={<Formula>{String.raw`\frac{Q_iK_j^\top}{\sqrt d}`}</Formula>} note="score tile" />
      <Arrow id={id} path="M 174 267 H 193" />
      <Box x={197} y={239} width={142} label="online softmax" note={<>update <Formula>{String.raw`m,\ell`}</Formula></>} tone="teal" />
      <Arrow id={id} path="M 343 267 H 363" />
      <Box x={367} y={239} width={145} label={<Formula>{'WV_j'}</Formula>} note={<>rescale + update <Formula>{'U'}</Formula></>} tone="blue" />
      <Arrow id={id} path="M 528 267 H 552" />
      <Box x={556} y={239} width={110} label={<Formula>{String.raw`O_i=\frac{U}{\ell}`}</Formula>} note="write to HBM" tone="blue" />
      <Label x={30} y={303} width={488} height={24} kind="note">Repeat with the next <Formula>{'K_j,V_j'}</Formula> · reuse tile storage</Label>
    </Diagram>
  );
}

const MERGE_BLOCKS = [
  { name: 'A', masses: [1, 2], values: [1, 2], tone: 'blue' },
  { name: 'B', masses: [4, 8], values: [3, 4], tone: 'teal' },
].map(block => {
  const scale = Math.max(...block.masses);
  return {
    ...block,
    scale,
    ell: block.masses.reduce((sum, mass) => sum + mass / scale, 0),
    u: block.masses.reduce((sum, mass, index) => sum + mass / scale * block.values[index]!, 0),
  };
});

function ratioTex(numerator: number, denominator: number): string {
  let a = numerator;
  let b = denominator;
  while (b) [a, b] = [b, a % b];
  return denominator === a ? String(numerator / a) : String.raw`\frac{${numerator / a}}{${denominator / a}}`;
}

function FlashOnlineMerge() {
  const id = 'flash-online-merge';
  const scale = Math.max(...MERGE_BLOCKS.map(block => block.scale));
  const ell = MERGE_BLOCKS.reduce((sum, block) => sum + block.scale / scale * block.ell, 0);
  const u = MERGE_BLOCKS.reduce((sum, block) => sum + block.scale / scale * block.u, 0);
  return (
    <Diagram id={id} title="Online attention: merge two blocks in a common exponential scale" height={360}
      description={`左块的指数质量为 1、2，value 为 1、2；右块的指数质量为 4、8，value 为 3、4。左块状态按四分之一缩放，右块状态保持原样，合并得到分母 ${ell}、加权和 ${u}，输出等于 49/15。`}
      caption={<>这里的 <Formula>{String.raw`\exp(x)`}</Formula> 是便于手算的未平移指数值，实际算法使用减去最大值后的指数。两个块的分母和加权和必须按同一基准合并；value 用标量展示，向量时逐分量执行相同运算。</>}>
      {MERGE_BLOCKS.map((block, index) => {
        const center = 172 + index * 336;
        return (
          <g key={block.name} className={`flash-${block.tone}`}>
            <rect x={center - 150} y="16" width="300" height="132" rx="6" className="flash-box" />
            <text x={center} y="41" className="flash-heading">{`Block ${block.name}`}</text>
            <Label x={center - 144} y={50} width={288}><Formula>{String.raw`\exp(x_${block.name})=(${block.masses.join(',')})`}</Formula></Label>
            <Label x={center - 144} y={77} width={288}><Formula>{String.raw`V_${block.name}=(${block.values.join(',')})`}</Formula></Label>
            <Label x={center - 144} y={106} width={288}><Formula>{String.raw`m_${block.name}=\log ${block.scale},\quad\ell_${block.name}=${block.ell},\quad u_${block.name}=${block.u}`}</Formula></Label>
            <Arrow id={id} path={`M ${center} 150 V 197 L ${index === 0 ? 254 : 426} 224`} />
            <Label x={center + (index === 0 ? -102 : 12)} y={162} width={90} height={36}><Formula>{String.raw`\times ${ratioTex(block.scale, scale)}`}</Formula></Label>
          </g>
        );
      })}
      <Label x={219} y={161} width={242} height={36}><Formula>{String.raw`m=\max(m_A,m_B)=\log ${scale}`}</Formula></Label>
      <rect x="151" y="228" width="378" height="112" rx="6" className="flash-chip" />
      <Label x={157} y={232} width={366} height={32}><Formula>{String.raw`\ell=${MERGE_BLOCKS.map(block => String.raw`${block.ell}\times ${ratioTex(block.scale, scale)}`).join('+')}=${ell}`}</Formula></Label>
      <Label x={157} y={266} width={366} height={32}><Formula>{String.raw`u=${MERGE_BLOCKS.map(block => String.raw`${block.u}\times ${ratioTex(block.scale, scale)}`).join('+')}=${u}`}</Formula></Label>
      <Label x={157} y={300} width={366} height={36}><Formula>{String.raw`O_i=\frac{${u}}{${ell}}=\frac{49}{15}\approx ${(u / ell).toFixed(4)}`}</Formula></Label>
    </Diagram>
  );
}

const TILE_COUNT = 6;
const ACTIVE_QUERY_TILE = 3;
const ACTIVE_KV_TILE = 2;
const TILE_SIZE = 2;

function FlashCausalTiles() {
  const id = 'flash-causal-tiles';
  const cell = 42;
  const originX = 70;
  const originY = 70;
  return (
    <Diagram id={id} title="Causal attention: traverse KV tiles for one query tile" height={375}
      description={`序列长 ${TILE_COUNT * TILE_SIZE}，每块 ${TILE_SIZE} 个 query 和 ${TILE_SIZE} 个 key。当前 query 块为第 ${ACTIVE_QUERY_TILE} 块，已处理前 ${ACTIVE_KV_TILE} 个 KV 块，正在计算第 ${ACTIVE_KV_TILE} 块，然后处理对角块。未来的整块跳过，对角块只计算有效的下三角。`}
      caption={<>每格代表 <Formula>{String.raw`2\times 2`}</Formula> 个 score，块编号从 0 开始。粗框表示当前 query tile 的有效范围，✓ 表示已累加，● 表示当前 tile，斜线右上方是被 mask 的位置。右侧状态每处理一块就更新一次。</>}>
      <Label x={70} y={5} width={252} kind="heading"><Formula>{'K,V'}</Formula> tiles →</Label>
      {Array.from({ length: TILE_COUNT }, (_, row) => (
        <g key={row}>
          <Label x={originX + row * cell} y={36} width={cell}><Formula>{String(row)}</Formula></Label>
          <Label x={25} y={originY + row * cell + 7} width={40}><Formula>{`Q_${row}`}</Formula></Label>
          {Array.from({ length: TILE_COUNT }, (_, column) => {
            const x = originX + column * cell;
            const y = originY + row * cell;
            const masked = column > row;
            const activeRow = row === ACTIVE_QUERY_TILE;
            const current = activeRow && column === ACTIVE_KV_TILE;
            return (
              <g key={column} className={current ? 'flash-teal' : 'flash-blue'}>
                <rect x={x + 2} y={y + 2} width={cell - 4} height={cell - 4} rx="3" className={masked ? 'flash-masked' : current ? 'flash-box flash-current' : 'flash-box'} />
                {column === row && <path d={`M ${x + 3} ${y + 3} H ${x + cell - 3} V ${y + cell - 3} Z`} className="flash-mask-half" />}
                {activeRow && column <= ACTIVE_KV_TILE && <text x={x + cell / 2} y={y + 27} className="flash-label">{current ? '●' : '✓'}</text>}
              </g>
            );
          })}
        </g>
      ))}
      <rect x={originX - 3} y={originY + ACTIVE_QUERY_TILE * cell - 3} width={(ACTIVE_QUERY_TILE + 1) * cell + 6} height={cell + 6} rx="4" className="flash-outline" />
      <Arrow id={id} path={`M ${originX + TILE_COUNT * cell + 5} ${originY + (ACTIVE_QUERY_TILE + 0.5) * cell} H 355`} />
      <Box x={365} y={104} width={290} label={<><Formula>{'Q_i'}</Formula> stays on chip</>} note={<Formula>{String.raw`B_r\times d`}</Formula>} tone="blue" />
      <Box x={365} y={185} width={290} label={<Formula>{String.raw`m,\ell,U`}</Formula>} note={<><Formula>{String.raw`B_r,\ B_r,\ B_r\times d`}</Formula> · running state</>} tone="teal" />
      <Arrow id={id} path="M 510 246 V 269" />
      <Box x={365} y={275} width={290} label={<Formula>{String.raw`O_i=\frac{U}{\ell}`}</Formula>} note="after all valid KV tiles" tone="blue" />
      <text x="196" y="354" className="flash-note">Conceptual score grid · never stored in HBM</text>
    </Diagram>
  );
}

function FlashWarpPartition() {
  const id = 'flash-warp-partition';
  const warps = [0, 1];
  return (
    <Diagram id={id} title="Within a thread block: split KV versus split Q" height={324}
      description="左侧两个 warp 处理相同的 query 和不同的 KV 范围，输出是同一行的部分结果，需要归约。右侧两个 warp 处理不同的 query 行和共享的 KV，各自得到完整的输出行，无需在 warp 之间归约这些输出。"
      caption={<>以两个 warp 示意 forward 的工作划分，依据 FlashAttention-2 的 split-K 与 split-Q 思路重绘。上标 <Formula>{'(w)'}</Formula> 标记 warp <Formula>{'w'}</Formula> 对应的分片。右侧省掉输出部分和的跨 warp 合并，加载共享 <Formula>{'K,V'}</Formula> 时仍需必要的同步。</>}>
      <Label x={10} y={5} width={320} kind="heading">Split <Formula>{'K,V'}</Formula> · partial outputs</Label>
      <Label x={350} y={5} width={320} kind="heading">Split <Formula>{'Q'}</Formula> · independent output rows</Label>
      <path d="M 340 45 V 307" className="flash-divider" />
      {warps.map((warp, index) => {
        const x = 22 + index * 162;
        return (
          <g key={warp}>
            <Box x={x} y={62} width={134} label={`warp ${warp}`} note={<Formula>{String.raw`Q_i\,;\ K^{(${warp})},V^{(${warp})}`}</Formula>} tone={index ? 'teal' : 'blue'} />
            <Arrow id={id} path={`M ${x + 67} 125 V 150`} />
            <Box x={x} y={157} width={134} label={<Formula>{String.raw`m^{(${warp})},\ell^{(${warp})},U^{(${warp})}`}</Formula>} />
            <Arrow id={id} path={`M ${x + 67} 199 V 215 L 170 237`} dashed />
            <Box x={362 + index * 162} y={62} width={134} label={`warp ${warp}`} note={<><Formula>{String.raw`Q_i^{(${warp})}`}</Formula> · shared <Formula>{'K,V'}</Formula></>} tone={index ? 'teal' : 'blue'} />
            <Arrow id={id} path={`M ${429 + index * 162} 125 V 232`} />
            <Box x={362 + index * 162} y={239} width={134} label={<Formula>{String.raw`O_i^{(${warp})}`}</Formula>} tone={index ? 'teal' : 'blue'} />
          </g>
        );
      })}
      <Box x={70} y={242} width={200} label={<>merge → <Formula>{'O_i'}</Formula></>} note="shared memory + sync" tone="clay" />
      <text x="510" y="302" className="flash-note">Each warp owns its output rows</text>
    </Diagram>
  );
}

export const POST_COMPONENTS = {
  FlashMemoryFlow,
  FlashOnlineMerge,
  FlashCausalTiles,
  FlashWarpPartition,
};
