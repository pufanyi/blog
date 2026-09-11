import { buildFrames, DEFAULT_QUERY, GRID_UNIT as UNIT, KV_TILE_SIZES, type KvTileSize, partition, QUERY_TILE_SIZE, QUERY_TILES, SEQUENCE_LENGTH, tokenRange } from '../../../../../../../src/app/utils/flash-forward/model';

function Math({ children }: { children: string }) {
  return <span className="math-inline">{`\\(${children}\\)`}</span>;
}

const EXTENT = SEQUENCE_LENGTH * UNIT;
const TOKEN_LINES = Array.from({ length: SEQUENCE_LENGTH - 1 }, (_, index) => {
  const position = (index + 1) * UNIT;
  return `M ${position} 0 V ${EXTENT} M 0 ${position} H ${EXTENT}`;
}).join(' ');

function TilingBoard({ size }: { size: KvTileSize }) {
  const tiles = partition(SEQUENCE_LENGTH, size);
  const prefix = `flash-tiling-${size}`;
  return (
    <div className="flash-player-scene" data-layout={size} hidden={size !== 4}>
      <div className="flash-player-map">
        <div className="flash-player-map-head"><span><Math>{'Q'}</Math> ↓</span><span><Math>{'K,V'}</Math> sequence · {SEQUENCE_LENGTH} tokens →</span><span>输出</span></div>
        <div className="flash-player-map-grid">
          <div className="flash-player-query-axis" style={{ gridTemplateRows: `repeat(${QUERY_TILES.length}, minmax(0, 1fr))` }}>
            {QUERY_TILES.map(tile => <button key={tile.index} type="button" data-query={tile.index} aria-label={`选择 Q 块 ${tile.index + 1}，token ${tokenRange(tile)}`} aria-pressed="false" disabled>
              <Math>{`Q_${tile.index + 1}`}</Math><small>{tokenRange(tile)}</small>
            </button>)}
          </div>
          <div className="flash-player-map-center">
            <div className="flash-player-sequence" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}>
              {tiles.map(tile => <div key={tile.index} data-kv={tile.index} className="flash-player-segment">
                <div className="flash-player-tokens">{Array.from({ length: tile.end - tile.start }, (_, index) => <span key={index} />)}</div>
                <small>{tokenRange(tile)}</small>
              </div>)}
            </div>
            <svg className="flash-player-grid" viewBox={`0 0 ${EXTENT} ${EXTENT}`} role="img" aria-labelledby={`${prefix}-title ${prefix}-description`}>
              <title id={`${prefix}-title`}>{`把 ${SEQUENCE_LENGTH} × ${SEQUENCE_LENGTH} 的 attention 计算划分成 ${QUERY_TILE_SIZE} × ${size} 的 tile`}</title>
              <desc id={`${prefix}-description`}>行是 query，列是 key。固定一条 query 横带，逐块向右扫描 KV；斜线只表示该范围已合并，不表示保存了 score。</desc>
              <defs><pattern id={`${prefix}-merged`} width="6" height="6" patternUnits="userSpaceOnUse"><path d="M -1 1 L 1 -1 M 0 6 L 6 0 M 5 7 L 7 5" className="flash-player-hatch" /></pattern></defs>
              <rect width={EXTENT} height={EXTENT} className="flash-player-grid-bg" />
              {QUERY_TILES.map(query => <g key={query.index} data-map-row={query.index}>
                <rect x="0" y={query.start * UNIT} width={EXTENT} height={(query.end - query.start) * UNIT} className="flash-player-query-band" />
                {tiles.map(tile => <g key={tile.index} data-map-cell={`${query.index}-${tile.index}`}>
                  <rect x={tile.start * UNIT} y={query.start * UNIT} width={(tile.end - tile.start) * UNIT} height={(query.end - query.start) * UNIT} className="flash-player-cell-fill" />
                  <rect x={tile.start * UNIT} y={query.start * UNIT} width={(tile.end - tile.start) * UNIT} height={(query.end - query.start) * UNIT} fill={`url(#${prefix}-merged)`} className="flash-player-cell-merged" />
                </g>)}
              </g>)}
              <path d={TOKEN_LINES} className="flash-player-token-lines" />
              <path d={[
                ...QUERY_TILES.slice(1).map(tile => `M 0 ${tile.start * UNIT} H ${EXTENT}`),
                ...tiles.slice(1).map(tile => `M ${tile.start * UNIT} 0 V ${EXTENT}`),
              ].join(' ')} className="flash-player-tile-lines" />
              <rect data-scan-window="" x="0" y={QUERY_TILES[DEFAULT_QUERY].start * UNIT} width={size * UNIT} height={QUERY_TILE_SIZE * UNIT} className="flash-player-scan-window" visibility="hidden" />
            </svg>
          </div>
          <div className="flash-player-output-axis" style={{ gridTemplateRows: `repeat(${QUERY_TILES.length}, minmax(0, 1fr))` }}>
            {QUERY_TILES.map(tile => <div key={tile.index} data-output={tile.index} aria-label={`输出块 O ${tile.index + 1}，尚未演示`}><Math>{`O_${tile.index + 1}`}</Math><span aria-hidden="true" data-output-mark="">·</span></div>)}
          </div>
        </div>
        <div className="flash-player-legend"><span className="flash-player-legend-current">当前计算</span><span className="flash-player-legend-merged">已合并，仅标记进度</span></div>
      </div>
      <div className="flash-player-flow">
        <div className="flash-player-buffer">
          <strong>临时 <Math>{'S,W'}</Math></strong>
          <div className="flash-player-mini-tile" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, width: `${size * UNIT}px`, aspectRatio: `${size} / ${QUERY_TILE_SIZE}` }} aria-hidden="true">{Array.from({ length: QUERY_TILE_SIZE * size }, (_, cell) => <span key={cell} />)}</div>
          <div><Math>{`${QUERY_TILE_SIZE}\\times ${size}`}</Math></div>
          <span className="flash-player-flow-note" data-field="buffer">尚未读取</span>
        </div>
        <div className="flash-player-merge-arrow" aria-hidden="true">↓ 合入同一份状态</div>
        <div className="flash-player-running">
          <strong><Math>{String.raw`m,\ell,U`}</Math> 跨块保留</strong>
          <div className="flash-player-coverage" aria-hidden="true">{tiles.map(tile => <span key={tile.index} data-coverage={tile.index} />)}</div>
          <span className="flash-player-flow-note">已覆盖 <b data-field="covered">0 / {SEQUENCE_LENGTH}</b> 个 key</span>
        </div>
        <div className="flash-player-merge-arrow" aria-hidden="true">↓ 全部扫完后</div>
        <div className="flash-player-result"><Math>{String.raw`O_i=U/\ell`}</Math><span className="flash-player-flow-note" data-field="result">扫描完才能归一化</span></div>
        <p className="flash-player-cost">每个 Q 块扫描 <strong>{tiles.length}</strong> 次 KV；每次只算一个 <Math>{`${QUERY_TILE_SIZE}\\times ${size}`}</Math> tile。</p>
      </div>
    </div>
  );
}

