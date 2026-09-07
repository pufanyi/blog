type Branch = 'query' | 'kv' | 'rope' | 'neutral';

interface DiagramNode {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  tex?: string;
  branch: Branch;
  cached?: boolean;
}

const nodes = {
  input: {
    x: 390,
    y: 650,
    width: 196,
    height: 60,
    title: '输入序列',
    tex: 'X',
    branch: 'neutral',
  },
  queryLatent: {
    x: 174,
    y: 546,
    width: 164,
    height: 68,
    title: 'Query latent',
    tex: 'C_q',
    branch: 'query',
  },
  kvLatent: {
    x: 626,
    y: 546,
    width: 180,
    height: 90,
    title: '共享 KV latent',
    tex: 'C_{kv}',
    branch: 'kv',
    cached: true,
  },
  queryContent: {
    x: 98,
    y: 406,
    width: 132,
    height: 68,
    title: '内容 Query · 各 head',
    tex: 'Q',
    branch: 'query',
  },
  queryRope: {
    x: 244,
    y: 406,
    width: 116,
    height: 68,
    title: 'RoPE Query · 各 head',
    tex: 'Q_R',
    branch: 'rope',
  },
  keyRope: {
    x: 390,
    y: 406,
    width: 132,
    height: 90,
    title: '共享 RoPE Key',
    tex: 'K_R',
    branch: 'rope',
    cached: true,
  },
  keyContent: {
    x: 554,
    y: 406,
    width: 128,
    height: 68,
    title: '内容 Key · 各 head',
    tex: 'K',
    branch: 'kv',
  },
  value: {
    x: 698,
    y: 406,
    width: 128,
    height: 68,
    title: 'Value · 各 head',
    tex: 'V',
    branch: 'kv',
  },
  query: {
    x: 174,
    y: 263,
    width: 244,
    height: 72,
    title: 'Query · 拼接内容与位置',
    tex: '\\begin{bmatrix}Q&Q_R\\end{bmatrix}',
    branch: 'query',
  },
  key: {
    x: 482,
    y: 263,
    width: 244,
    height: 72,
    title: 'Key · 拼接内容与位置',
    tex: '\\begin{bmatrix}K&K_R\\end{bmatrix}',
    branch: 'kv',
  },
  attention: {
    x: 390,
    y: 146,
    width: 724,
    height: 76,
    title: 'Multi-Head Attention',
    branch: 'neutral',
  },
  output: { x: 390, y: 42, width: 180, height: 60, title: '输出', tex: 'O', branch: 'neutral' },
} as const satisfies Record<string, DiagramNode>;

interface DiagramEdge {
  from: keyof typeof nodes;
  to: keyof typeof nodes;
  branch: Branch;
  fromOffset?: number;
  toOffset?: number;
  viaY?: number;
}

const edges = [
  { from: 'input', to: 'queryLatent', branch: 'query', fromOffset: -56, viaY: 606 },
  { from: 'input', to: 'kvLatent', branch: 'kv', fromOffset: 56, viaY: 606 },
  { from: 'input', to: 'keyRope', branch: 'rope' },
  { from: 'queryLatent', to: 'queryContent', branch: 'query', fromOffset: -34, viaY: 482 },
  { from: 'queryLatent', to: 'queryRope', branch: 'rope', fromOffset: 34, viaY: 482 },
  { from: 'kvLatent', to: 'keyContent', branch: 'kv', fromOffset: -28, viaY: 482 },
  { from: 'kvLatent', to: 'value', branch: 'kv', fromOffset: 28, viaY: 482 },
  { from: 'queryContent', to: 'query', branch: 'query', toOffset: -36, viaY: 334 },
  { from: 'queryRope', to: 'query', branch: 'rope', toOffset: 36, viaY: 334 },
  { from: 'keyRope', to: 'key', branch: 'rope', toOffset: -36, viaY: 334 },
  { from: 'keyContent', to: 'key', branch: 'kv', toOffset: 36, viaY: 334 },
  { from: 'query', to: 'attention', branch: 'query', toOffset: nodes.query.x - nodes.attention.x },
  { from: 'key', to: 'attention', branch: 'kv', toOffset: nodes.key.x - nodes.attention.x },
  { from: 'value', to: 'attention', branch: 'kv', toOffset: nodes.value.x - nodes.attention.x },
  { from: 'attention', to: 'output', branch: 'neutral' },
] as const satisfies ReadonlyArray<DiagramEdge>;

const projectionLabels = [
  { x: 254, y: 628, text: '降维投影', branch: 'query' },
  { x: 536, y: 628, text: '降维投影', branch: 'kv' },
  { x: 98, y: 464, text: '展开', branch: 'query' },
  { x: 244, y: 464, text: '投影 + RoPE', branch: 'rope' },
  { x: 390, y: 482, text: '投影 + RoPE', branch: 'rope' },
  { x: 626, y: 464, text: '展开 K / V', branch: 'kv' },
] as const;

function Edge({ from, to, branch, fromOffset = 0, toOffset = 0, viaY }: DiagramEdge) {
  const source = nodes[from];
  const target = nodes[to];
  const start = { x: source.x + fromOffset, y: source.y - source.height / 2 };
  const end = { x: target.x + toOffset, y: target.y + target.height / 2 };
  const bend = viaY === undefined ? '' : `V ${viaY} H ${end.x}`;

  return (
    <path
      data-from={from}
      data-to={to}
      d={`M ${start.x} ${start.y} ${bend} L ${end.x} ${end.y + 2}`}
      className={`mla-edge mla-${branch}`}
      markerEnd={`url(#mla-arrow-${branch})`}
    />
  );
}

