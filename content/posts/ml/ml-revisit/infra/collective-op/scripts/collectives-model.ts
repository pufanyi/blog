export const RANKS = [0, 1, 2, 3] as const;
const LETTERS = ['A', 'B', 'C', 'D'] as const;
const SUBSCRIPTS = ['₀', '₁', '₂', '₃'] as const;

interface Term {
  source: number;
  shard?: number;
}

export interface Block {
  terms: readonly Term[];
}

export type Row = readonly Block[] | null;
export type State = readonly Row[];

export interface Operation {
  id: string;
  name: string;
  verb: string;
  description: string;
  input: State;
  output: State;
  flow: 'out' | 'in' | 'concat' | 'sum' | 'exchange';
  root?: boolean;
}

export const block = (source: number, shard?: number): Block => ({ terms: [{ source, shard }] });
export const sum = (blocks: readonly Block[]): Block => ({
  terms: blocks.flatMap((item) => item.terms),
});
const atRoot = (blocks: readonly Block[]): State =>
  RANKS.map((rank) => (rank === 0 ? blocks : null));
const replicate = (blocks: readonly Block[]): State => RANKS.map(() => blocks);

const pieces = RANKS.map((rank) => block(rank));
const distributedPieces = pieces.map((item) => [item]);
export const vectors = RANKS.map((rank) => RANKS.map((shard) => block(rank, shard)));
// A destination receives the same-position shard from each source rank.
const columns = RANKS.map((shard) => vectors.map((row) => row[shard]!));
export const totals = columns.map(sum);
export const reducedShards = totals.map((item) => [item]);
export const reducedEverywhere = replicate(reducedShards.flat());

export const OPERATIONS: readonly Operation[] = [
  {
    id: 'broadcast',
    name: 'Broadcast',
    verb: '整份复制',
    description: 'R0 的完整张量 A、B、C、D 被复制到所有 rank，每个 rank 都得到完整的一份。',
    input: atRoot(pieces),
    output: replicate(pieces),
    flow: 'out',
    root: true,
  },
  {
    id: 'scatter',
    name: 'Scatter',
    verb: '切开分发',
    description: 'R0 持有 A、B、C、D 四块数据。分发后 R0 得到 A，R1 得到 B，R2 得到 C，R3 得到 D。',
    input: atRoot(pieces),
    output: distributedPieces,
    flow: 'out',
    root: true,
  },
  {
    id: 'gather',
    name: 'Gather',
    verb: '收集拼接',
    description:
      '四个 rank 分别提供 A、B、C、D，在 R0 按 rank 顺序拼接为四块数据。只在 R0 指定输出。',
    input: distributedPieces,
    output: atRoot(pieces),
    flow: 'in',
    root: true,
  },
  {
    id: 'reduce',
    name: 'Reduce',
    verb: '逐项相加',
    description:
      '四个 rank 的同形状数据 A、B、C、D 逐元素相加，R0 得到同形状的结果 Σ = A + B + C + D。只在 R0 指定输出。',
    input: distributedPieces,
    output: atRoot([sum(pieces)]),
    flow: 'sum',
    root: true,
  },
  {
    id: 'all-gather',
    name: 'All-gather',
    verb: '每处都拼接',
    description:
      '四个 rank 分别提供 A、B、C、D，每个 rank 都得到按 rank 顺序拼接的完整数据 A、B、C、D。',
    input: distributedPieces,
    output: replicate(pieces),
    flow: 'concat',
  },
  {
    id: 'reduce-scatter',
    name: 'Reduce-scatter',
    verb: '相加后分片',
    description:
      '各 rank 先按相同分片位置逐元素相加。Σᵢ = Aᵢ + Bᵢ + Cᵢ + Dᵢ。R0 只得到 Σ₀，R1 只得到 Σ₁，R2 只得到 Σ₂，R3 只得到 Σ₃。',
    input: vectors,
    output: reducedShards,
    flow: 'sum',
  },
  {
    id: 'all-reduce',
    name: 'All-reduce',
    verb: '每处都得总和',
    description: '各 rank 按相同分片位置逐元素相加，每个 rank 都得到完整结果 Σ₀、Σ₁、Σ₂、Σ₃。',
    input: vectors,
    output: reducedEverywhere,
    flow: 'sum',
  },
  {
    id: 'all-to-all',
    name: 'All-to-all',
    verb: '按列交换',
    description:
      '每个 rank 将第 i 个分片发给 Ri。Ri 按来源 rank 顺序收到 Aᵢ、Bᵢ、Cᵢ、Dᵢ。输入的每一列成为输出的一行，没有求和或复制。可用图下方的单选按钮高亮一个目标 rank。',
    input: vectors,
    output: columns,
    flow: 'exchange',
  },
];

export const CELL = 25;
export const PITCH = 28;
export const ROW_WIDTH = 118;
export const ROW_HEIGHT = 36;
export const LEFT = 38;
export const RIGHT = 264;
export const rowY = (rank: number): number => 54 + rank * 46;
export const blockLabel = ({ terms }: Block): string => {
  const first = terms[0]!;
  const name = terms.length > 1 ? 'Σ' : LETTERS[first.source];
  return `${name}${first.shard === undefined ? '' : SUBSCRIPTS[first.shard]}`;
};
export const colorClass = ({ terms }: Block): string =>
  terms.length === 1 ? `infra-collective-source-${terms[0]!.source}` : 'infra-collective-combined';
