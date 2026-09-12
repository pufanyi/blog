interface TreeNode {
  id: number;
  beavers: number;
  x: number;
  y: number;
}

// Codeforces 77C, first sample. Coordinates only affect the presentation.
const root = 4;
const nodes: TreeNode[] = [
  { id: 1, beavers: 1, x: 400, y: 315 },
  { id: 2, beavers: 3, x: 240, y: 315 },
  { id: 3, beavers: 1, x: 80, y: 195 },
  { id: 4, beavers: 3, x: 200, y: 75 },
  { id: 5, beavers: 2, x: 320, y: 195 },
];
const edges = [
  [2, 5],
  [3, 4],
  [4, 5],
  [1, 5],
] as const;
const radius = 36;
const nodeById = new Map(nodes.map((node) => [node.id, node]));

function SampleTreeDiagram() {
  return (
    <figure className="cf77c-tree-figure">
      <div
        className="cf77c-tree-scroll"
        role="region"
        aria-label="样例一的树结构，小屏幕可横向滚动"
        tabIndex={0}
      >
        <svg
          className="cf77c-tree"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 480 370"
          width="480"
          height="370"
          role="img"
          aria-labelledby="cf77c-tree-title cf77c-tree-desc"
        >
          <title id="cf77c-tree-title">样例一的树结构</title>
          <desc id="cf77c-tree-desc">
            {`根节点为 ${root}。${nodes.map((node) => `节点 ${node.id} 有 ${node.beavers} 只海狸`).join('，')}。无向边为 ${edges.map(([from, to]) => `${from}—${to}`).join('、')}。每个节点标记中的括号内数字表示海狸数量。`}
          </desc>
          {edges.map(([fromId, toId]) => {
            const from = nodeById.get(fromId)!;
            const to = nodeById.get(toId)!;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const inset = (radius + 3) / Math.hypot(dx, dy);
            return (
              <line
                key={`${fromId}-${toId}`}
                className="cf77c-tree-edge"
                x1={from.x + dx * inset}
                y1={from.y + dy * inset}
                x2={to.x - dx * inset}
                y2={to.y - dy * inset}
              />
            );
          })}
          {nodes.map((node) => (
            <g
              key={node.id}
              className={`cf77c-tree-node${node.id === root ? ' cf77c-tree-root' : ''}`}
            >
              <circle cx={node.x} cy={node.y} r={radius} />
              <text x={node.x} y={node.y} className="cf77c-tree-value">
                <tspan className="cf77c-tree-index">{node.id}</tspan>
                <tspan className="cf77c-tree-count">{`(${node.beavers})`}</tspan>
              </text>
              {node.id === root && (
                <text x={node.x} y={node.y - radius - 15} className="cf77c-tree-root-label">
                  根节点
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <figcaption>
        {`样例一：节点记为 \\(i(k_i)\\)，括号内为海狸数量；根节点 \\(s=${root}\\)。`}
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { SampleTreeDiagram };
