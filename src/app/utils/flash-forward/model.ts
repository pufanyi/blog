export const SEQUENCE_LENGTH = 24;
export const GRID_UNIT = 10;
export const QUERY_TILE_SIZE = 4;
export const KV_TILE_SIZES = [4, 8] as const;
export type KvTileSize = (typeof KV_TILE_SIZES)[number];
export const DEFAULT_QUERY = 2;

export interface Tile {
  index: number;
  start: number;
  end: number;
}
export type Phase = 'sequence' | 'partition' | 'query' | 'tile' | 'merge' | 'output';
export interface Frame {
  phase: Phase;
  query: number;
  kv: number | null;
  processed: number;
  title: string;
  explanation: string;
  lines: string[];
  lineLabel: string;
}

/** Half-open token ranges drive the sequence strips, score grid, and playback. */
export function partition(length: number, size: number): Tile[] {
  if (!Number.isInteger(length) || length < 1 || !Number.isInteger(size) || size < 1) {
    throw new Error('Sequence length and tile size must be positive integers');
  }
  return Array.from({ length: Math.ceil(length / size) }, (_, index) => ({
    index,
    start: index * size,
    end: Math.min((index + 1) * size, length),
  }));
}

export const QUERY_TILES = partition(SEQUENCE_LENGTH, QUERY_TILE_SIZE);
export const tokenRange = (tile: Tile): string => `${tile.start + 1}–${tile.end}`;

export function buildFrames(size: KvTileSize = 4, query = DEFAULT_QUERY): Frame[] {
  const queryTile = QUERY_TILES[query];
  if (!queryTile || !KV_TILE_SIZES.includes(size)) throw new Error('Invalid tile selection');
  const kvTiles = partition(SEQUENCE_LENGTH, size);
  const frames: Frame[] = [];
  const push = (
    phase: Phase,
    kv: number | null,
    processed: number,
    title: string,
    explanation: string,
    lines: string[],
    lineLabel: string,
  ) => {
    frames.push({ phase, query, kv, processed, title, explanation, lines, lineLabel });
  };
  push(
    'sequence',
    null,
    0,
    '从一条完整 sequence 开始',
    `${SEQUENCE_LENGTH} 个 query 都要关注 ${SEQUENCE_LENGTH} 个 key。大网格中的每个细格表示一对 query 与 key。`,
    ['queries'],
    '01',
  );
  push(
    'partition',
    null,
    0,
    '沿 sequence 维度切成小块',
    `Q 分成 ${QUERY_TILES.length} 块，每块 ${QUERY_TILE_SIZE} 行；K、V 分成 ${kvTiles.length} 块，每块 ${size} 行。粗线围出 ${QUERY_TILE_SIZE} × ${size} 的 score tile。`,
    ['queries', 'keys'],
    '01、04',
  );
  push(
    'query',
    null,
    0,
    `固定 Q 块 ${query + 1}，准备扫描 KV`,
    `把 token ${tokenRange(queryTile)} 的 query 留在片上。接下来只计算这一条横带，其他 query tile 可以独立执行。`,
    ['load-query', 'initialize'],
    '02–03',
  );
  for (const kv of kvTiles) {
    push(
      'tile',
      kv.index,
      kv.start,
      `读取 KV 块 ${kv.index + 1}，计算当前 tile`,
      `读入 token ${tokenRange(kv)} 的 K、V，先用固定 Q 块与本块 K 计算 score。蓝框就是本轮的计算范围。`,
      ['load-kv', 'scores', 'mask', 'maximum', 'rescale', 'weights'],
      '05–10',
    );
    push(
      'merge',
      kv.index,
      kv.end,
      `合并第 ${kv.index + 1} 块，释放临时 tile`,
      `把本块贡献合入同一份运行状态，现在已覆盖 key 1–${kv.end}。${kv.end === SEQUENCE_LENGTH ? '全部 KV 已扫描完，可以归一化。' : '临时空间留给下一块复用，query 不必重新读取。'}`,
      ['denominator', 'numerator', 'advance', 'end-keys'],
      '11–14',
    );
  }
  push(
    'output',
    null,
    SEQUENCE_LENGTH,
    `得到输出块 O ${query + 1}`,
    `扫完 ${kvTiles.length} 个 KV 块后，归一化并写回 token ${tokenRange(queryTile)} 的输出及 log-sum-exp。选择左侧另一块 Q，可以查看它自己的扫描过程。`,
    ['normalize', 'normalizer', 'store'],
    '15–17',
  );
  return frames;
}
