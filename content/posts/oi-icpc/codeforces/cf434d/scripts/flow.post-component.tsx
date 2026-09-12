import type { ReactNode } from 'react';

interface Point {
  x: number;
  y: number;
}

interface FlowNode extends Point {
  id: string;
  label: string;
  width?: number;
  height?: number;
  sentinel?: boolean;
}

interface FlowEdge {
  from: string;
  to: string;
  capacity: number;
  label?: string;
  labelAt?: Point;
  path?: string;
  cutAt?: Point;
  bypass?: boolean;
  constraint?: boolean;
  omitted?: boolean;
}

interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const tones = ['ordinary', 'constraint', 'cut', 'bypass'] as const;
const WIDTH = 700;
const NODE_HEIGHT = 42;
const GAP = 5;

function terminal(id: 'S' | 'T', y: number): FlowNode {
  return { id, label: id, x: id === 'S' ? 38 : 662, y, width: 44, height: 60 };
}

function port(node: FlowNode, side: 'left' | 'right' | 'top' | 'bottom', offset = 0): Point {
  const halfWidth = (node.width ?? 76) / 2;
  const halfHeight = (node.height ?? NODE_HEIGHT) / 2;
  if (side === 'left' || side === 'right') {
    return { x: node.x + (side === 'left' ? -1 : 1) * (halfWidth + GAP), y: node.y + offset };
  }
  return { x: node.x + offset, y: node.y + (side === 'top' ? -1 : 1) * (halfHeight + GAP) };
}

function sourcePath(source: FlowNode, node: FlowNode, offset: number): string {
  const start = port(source, 'right', offset);
  const end = port(node, 'left');
  const bendX = (start.x + end.x) / 2;
  return `M ${start.x} ${start.y} C ${bendX} ${start.y} ${bendX} ${end.y} ${end.x} ${end.y}`;
}

function sourceLabel(source: FlowNode, node: FlowNode, offset: number): Point {
  const start = port(source, 'right', offset);
  const end = port(node, 'left');
  if (start.y === end.y) return { x: end.x - 9, y: start.y - 30 };
  // Offset the label from the midpoint along the curve's outward normal.
  const dx = 0.75 * (end.x - start.x);
  const dy = 1.5 * (end.y - start.y);
  const length = Math.hypot(dx, dy);
  return {
    x: (start.x + end.x) / 2 - (26 * Math.abs(dy)) / length,
    y: (start.y + end.y) / 2 + (26 * Math.sign(dy) * dx) / length,
  };
}

// Keep a horizontal run for labels and cut marks, then enter T at distinct ports.
function sinkPath(node: FlowNode, sink: FlowNode, offset: number): string {
  const start = port(node, 'right');
  const end = port(sink, 'left', offset);
  return `M ${start.x} ${start.y} H 600 C 623 ${start.y} 623 ${end.y} ${end.x} ${end.y}`;
}

function MathLabel({ x, y, text, width = 130 }: Point & { text: string; width?: number }) {
  return (
    <foreignObject x={x - width / 2} y={y - 20} width={width} height="40">
      <div className="cf434d-math">{`\\(${text}\\)`}</div>
    </foreignObject>
  );
}

function Edge({ edge, graph, id }: { edge: FlowEdge; graph: FlowGraph; id: string }) {
  const from = graph.nodes.find((node) => node.id === edge.from)!;
  const to = graph.nodes.find((node) => node.id === edge.to)!;
  const start = port(from, 'right');
  const end = port(to, 'left');
  const path = edge.path ?? `M ${start.x} ${start.y} H ${end.x}`;
  const tone = edge.cutAt
    ? 'cut'
    : edge.bypass
      ? 'bypass'
      : edge.constraint
        ? 'constraint'
        : 'ordinary';

  return (
    <g className={`cf434d-${tone}`} data-from={edge.from} data-to={edge.to}>
      <path
        className={`cf434d-edge${edge.omitted ? ' cf434d-omitted' : ''}`}
        d={path}
        markerEnd={`url(#${id}-${tone})`}
      />
      {edge.cutAt && (
        <path
          className="cf434d-cut-mark"
          d={`M ${edge.cutAt.x - 7} ${edge.cutAt.y + 7} l 6 -14 M ${edge.cutAt.x + 1} ${edge.cutAt.y + 7} l 6 -14`}
        />
      )}
      {edge.label && edge.labelAt && <MathLabel {...edge.labelAt} text={edge.label} />}
    </g>
  );
}

