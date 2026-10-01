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
          viewBox="0 0 760 540"
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
          {['M 115 286 H 262', 'M 318 286 H 485', 'M 535 286 H 647'].map((d) => (
            <path
              key={d}
              d={d}
              className="csnet-journey-arrow"
              markerEnd="url(#csnet-journey-arrow)"
            />
          ))}
          <path d="M 315 310 L 485 360" className="csnet-journey-unused" />
          <text x="190" y="254" className="csnet-packet-label">
            链路
          </text>
          <text x="190" y="320" className="csnet-packet-label">
            bit →
          </text>
          <text x="395" y="254" className="csnet-packet-label">
            选中出口 2
          </text>
          <text x="391" y="367" className="csnet-packet-label">
            另一出口
          </text>
          <rect x="25" y="263" width="90" height="46" rx="8" className="csnet-data" />
          <text x="70" y="291" className="csnet-packet-label">
            电脑 A
          </text>
          {[
            { x: 290, y: 286, label: 'R1' },
            { x: 510, y: 286, label: 'R2' },
            { x: 510, y: 367, label: 'R3' },
          ].map((router) => (
            <g key={router.label}>
              <circle cx={router.x} cy={router.y} r="25" className="csnet-node" />
              <text x={router.x} y={router.y + 5} className="csnet-packet-label">
                {router.label}
              </text>
            </g>
          ))}
          {[115, 265, 315, 485, 535, 647].map((x) => (
            <rect key={x} x={x - 3} y="281" width="6" height="10" className="csnet-interface" />
          ))}
          <rect x="650" y="263" width="85" height="46" rx="8" className="csnet-link" />
          <text x="692" y="291" className="csnet-packet-label">
            服务器 B
          </text>
          <text x="25" y="347" className="csnet-row-label">
            小方块 = 接口
          </text>

          <rect x="25" y="427" width="185" height="65" rx="8" className="csnet-tcp" />
          <text x="117" y="453" className="csnet-packet-label">
            routing
          </text>
          <text x="117" y="477" className="csnet-packet-label">
            建立 / 更新转发表
          </text>
          <path
            d="M 215 459 H 265"
            className="csnet-change"
            markerEnd="url(#csnet-journey-control)"
          />
          <rect x="278" y="415" width="300" height="88" rx="8" className="csnet-data" />
          <text x="428" y="439" className="csnet-packet-label">
            R1 的转发表（简化）
          </text>
          {[
            { x: 333, heading: '目的地', value: 'B' },
            { x: 428, heading: '下一跳', value: 'R2' },
            { x: 523, heading: '出口', value: '2' },
          ].map((column) => (
            <g key={column.heading}>
              <text x={column.x} y="465" className="csnet-packet-label">
                {column.heading}
              </text>
              <text x={column.x} y="488" className="csnet-packet-label">
                {column.value}
              </text>
            </g>
          ))}
          <path d="M 290 415 V 321" className="csnet-edge" />
          <text x="304" y="398" className="csnet-row-label">
            查表
          </text>
          <text x="605" y="447" className="csnet-row-label">
            forwarding
          </text>
          <text x="605" y="471" className="csnet-row-label">
            读目的地址 → 查表
          </text>
          <text x="605" y="495" className="csnet-row-label">
            → 从选中接口发出
          </text>
          <defs>
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
        2 交给 R2，再送往 B。 实线箭头表示数据传输，虚线箭头表示 routing 建表；forwarding
        使用这张表处理到来的包，无需理解文件内容。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { NetworkTopology, NetworkEncapsulation, PacketJourney };
