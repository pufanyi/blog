import { label } from './ideas-primitives';
import {
  costLabel,
  dijkstraFrames,
  distanceVectorFrames,
  failureFrames,
  networkEdges,
  networkNodes,
  prefixLookup,
  prefixRoutes,
  type RoutingFrame,
} from './routing-model';

function RoutingGraph({ kind, frame }: { kind: string; frame: RoutingFrame }) {
  const failure = kind === 'failure';
  const nodes = failure
    ? [
        { id: 'D', x: 65, y: 130 },
        { id: 'A', x: 235, y: 130 },
        { id: 'B', x: 405, y: 130 },
      ]
    : networkNodes;
  const edges = failure
    ? [
        { from: 'D', to: 'A', cost: 1, labelX: 150, labelY: 110 },
        { from: 'A', to: 'B', cost: 1, labelX: 320, labelY: 110 },
      ]
    : networkEdges;
  return (
    <svg
      className="csnet-routing-graph"
      viewBox="0 0 470 330"
      role="img"
      aria-labelledby={`csnet-${kind}-title csnet-${kind}-desc`}
    >
      <title id={`csnet-${kind}-title`}>
        {kind === 'dijkstra' ? 'Dijkstra 从 A 出发的前驱树' : '到 D 的距离和下一跳'}
      </title>
      <desc id={`csnet-${kind}-desc`} data-frame-description>
        {frame.explanation}
      </desc>
      <defs>
        <marker
          id={`csnet-${kind}-tip`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 1 1 L 9 5 L 1 9" className="csnet-flow" />
        </marker>
      </defs>
      {edges.map((edge) => {
        const from = nodes.find((node) => node.id === edge.from)!;
        const to = nodes.find((node) => node.id === edge.to)!;
        return (
          <g key={`${edge.from}${edge.to}`}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="csnet-physical" />
            {label(edge.labelX, edge.labelY, String(edge.cost))}
          </g>
        );
      })}
      {edges
        .flatMap((edge) => [
          [edge.from, edge.to],
          [edge.to, edge.from],
        ])
        .map(([fromId, toId]) => {
          const from = nodes.find((node) => node.id === fromId)!;
          const to = nodes.find((node) => node.id === toId)!;
          const dx = to.x - from.x,
            dy = to.y - from.y,
            length = Math.hypot(dx, dy);
          const offset = failure ? 7 : 0;
          const ox = (-dy / length) * offset,
            oy = (dx / length) * offset;
          return (
            <line
              key={`${fromId}${toId}`}
              data-route-edge={`${fromId}-${toId}`}
              visibility={
                frame.arrows.some(([a, b]) => a === fromId && b === toId) ? 'visible' : 'hidden'
              }
              x1={from.x + (dx / length) * 26 + ox}
              y1={from.y + (dy / length) * 26 + oy}
              x2={to.x - (dx / length) * 29 + ox}
              y2={to.y - (dy / length) * 29 + oy}
              className="csnet-flow"
              markerEnd={`url(#csnet-${kind}-tip)`}
            />
          );
        })}
      {failure && (
        <text
          x="150"
          y="140"
          visibility={frame.failed ? 'visible' : 'hidden'}
          data-failed-link
          className="csnet-error-label"
        >
          ×
        </text>
      )}
      {nodes.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r="23"
            data-settled-node={node.id}
            className={frame.settled.includes(node.id) ? 'csnet-node csnet-settled' : 'csnet-node'}
          />
          {label(node.x, node.y + 6, node.id)}
          <text
            x={node.x}
            y={failure || node.id === 'D' ? node.y + 48 : node.y - 35}
            className="csnet-packet-label"
            data-node-cost={node.id}
          >
            {costLabel(frame.routes[node.id].cost)}
          </text>
        </g>
      ))}
    </svg>
  );
}
function RoutingPlayer({ kind }: { kind: 'dv' | 'failure' | 'dijkstra' }) {
  const frames =
    kind === 'dv'
      ? distanceVectorFrames()
      : kind === 'failure'
        ? failureFrames(false)
        : dijkstraFrames();
  const frame = frames[0];
  return (
    <figure
      className="csnet-figure csnet-player"
      data-routing-player={kind}
      data-post-enhancement="routing"
    >
      <div data-player-controls hidden data-agent-omit className="csnet-controls">
        {kind === 'failure' && (
          <label>
            通告规则{' '}
            <select data-poison-mode defaultValue="plain">
              <option value="plain">普通 DV：不改写报告</option>
              <option value="poison">Poison reverse</option>
            </select>
          </label>
        )}
        <button type="button" data-action="previous">
          上一步
        </button>
        <button type="button" data-action="next">
          下一步
        </button>
        <button type="button" data-action="play" aria-pressed="false">
          播放
        </button>
        <button type="button" data-action="reset">
          重置
        </button>
        <label>
          进度 <input type="range" data-progress min="0" max={frames.length - 1} defaultValue="0" />
        </label>
      </div>
      <div className="csnet-player-stage" aria-live="polite" data-player-stage>
        <p>
          <strong data-frame-title>{frame.title}</strong>{' '}
          <span data-frame-progress>1 / {frames.length}</span>
        </p>
        <RoutingGraph kind={kind} frame={frame} />
        <p data-frame-explanation>{frame.explanation}</p>
      </div>
      <figcaption>
        {kind === 'dv'
          ? '同步 DV：数字是到 D 的估计，箭头是当前 next hop。每轮只读取上一轮报告，不能偷偷使用本轮刚算出的值。'
          : kind === 'failure'
            ? '故障 DV：选定 D—A—B 的消息交错，演示陈旧依赖怎样自我支撑。切换规则比较 poison reverse；自动播放需主动开启，也可逐步查看。'
            : 'Dijkstra：数字是从 A 出发的当前候选距离，实心节点已固定。箭头是前驱树从根向外的方向，与 DV 图中去 D 的方向不同。'}
      </figcaption>
      <details>
        <summary>完整静态演算记录</summary>
        <div className="csnet-transcript">
          <table>
            <thead>
              <tr>
                <th>步骤</th>
                <th>状态（cost / via）</th>
                <th>解释</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((step, i) => (
                <tr key={step.title}>
                  <td>
                    {i + 1}：{step.title}
                  </td>
                  <td>
                    {Object.entries(step.routes)
                      .map(([id, route]) => `${id}=${costLabel(route.cost)}/${route.via ?? '—'}`)
                      .join('；')}
                  </td>
                  <td>{step.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {kind === 'failure' && (
          <p>
            Poison reverse 对照：B 向 A 报 ∞，A 没有可用备用路线；A 再向 B 报 ∞ 后，B
            也撤销路线。它只排除这次二节点相互依赖，不保证任意拓扑无环。
          </p>
        )}
      </details>
    </figure>
  );
}
const DistanceVectorDemo = () => <RoutingPlayer kind="dv" />;
const FailureDemo = () => <RoutingPlayer kind="failure" />;
const DijkstraDemo = () => <RoutingPlayer kind="dijkstra" />;

function PrefixExplorer() {
  const result = prefixLookup('192.0.3.42')!;
  return (
    <figure
      className="csnet-figure csnet-prefix"
      data-prefix-explorer
      data-post-enhancement="routing"
    >
      <div className="csnet-controls" data-prefix-controls hidden data-agent-omit>
        <label>
          目的 IPv4{' '}
          <input data-address defaultValue="192.0.3.42" spellCheck={false} inputMode="decimal" />
        </label>
        <label>
          <input type="checkbox" data-withdraw />
          撤回 /24
        </label>
      </div>
      <div className="csnet-scroll" role="region" aria-label="CIDR 前缀嵌套" tabIndex={0}>
        <svg
          className="csnet-idea"
          viewBox="0 0 680 205"
          role="img"
          aria-labelledby="csnet-prefix-title csnet-prefix-desc"
        >
          <title id="csnet-prefix-title">更长的前缀细化同一个地址范围</title>
          <desc id="csnet-prefix-desc">
            /23固定第三字节前7位0000001，最后一位0和1分别属于2和3两个/24；第三字节3且第四字节42是/32例外。
          </desc>
          <rect x="25" y="25" width="630" height="160" rx="5" className="csnet-ip" />
          {label(340, 50, '192.0.2.0/23 → P：第三字节 0000001*')}
          <rect x="40" y="72" width="283" height="98" rx="5" className="csnet-data" />
          {label(181, 97, '192.0.2.0/24')}
          {label(181, 125, '00000010 · 沿用 P')}
          <rect x="338" y="72" width="302" height="98" rx="5" className="csnet-link" />
          <text x="489" y="97" className="csnet-packet-label" data-prefix-region-label>
            192.0.3.0/24 → Q
          </text>
          {label(489, 122, '00000011')}
          <rect x="370" y="134" width="238" height="28" rx="4" className="csnet-tcp" />
          {label(489, 154, '192.0.3.42/32 → R')}
        </svg>
      </div>
      <div aria-live="polite">
        <p data-prefix-result>192.0.3.42 → {result.action}（匹配中选择 /32）</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>前缀</th>
            <th>动作</th>
            <th>本次 lookup</th>
          </tr>
        </thead>
        <tbody>
          {prefixRoutes.map((route, i) => (
            <tr
              key={route.prefix}
              data-prefix-row={i}
              data-winner={result.winner === i ? 'true' : 'false'}
            >
              <td>{route.prefix}</td>
              <td>{route.action}</td>
              <td data-prefix-status>
                {result.winner === i ? '选中' : result.matches[i] ? '匹配' : '不匹配'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption>
        范围嵌套决定 specificity，与路径 cost
        无关。静态例子：192.0.2.8→P；192.0.3.9→Q；192.0.3.42→R。撤回 /24 后，.3.9 回落到 P，.3.42
        仍走 R。图中面积不按地址数量比例绘制。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = {
  DistanceVectorDemo,
  FailureDemo,
  DijkstraDemo,
  PrefixExplorer,
};