function Graph({ graph, id }: { graph: FlowGraph; id: string }) {
  return (
    <>
      <defs>
        {tones.map((tone) => (
          <marker
            key={tone}
            id={`${id}-${tone}`}
            className={`cf434d-${tone}`}
            viewBox="0 0 10 8"
            refX="10"
            refY="4"
            markerWidth="10"
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M 0 0 L 10 4 L 0 8 Z" className="cf434d-arrowhead" />
          </marker>
        ))}
      </defs>
      {graph.edges.map((edge) => (
        <Edge key={`${edge.from}-${edge.to}`} edge={edge} graph={graph} id={id} />
      ))}
      {graph.nodes.map((node) => (
        <g key={node.id} className={node.sentinel ? 'cf434d-node cf434d-sentinel' : 'cf434d-node'}>
          {node.label !== '\\cdots' && (
            <rect
              x={node.x - (node.width ?? 76) / 2}
              y={node.y - (node.height ?? NODE_HEIGHT) / 2}
              width={node.width ?? 76}
              height={node.height ?? NODE_HEIGHT}
              rx="10"
            />
          )}
          <MathLabel {...node} text={node.label} width={node.width ?? 76} />
          {node.sentinel && (
            <text x={node.x} y={node.y + 42} className="cf434d-note">
              新增
            </text>
          )}
        </g>
      ))}
    </>
  );
}

function FlowFigure({
  id,
  title,
  description,
  height,
  graph,
  caption,
  cut = false,
  bypass = false,
}: {
  id: string;
  title: string;
  description: string;
  height: number;
  graph: FlowGraph;
  caption: ReactNode;
  cut?: boolean;
  bypass?: boolean;
}) {
  return (
    <figure className="cf434d-figure">
      <div className="cf434d-heading">{title}</div>
      <div className="cf434d-scroll" role="region" aria-label={`${title}，可横向滚动`} tabIndex={0}>
        <svg
          className="cf434d-diagram"
          xmlns="http://www.w3.org/2000/svg"
          width={WIDTH}
          height={height - 42}
          viewBox={`0 42 ${WIDTH} ${height - 42}`}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <Graph graph={graph} id={id} />
        </svg>
      </div>
      <div className="cf434d-legend" aria-hidden="true">
        <span>
          <i className="cf434d-key cf434d-ordinary" />
          链上的边
        </span>
        {graph.edges.some((edge) => edge.omitted) && (
          <span>
            <i className="cf434d-key cf434d-key-omitted" />
            省略链段
          </span>
        )}
        {graph.edges.some((edge) => edge.constraint) && (
          <span>
            <i className="cf434d-key cf434d-constraint" />
            约束边：{'\\(\\infty\\)'}
          </span>
        )}
        {cut && (
          <span>
            <i className="cf434d-key cf434d-cut">∕∕</i>尝试割掉的边
          </span>
        )}
        {bypass && (
          <span>
            <i className="cf434d-key cf434d-bypass" />
            仍然连通的路径
          </span>
        )}
      </div>
      <figcaption>
        {caption}
        <span className="cf434d-scroll-hint">左右滑动查看完整图示</span>
      </figcaption>
    </figure>
  );
}

function IndependentChainsDiagram() {
  const source = terminal('S', 222);
  const sink = terminal('T', 222);
  const graph: FlowGraph = { nodes: [source, sink], edges: [] };
  for (const i of [1, 2, 3]) {
    const y = 100 + (i - 1) * 122;
    const first = { id: `${i}-l`, label: `(${i},l_${i})`, x: 164, y, width: 82 };
    const next = { id: `${i}-next`, label: `(${i},l_${i}+1)`, x: 334, y, width: 106 };
    const last = { id: `${i}-r`, label: `(${i},r_${i})`, x: 530, y, width: 82 };
    const labelY = y + (i === 3 ? 30 : -30);
    graph.nodes.push(first, next, last);
    graph.edges.push(
      {
        from: 'S',
        to: first.id,
        capacity: Infinity,
        label: '\\infty',
        labelAt: sourceLabel(source, first, (i - 2) * 14),
        path: sourcePath(source, first, (i - 2) * 14),
      },
      {
        from: first.id,
        to: next.id,
        capacity: 1,
        label: `c_${i}(l_${i})`,
        labelAt: { x: 245, y: y - 30 },
      },
      { from: next.id, to: last.id, capacity: 1, omitted: true },
      {
        from: last.id,
        to: 'T',
        capacity: 1,
        label: `c_${i}(r_${i})`,
        labelAt: { x: 588, y: labelY },
        path: sinkPath(last, sink, (i - 2) * 14),
      },
    );
  }
  return (
    <FlowFigure
      id="cf434d-chains"
      title="每个函数对应一条从 S 到 T 的链"
      description="三条独立的函数链共享源点 S 和汇点 T。源点到每条链的起点容量为无穷大；从 (i,j) 出发的有限边容量为 lim 减 f_i(j)。割掉这条边代表选择 x_i 等于 j。点线省略中间的节点及边。"
      height={413}
      graph={graph}
      caption={
        '记 \\(c_i(j)=lim-f_i(j)\\)。每条链割一条有限边，即选择对应的 \\(x_i=j\\)。点线省略中间节点及边。'
      }
    />
  );
}

