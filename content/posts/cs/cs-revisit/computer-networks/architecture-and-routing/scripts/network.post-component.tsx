import { networkEdges as edges, networkNodes as nodes } from './routing-model';

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

function PacketJourney() {
  return (
    <figure className="csnet-figure">
      <div
        className="csnet-scroll"
        role="region"
        aria-label="可横向滚动的 packet 传输图"
        tabIndex={0}
      >
        <svg
          className="csnet-journey"
          viewBox="0 0 760 710"
          role="img"
          aria-labelledby="csnet-journey-title csnet-journey-desc"
        >
          <title id="csnet-journey-title">从文件分包到逐跳转发</title>
          <desc id="csnet-journey-desc">
            A 将文件拆成三个 payload，分别加上目的地址 B 和长度等 header，得到三个 packet。
            这些相关的包属于同一个 flow。链路将 bit 从 A 的接口送到 R1 的接口。 R1 读取目的地址
            B，查询转发表中的 B 经出口 2 到下一跳 R2 这一项， 再由 R2 转发到服务器 B。另一出口通向
            R3。routing 建立和更新表，forwarding 对每个包查表选择出口。
          </desc>
          <text x="25" y="30" className="csnet-journey-heading">
            ① 分包：每块数据加上 header
          </text>
          <rect x="25" y="52" width="135" height="105" rx="8" className="csnet-data" />
          <text x="92" y="79" className="csnet-packet-label">
            A 的文件
          </text>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={36 + i * 38} y="96" width="36" height="43" className="csnet-link" />
              <text x={54 + i * 38} y="123" className="csnet-packet-label">
                {i + 1}
              </text>
              <rect x="255" y={48 + i * 42} width="200" height="34" className="csnet-ip" />
              <text x="355" y={70 + i * 42} className="csnet-packet-label">
                header：目的 B · 长度
              </text>
              <rect x="455" y={48 + i * 42} width="130" height="34" className="csnet-link" />
              <text x="520" y={70 + i * 42} className="csnet-packet-label">
                payload {i + 1}
              </text>
            </g>
          ))}
          <path
            d="M 172 105 H 238"
            className="csnet-journey-arrow"
            markerEnd="url(#csnet-journey-arrow)"
          />
          <text x="205" y="90" className="csnet-packet-label">
            拆分
          </text>
          <path d="M 600 48 H 610 V 166 H 600" className="csnet-edge" />
          <text x="630" y="102" className="csnet-row-label">
            同一 flow
          </text>
          <text x="630" y="126" className="csnet-row-label">
            的一组包
          </text>

          <text x="25" y="210" className="csnet-journey-heading">
            ② 逐跳传输：链路送 bit，router 选出口
          </text>
          <text x="25" y="239" className="csnet-row-label">
            本次转发路径：A → R1 → R2 → B
          </text>
          {['M 115 300 H 254', 'M 326 300 H 484', 'M 536 300 H 648'].map((d) => (
            <path key={d} d={d} className="csnet-flow" markerEnd="url(#csnet-journey-selected)" />
          ))}
          <path d="M 290 336 V 378 H 484" className="csnet-journey-unused" />
          <text x="185" y="277" className="csnet-packet-label">
            bit 串 →
          </text>
          <text x="407" y="277" className="csnet-packet-label">
            下一跳 R2
          </text>
          <text x="593" y="277" className="csnet-packet-label">
            继续转发
          </text>
          <rect x="25" y="277" width="90" height="46" rx="8" className="csnet-data" />
          <text x="70" y="305" className="csnet-packet-label">
            电脑 A
          </text>
          <rect
            x="255"
            y="264"
            width="71"
            height="72"
            rx="10"
            className="csnet-node csnet-destination"
          />
          <text x="290" y="306" className="csnet-label">
            R1
          </text>
          {[
            { x: 510, y: 300, label: 'R2' },
            { x: 510, y: 378, label: 'R3' },
          ].map((router) => (
            <g key={router.label}>
              <circle cx={router.x} cy={router.y} r="25" className="csnet-node" />
              <text x={router.x} y={router.y + 5} className="csnet-packet-label">
                {router.label}
              </text>
            </g>
          ))}
          <rect x="251" y="293" width="8" height="14" className="csnet-interface" />
          <rect x="322" y="293" width="8" height="14" className="csnet-interface" />
          <rect x="283" y="332" width="14" height="8" className="csnet-interface" />
          <text x="225" y="328" className="csnet-packet-label">
            入口 1
          </text>
          <text x="361" y="328" className="csnet-packet-label">
            出口 2 ✓
          </text>
          <text x="365" y="368" className="csnet-packet-label">
            出口 3 · 未选中
          </text>
          <rect x="650" y="277" width="85" height="46" rx="8" className="csnet-link" />
          <text x="692" y="305" className="csnet-packet-label">
            服务器 B
          </text>
          <text x="25" y="373" className="csnet-row-label">
            蓝色小方块：R1 的接口
          </text>
          <text x="25" y="396" className="csnet-row-label">
            实线：本次路径；虚线：其他链路
          </text>

          <rect x="25" y="428" width="710" height="263" rx="12" className="csnet-data" />
          <text x="45" y="459" className="csnet-journey-heading">
            放大 R1：一个包到来后，怎样选择出口？
          </text>
          <text x="125" y="497" className="csnet-packet-label">
            1. 从入口 1 收到包
          </text>
          <rect x="50" y="512" width="150" height="34" className="csnet-ip" />
          <text x="125" y="534" className="csnet-packet-label">
            header：目的 B
          </text>
          <rect x="50" y="546" width="150" height="34" className="csnet-link" />
          <text x="125" y="568" className="csnet-packet-label">
            payload
          </text>
          <path
            d="M 205 535 H 267"
            className="csnet-flow"
            markerEnd="url(#csnet-journey-selected)"
          />
          <text x="237" y="601" className="csnet-packet-label">
            用目的 B 查表
          </text>

          <text x="390" y="497" className="csnet-packet-label">
            2. 查 R1 的转发表
          </text>
          <rect x="280" y="512" width="220" height="68" rx="5" className="csnet-ip" />
          <path d="M 280 546 H 500" className="csnet-edge" />
          {[
            { x: 318, heading: '目的地', value: 'B' },
            { x: 392, heading: '下一跳', value: 'R2' },
            { x: 462, heading: '出口', value: '2' },
          ].map((column) => (
            <g key={column.heading}>
              <text x={column.x} y="534" className="csnet-packet-label">
                {column.heading}
              </text>
              <text x={column.x} y="568" className="csnet-packet-label">
                {column.value}
              </text>
            </g>
          ))}
          <path
            d="M 507 535 H 565"
            className="csnet-flow"
            markerEnd="url(#csnet-journey-selected)"
          />
          <text x="633" y="497" className="csnet-packet-label">
            3. 从出口 2 发出
          </text>
          <rect x="577" y="512" width="112" height="68" rx="8" className="csnet-link" />
          <text x="633" y="540" className="csnet-packet-label">
            下一跳 R2
          </text>
          <text x="633" y="562" className="csnet-packet-label">
            最终目的 B
          </text>
          <path
            d="M 392 639 V 589"
            className="csnet-change"
            markerEnd="url(#csnet-journey-control)"
          />
          <rect x="245" y="642" width="294" height="30" rx="5" className="csnet-tcp" />
          <text x="392" y="662" className="csnet-packet-label">
            routing：建立 / 更新这张表
          </text>
          <text x="559" y="655" className="csnet-row-label">
            上面三步是
          </text>
          <text x="559" y="676" className="csnet-row-label">
            forwarding
          </text>
          <defs>
            <marker
              id="csnet-journey-selected"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 1 1 L 9 5 L 1 9" className="csnet-flow" />
            </marker>
            <marker
              id="csnet-journey-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 1 1 L 9 5 L 1 9" className="csnet-journey-arrow" />
            </marker>
            <marker
              id="csnet-journey-control"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 1 1 L 9 5 L 1 9" className="csnet-journey-control-tip" />
            </marker>
          </defs>
        </svg>
      </div>
      <figcaption>
        A → B：文件拆成多个 packet，每个都有 header 和
        payload；图中每行是一个包，框宽不代表实际长度。 R1 根据 header 的目的地址 B 查表，将包从出口
        2 交给 R2，再送往 B。 蓝色实线表示本次数据路径，灰色虚线表示未选中的链路。下方放大 R1
        的处理：读目的 B、查表、从出口 2 发往 R2。表下方的蓝色虚线箭头表示 routing 建表；forwarding
        使用这张表处理到来的包，无需理解文件内容。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { NetworkTopology, NetworkEncapsulation, PacketJourney };