function FlashForwardInteractive() {
  const frames = buildFrames();
  return (
    <figure className="flash-player" id="flash-forward-interactive" data-flash-forward="" data-phase="partition" aria-labelledby="flash-player-title">
      <figcaption id="flash-player-title"><span className="flash-player-eyebrow">交互演示</span><strong>一条长 sequence，怎样逐块算完？</strong></figcaption>
      <p className="flash-player-intro">点左侧选择 Q 块，观察它怎样扫过整条 KV 序列；也可以改变 KV 块大小。</p>
      <div data-agent-omit="">
        <div className="flash-player-controls" hidden data-controls="">
          <div className="flash-player-buttons"><button type="button" data-action="play" aria-pressed="false">播放</button><button type="button" data-action="previous" disabled>上一步</button><button type="button" data-action="next">下一步</button><button type="button" data-action="reset">重置</button></div>
          <label className="flash-player-size">每块 KV <select data-tile-size="" defaultValue="4" aria-label="每块 KV 的 token 数">{KV_TILE_SIZES.map(size => <option key={size} value={size}>{size} 个 token</option>)}</select></label>
          <label className="flash-player-timeline">进度<input type="range" min="0" max={frames.length - 1} defaultValue="0" aria-label="Forward 动画进度" data-progress="" /><span data-field="progress">1 / {frames.length}</span></label>
        </div>
        <div className="flash-player-stage" aria-live="polite" aria-atomic="true" data-stage=""><strong data-field="title">{frames[1].title}</strong><a href="#flash-forward-queries" data-line-link="">伪代码 <span data-field="lines">01、04</span> 行</a></div>
        <p className="flash-player-explanation" data-field="explanation">{frames[1].explanation}</p>
        {KV_TILE_SIZES.map(size => <TilingBoard key={size} size={size} />)}
      </div>
      <p className="flash-player-caption">图中 {SEQUENCE_LENGTH} 个 token，Q 每 {QUERY_TILE_SIZE} 行一块；KV 每 {KV_TILE_SIZES.join(' 或 ')} 行一块，分别扫描 {KV_TILE_SIZES.map(size => partition(SEQUENCE_LENGTH, size).length).join(' 或 ')} 次。各段依次合入同一份运行状态，扫完后得到对应的 <Math>{String.raw`O_i`}</Math>。大网格只标记计算范围，不保存完整 score 矩阵；本例不加 mask。</p>
    </figure>
  );
}

export const POST_COMPONENTS = { FlashForwardInteractive };