function ConstraintCutDiagram() {
  const source = terminal('S', 218);
  const sink = terminal('T', 218);
  const graph: FlowGraph = { nodes: [source, sink], edges: [] };
  const rows = [
    ['u', 108],
    ['v', 328],
  ] as const;
  for (const [row, y] of rows) {
    const nodes = Array.from({ length: 3 }, (_, k) => {
      const value = `${row === 'u' ? 'x' : 'x-d'}${k ? `+${k}` : ''}`;
      return { id: `${row}${k}`, label: `(${row},${value})`, x: 174 + k * 176, y, width: 126 };
    });
    graph.nodes.push(...nodes);
    const [first, middle, last] = nodes as [FlowNode, FlowNode, FlowNode];
    const offset = row === 'u' ? -14 : 14;
    graph.edges.push(
      {
        from: 'S',
        to: first.id,
        capacity: 1,
        path: sourcePath(source, first, offset),
        bypass: row === 'u',
        omitted: true,
      },
      {
        from: first.id,
        to: middle.id,
        capacity: 1,
        cutAt: row === 'v' ? { x: (first.x + middle.x) / 2, y } : undefined,
        bypass: row === 'u',
      },
      {
        from: middle.id,
        to: last.id,
        capacity: 1,
        cutAt: row === 'u' ? { x: (middle.x + last.x) / 2, y } : undefined,
        bypass: row === 'v',
      },
      {
        from: last.id,
        to: 'T',
        capacity: 1,
        path: sinkPath(last, sink, offset),
        bypass: row === 'v',
        omitted: true,
      },
    );
  }
  for (let k = 0; k < 3; k++) {
    const from = graph.nodes.find((node) => node.id === `u${k}`)!;
    const to = graph.nodes.find((node) => node.id === `v${k}`)!;
    const start = port(from, 'bottom');
    const end = port(to, 'top');
    graph.edges.push({
      from: from.id,
      to: to.id,
      capacity: Infinity,
      label: '\\infty',
      labelAt: { x: start.x + 26, y: (start.y + end.y) / 2 },
      path: `M ${start.x} ${start.y} V ${end.y}`,
      constraint: true,
      bypass: k === 1,
    });
  }
  return (
    <FlowFigure
      id="cf434d-constraint"
      title="违反限制时，两条割边之间仍有旁路"
      description="尝试割掉 u 链的 (u,x+1) 到 (u,x+2) 和 v 链的 (v,x-d) 到 (v,x-d+1)。由 (u,x+1) 到 (v,x-d+1) 的无穷容量边可以绕过这两条割边，S 到 T 仍连通。两侧点线省略链的其余部分。"
      height={379}
      graph={graph}
      cut
      bypass
      caption={
        '绿色双斜杠对应 \\(x_u=x+1\\)、\\(x_v=x-d\\)，违反 \\(x_u\\le x_v+d\\)。玫瑰色路径绕过两条割边，所以这不是一个 S–T 割。两侧点线省略链的其余部分。'
      }
    />
  );
}

// The two example figures, their capacities and their cuts share this input.
export const example = {
  lim: 10,
  functions: [
    { id: 1, l: 2, r: 3, a: 0, b: 1, c: 0 },
    { id: 2, l: 1, r: 2, a: 0, b: 1, c: 1 },
  ],
  constraints: [
    { u: 1, v: 2, d: 0 },
    { u: 2, v: 1, d: 0 },
  ],
};

