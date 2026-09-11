export const EXAMPLE = {
  queries: [1, 2],
  exponentials: [1, 2, 4, 8],
  values: [1, 2, 3, 4],
  tileSize: 2,
};

export const PHASES = {
  initialize: { title: '加载 query，初始化状态', formula: String.raw`m=-\infty,\quad\ell=0,\quad U=0`, lines: ['load-query', 'initialize'], lineLabel: '02–03' },
  load: { title: '把一块 KV 读到片上', formula: String.raw`K_j,V_j:\quad\mathrm{HBM}\longrightarrow\text{片上}`, lines: ['keys', 'load-kv'], lineLabel: '04–05' },
  scores: { title: '只计算当前 score tile', formula: String.raw`S=Q_1K_j^\top/\sqrt d`, lines: ['scores', 'mask'], lineLabel: '06–07' },
  rescale: { title: '统一指数基准，计算权重', formula: String.raw`m'=\max(m,\operatorname{rowmax}(S)),\quad\alpha=e^{m-m'},\quad W=e^{S-m'}`, lines: ['maximum', 'rescale', 'weights'], lineLabel: '08–10' },
  accumulate: { title: '缩放旧状态，再加上本块', formula: String.raw`\ell\leftarrow\alpha\ell+\operatorname{rowsum}(W),\quad U\leftarrow\alpha U+WV_j,\quad m\leftarrow m'`, lines: ['denominator', 'numerator', 'advance'], lineLabel: '11–13' },
  release: { title: '丢弃临时 tile，保留累加状态', formula: String.raw`\text{保留 }Q_1,m,\ell,U\text{，复用 }K_j,V_j,S,W\text{ 的空间}`, lines: ['end-keys'], lineLabel: '14' },
  normalize: { title: '最后归一化，写回 HBM', formula: String.raw`O_1=U/\ell,\qquad L_1=m+\log\ell`, lines: ['normalize', 'normalizer', 'store'], lineLabel: '15–17' },
} as const;

export type Phase = keyof typeof PHASES;
export interface RowState { m: number; ell: number; u: number }
export interface MergeRow {
  before: RowState;
  after: RowState;
  scores: number[];
  weights: number[];
  alpha: number;
  addedEll: number;
  addedU: number;
}
export interface Frame {
  phase: Phase;
  tile: number | null;
  completed: number[];
  rows: RowState[];
  merge: MergeRow[];
  explanation: string;
}

/** A numeric teaching example, with one retained query tile and two KV tiles. */
export function buildFrames(reverse = false): Frame[] {
  let rows: RowState[] = EXAMPLE.queries.map(() => ({ m: -Infinity, ell: 0, u: 0 }));
  const frames: Frame[] = [];
  const completed: number[] = [];
  const push = (phase: Phase, tile: number | null, merge: MergeRow[], explanation: string) => {
    frames.push({ phase, tile, merge, explanation, rows, completed: [...completed] });
  };
  push('initialize', null, [], '固定第一块的两行 query。它们共享读入的 KV，但各自维护最大值、分母和加权和。');
  for (const tile of reverse ? [1, 0] : [0, 1]) {
    const start = tile * EXAMPLE.tileSize;
    const keys = EXAMPLE.exponentials.slice(start, start + EXAMPLE.tileSize).map(Math.log);
    const values = EXAMPLE.values.slice(start, start + EXAMPLE.tileSize);
    const merge = rows.map((before, row): MergeRow => {
      const scores = keys.map(key => EXAMPLE.queries[row] * key);
      const m = Math.max(before.m, ...scores);
      const alpha = Math.exp(before.m - m);
      const weights = scores.map(score => Math.exp(score - m));
      const addedEll = weights.reduce((sum, weight) => sum + weight, 0);
      const addedU = weights.reduce((sum, weight, col) => sum + weight * values[col], 0);
      return { before, scores, weights, alpha, addedEll, addedU, after: {
        m, ell: alpha * before.ell + addedEll, u: alpha * before.u + addedU,
      } };
    });
    push('load', tile, merge, `读取第 ${tile + 1} 块的 key 和 value（token ${start + 1}–${start + EXAMPLE.tileSize}）。Query 留在片上，无需为每块 KV 重新读取。`);
    push('scores', tile, merge, '两行 query 与两个 key 相乘，只产生一个 2 × 2 的 score tile。本例不加 mask，也不使用 dropout。');
    push('rescale', tile, merge, completed.length === 0
      ? '首块的最大值有限，α = 0。初始的零状态不贡献结果；W 是指数权重，还没有除以分母。'
      : reverse
        ? '这一块的 score 更小，运行中最大值不变，α = 1。新权重仍使用前一块留下的基准。'
        : '新最大值更大。第一行的 α = 1/4，第二行的 α = 1/16；下一步要用各自的系数同时缩放旧分母与旧加权和。');
    rows = merge.map(row => row.after);
    push('accumulate', tile, merge, '同一行的分母与加权和使用相同的 α。旧贡献缩放后，再加上本块的指数和与 value 加权和。');
    completed.push(tile);
    push('release', tile, merge, completed.length === 2
      ? '两块都已合并。所有 score 和指数权重都可以丢弃，只凭留下的状态就能计算最终输出。'
      : '当前块已经合并进状态。丢弃 score 和指数权重，下一块会复用这块临时空间；旧 score 不必读回来。');
  }
  push('normalize', null, [], '两行分别做 U / ℓ，并写回输出与 log-sum-exp。改变 KV 扫描顺序会改变中间状态，但不会改变实数运算下的最终结果。');
  return frames;
}

export function formatNumber(value: number): string {
  if (value === -Infinity) return '−∞';
  return Number(value.toFixed(4)).toString();
}

export function referenceResult(query: number): { numerator: number; denominator: number } {
  const weights = EXAMPLE.exponentials.map(value => value ** query);
  return {
    numerator: weights.reduce((sum, weight, col) => sum + weight * EXAMPLE.values[col], 0),
    denominator: weights.reduce((sum, weight) => sum + weight, 0),
  };
}
