const nodes = [
  { id: 'A', x: 65, y: 80 },
  { id: 'B', x: 235, y: 80 },
  { id: 'C', x: 405, y: 80 },
  { id: 'D', x: 235, y: 255 },
] as const;
const edges = [
  { from: 'A', to: 'B', cost: 1, labelX: 150, labelY: 62 },
  { from: 'B', to: 'C', cost: 1, labelX: 320, labelY: 62 },
  { from: 'C', to: 'D', cost: 2, labelX: 335, labelY: 184 },
  { from: 'B', to: 'D', cost: 5, labelX: 216, labelY: 173 },
  { from: 'A', to: 'D', cost: 7, labelX: 135, labelY: 184 },
] as const;

function NetworkTopology() {
  return (
    <figure className="csnet-figure">
      <div className="csnet-scroll" role="region" aria-label="可横向滚动的路由拓扑" tabIndex={0}>
        <svg
          className="csnet-topology"
          viewBox="0 0 470 310"
          role="img"
          aria-labelledby="csnet-topology-title csnet-topology-desc"
        >
          <title id="csnet-topology-title">四节点双向网络的链路代价</title>
          <desc id="csnet-topology-desc">
            {edges.map((edge) => `${edge.from} 到 ${edge.to} 的双向代价为 ${edge.cost}`).join('；')}
            。 D 为目的节点。边没有箭头，因为表示物理邻接而非选定的转发方向。
          </desc>
          {edges.map((edge) => {
            const from = nodes.find((node) => node.id === edge.from)!;
            const to = nodes.find((node) => node.id === edge.to)!;
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="csnet-edge" />
                <text x={edge.labelX} y={edge.labelY} className="csnet-cost">
                  {edge.cost}
                </text>
              </g>
            );
          })}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="23"
                className={node.id === 'D' ? 'csnet-node csnet-destination' : 'csnet-node'}
              />
              <text x={node.x} y={node.y + 6} className="csnet-label">
                {node.id}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption>
        双向链路：{edges.map((edge) => `${edge.from}–${edge.to}：${edge.cost}`).join('，')}。
        数字是可加 cost，不是 bandwidth。后面的 DV 和 Dijkstra 使用同一张图。
      </figcaption>
    </figure>
  );
}

const packetParts = [
  { x: 125, width: 100, label: 'IP A → B', kind: 'csnet-ip' },
  { x: 225, width: 90, label: 'TCP', kind: 'csnet-tcp' },
  { x: 315, width: 190, label: 'Application data', kind: 'csnet-data' },
] as const;

function NetworkEncapsulation() {
  return (
    <figure className="csnet-figure">
      <div className="csnet-scroll" role="region" aria-label="可横向滚动的逐跳封装图" tabIndex={0}>
        <svg
          className="csnet-packets"
          viewBox="0 0 640 245"
          role="img"
          aria-labelledby="csnet-packets-title csnet-packets-desc"
        >
          <title id="csnet-packets-title">跨越 router 时重新封装链路层</title>
          <desc id="csnet-packets-desc">
            第一行是 A 到 router 的链路帧，第二行是 router 到 B 的链路帧。两行的链路 header 和
            trailer 不同；IP 源和目的地址仍为 A 与 B，但 TTL 会递减。TCP 与应用数据不由普通 router
            终止。
          </desc>
          {[
            { y: 45, label: 'A → router', link: 'L2 in' },
            { y: 170, label: 'router → B', link: 'L2 out' },
          ].map((row) => (
            <g key={row.link}>
              <text x="35" y={row.y - 13} className="csnet-row-label">
                {row.label}
              </text>
              <rect x="35" y={row.y} width="90" height="42" className="csnet-link" />
              <text x="80" y={row.y + 26} className="csnet-packet-label">
                {row.link}
              </text>
              {packetParts.map((part) => (
                <g key={part.label}>
                  <rect x={part.x} y={row.y} width={part.width} height="42" className={part.kind} />
                  <text x={part.x + part.width / 2} y={row.y + 26} className="csnet-packet-label">
                    {part.label}
                  </text>
                </g>
              ))}
              <rect x="505" y={row.y} width="100" height="42" className="csnet-link" />
              <text x="555" y={row.y + 26} className="csnet-packet-label">
                L2 trailer
              </text>
            </g>
          ))}
          <path d="M 175 92 V 152 M 170 146 L 175 152 L 180 146" className="csnet-change" />
          <text x="196" y="127" className="csnet-row-label">
            IP lookup · TTL − 1 · new L2 frame
          </text>
        </svg>
      </div>
      <figcaption>
        简化为一个 router：去除入站 L2 封装，查询 IP 目的地址，再添加出站 L2 封装。 IP 地址维持 A →
        B，TTL 递减；TCP 与应用数据继续送往端点。框宽不代表字段实际长度。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { NetworkTopology, NetworkEncapsulation };