export function createExampleGraph(sentinels: boolean): FlowGraph {
  const source = terminal('S', 214);
  const sink = terminal('T', 214);
  const graph: FlowGraph = { nodes: [source, sink], edges: [] };
  for (const fn of example.functions) {
    const y = fn.id === 1 ? 104 : 324;
    const end = fn.r + Number(sentinels);
    const offset = fn.id === 1 ? -14 : 14;
    for (let j = fn.l; j <= end; j++) {
      graph.nodes.push({
        id: `${fn.id}:${j}`,
        label: `(${fn.id},${j})`,
        x: 148 + 136 * (j - 1),
        y,
        width: 72,
        sentinel: j > fn.r,
      });
    }
    const first = graph.nodes.find((node) => node.id === `${fn.id}:${fn.l}`)!;
    graph.edges.push({
      from: 'S',
      to: first.id,
      capacity: Infinity,
      label: '\\infty',
      labelAt: sourceLabel(source, first, offset),
      path: sourcePath(source, first, offset),
    });
    for (let j = fn.l; j <= end; j++) {
      const node = graph.nodes.find((node) => node.id === `${fn.id}:${j}`)!;
      const isTerminal = j === end;
      const capacity = j > fn.r ? Infinity : example.lim - (fn.a * j * j + fn.b * j + fn.c);
      const cut = j === (sentinels ? 2 : fn.r);
      const midX = isTerminal ? (port(node, 'right').x + 600) / 2 : node.x + 68;
      graph.edges.push({
        from: node.id,
        to: isTerminal ? 'T' : `${fn.id}:${j + 1}`,
        capacity,
        label: capacity === Infinity ? '\\infty' : `lim-${example.lim - capacity}`,
        labelAt:
          isTerminal && j === 4
            ? { x: port(sink, 'left', offset).x + 15, y: (y + sink.y + offset) / 2 }
            : { x: midX, y: y - 31 },
        path: isTerminal ? sinkPath(node, sink, offset) : undefined,
        cutAt: cut ? { x: midX, y } : undefined,
      });
    }
  }
  for (const { u, v, d } of example.constraints) {
    const fn = example.functions.find((fn) => fn.id === u)!;
    for (let j = fn.l; j <= fn.r + Number(sentinels); j++) {
      const from = graph.nodes.find((node) => node.id === `${u}:${j}`)!;
      const target = graph.nodes.find((node) => node.id === `${v}:${j - d}`);
      if (!target) continue;
      const down = u === 1;
      const offset = down ? -9 : 9;
      const start = port(from, down ? 'bottom' : 'top', offset);
      const end = port(target, down ? 'top' : 'bottom', offset);
      graph.edges.push({
        from: from.id,
        to: target.id,
        capacity: Infinity,
        label: '\\infty',
        labelAt: { x: start.x + (down ? -23 : 23), y: (start.y + end.y) / 2 },
        path: `M ${start.x} ${start.y} V ${end.y}`,
        constraint: true,
      });
    }
  }
  return graph;
}

function MissingEndpointDiagram() {
  return (
    <FlowFigure
      id="cf434d-missing-endpoint"
      title="补点前：两条链可以选出不相等的值"
      description="按文中的两函数反例建图。第一条链有 (1,2) 和 (1,3)，第二条链有 (2,1) 和 (2,2)。只有值为 2 的节点之间有双向无穷容量边。割掉 (1,3) 到 T 和 (2,2) 到 T，错误地允许 x₁=3、x₂=2。"
      height={395}
      graph={createExampleGraph(false)}
      cut
      caption={
        '此时 \\(x_1=3\\)、\\(x_2=2\\)，收益为 \\(3+(2+1)=6\\)。但限制要求 \\(x_1=x_2\\)；缺少 \\((2,3)\\)，就无法阻止这个非法选择。'
      }
    />
  );
}

function SentinelEndpointDiagram() {
  return (
    <FlowFigure
      id="cf434d-sentinel"
      title="补点后：约束延伸到区间右端点之外"
      description="新增 (1,4) 和 (2,3)，它们分别通过无穷容量边连接 T。新增 (1,3) 与 (2,3) 间的双向无穷容量边。合法最小割为 (1,2) 到 (1,3) 和 (2,2) 到 (2,3)，对应 x₁=x₂=2。"
      height={390}
      graph={createExampleGraph(true)}
      cut
      caption={
        '新增点 \\((i,r_i+1)\\) 以 \\(\\infty\\) 连向 T。此时只有 \\(x_1=x_2=2\\) 合法，最小割为 \\((lim-2)+(lim-3)\\)，最大收益为 \\(5\\)。'
      }
    />
  );
}

export const POST_COMPONENTS = {
  IndependentChainsDiagram,
  ConstraintCutDiagram,
  MissingEndpointDiagram,
  SentinelEndpointDiagram,
};