function Node({ id, node }: { id: string; node: DiagramNode }) {
  const left = node.x - node.width / 2;
  const top = node.y - node.height / 2;
  const attention = id === 'attention';

  return (
    <g
      data-node={id}
      className={`mla-node mla-${node.branch}${node.cached ? ' mla-node-cached' : ''}`}
    >
      <rect
        x={left}
        y={top}
        width={node.width}
        height={node.height}
        rx="8"
        className="mla-node-box"
      />
      {node.cached && (
        <g>
          <rect
            x={left + 8}
            y={top + 28}
            width="12"
            height={node.height - 36}
            rx="2"
            fill="url(#mla-cache-hatch)"
            className="mla-cache-stripe"
          />
          <rect
            x={left + 7}
            y={top + 6}
            width={node.width - 14}
            height="18"
            rx="3"
            className="mla-cache-badge"
          />
          <text x={node.x} y={top + 19} className="mla-cache-badge-label">
            CACHE
          </text>
        </g>
      )}
      <text
        x={node.x}
        y={top + (attention ? node.height / 2 : node.cached ? 39 : 17)}
        className={attention ? 'mla-attention-title' : 'mla-node-title'}
      >
        {node.title}
      </text>
      {node.tex && (
        <foreignObject
          x={left + 22}
          y={top + (node.cached ? 44 : 23)}
          width={node.width - 44}
          height={node.height - (node.cached ? 48 : 26)}
        >
          <div className="mla-node-math">{`\\(${node.tex}\\)`}</div>
        </foreignObject>
      )}
    </g>
  );
}

function MlaDiagram() {
  return (
    <figure className="mla-figure">
      <div className="mla-legend">
        <span className="mla-query">
          <i className="mla-line-key" />
          Query 分支
        </span>
        <span className="mla-kv">
          <i className="mla-line-key" />
          K/V 内容分支
        </span>
        <span className="mla-rope">
          <i className="mla-line-key" />
          RoPE 分支
        </span>
        <span>
          <i className="mla-cache-key" />
          推理时缓存
        </span>
      </div>
      <div className="mla-scroll-hint">从下往上读 · 横向滑动查看完整结构 →</div>
      <div className="mla-scroll" tabIndex={0} role="region" aria-label="MLA 结构图，可横向滚动">
        <svg
          className="mla-diagram"
          viewBox="0 0 780 700"
          width="780"
          height="700"
          role="img"
          aria-labelledby="mla-title mla-desc"
        >
          <title id="mla-title">MLA：共享压缩 K/V 与独立 RoPE 分支</title>
          <desc id="mla-desc">
            从下往上读。沿用文章的矩阵记号，输入 X 分别压缩成 C_q 和共享的 C_kv。 内容分支为 Q = C_q
            W_q、K = C_kv W_k、V = C_kv W_v。C_q 还生成各 head 的 RoPE Query Q_R；另一条独立分支从 X
            直接投影并应用 RoPE，得到所有 heads 共享的 RoPE Key K_R。Q 与 Q_R、K 与 K_R
            分别沿特征维度拼接，与 V 一起完成多头 attention，拼接各 head 并乘 W_o 得到 O。斜线仅标在
            C_kv 和 K_R 上： 每层的 KV cache 保存这两项随历史 token 累积的行。
          </desc>
          <defs>
            {(['query', 'kv', 'rope', 'neutral'] as const).map((branch) => (
              <marker
                key={branch}
                id={`mla-arrow-${branch}`}
                viewBox="0 0 10 8"
                refX="9"
                refY="4"
                markerWidth="9"
                markerHeight="8"
                markerUnits="userSpaceOnUse"
                orient="auto"
              >
                <path d="M 0 0 L 10 4 L 0 8 Z" className={`mla-arrowhead mla-${branch}`} />
              </marker>
            ))}
            <pattern id="mla-cache-hatch" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M-1 1L1-1M0 5L5 0M4 6L6 4" className="mla-hatch" />
            </pattern>
          </defs>
          {edges.map((edge) => (
            <Edge key={`${edge.from}-${edge.to}`} {...edge} />
          ))}
          {Object.entries(nodes).map(([id, node]) => (
            <Node key={id} id={id} node={node} />
          ))}
          {projectionLabels.map(({ x, y, text, branch }) => (
            <text key={`${x}-${y}`} x={x} y={y} className={`mla-projection-label mla-${branch}`}>
              {text}
            </text>
          ))}
        </svg>
      </div>
      <div className="mla-cache-summary">
        <i className="mla-cache-key" aria-hidden="true" />
        <span>每层的 KV cache</span>
        <strong>
          {`\\(${nodes.kvLatent.tex}\\)`}
          <span> 和 </span>
          {`\\(${nodes.keyRope.tex}\\)`}
        </strong>
      </div>
      <figcaption>
        从下往上读，沿用上文的矩阵记号：内容分支为 {'\\(Q=C_qW_q\\)'}、{'\\(K=C_{kv}W_k\\)'}、
        {'\\(V=C_{kv}W_v\\)'}。下标 {'\\(R\\)'} 表示额外的 RoPE 分支，其中 {'\\(K_R\\)'} 在所有
        heads 间共享；方括号表示沿特征维度拼接。图中展开 K/V 是为了展示结构；推理时可将
        {'\\(W_k\\)'} 吸收到 Query 侧，将 {'\\(W_v\\)'} 吸收到输出投影 {'\\(W_o\\)'} 中，
        无需缓存展开后的多头 K/V。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { MlaDiagram };
