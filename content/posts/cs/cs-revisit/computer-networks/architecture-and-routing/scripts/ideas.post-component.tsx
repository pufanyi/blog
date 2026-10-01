import type { ReactNode } from 'react';
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

function Diagram({
  id,
  title,
  description,
  height,
  children,
  caption,
}: {
  id: string;
  title: string;
  description: string;
  height: number;
  children: ReactNode;
  caption: ReactNode;
}) {
  return (
    <figure className="csnet-figure">
      <div className="csnet-scroll" role="region" aria-label={title} tabIndex={0}>
        <svg
          className="csnet-idea"
          viewBox={`0 0 680 ${height}`}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <defs>
            <marker
              id={`${id}-arrow`}
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
          {children}
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
const label = (x: number, y: number, text: string, className = 'csnet-packet-label') => (
  <text x={x} y={y} className={className}>
    {text}
  </text>
);
const arrow = (
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  className = 'csnet-flow',
) => <line x1={x1} y1={y1} x2={x2} y2={y2} className={className} markerEnd={`url(#${id}-arrow)`} />;

function PacketPipeline() {
  return (
    <Diagram
      id="csnet-pipeline"
      title="三条链路上的分包流水线"
      height={340}
      description="忽略传播、排队与 header。文件传输时间为三个单位：不分包时三跳依次占用三个单位，9 时刻完成；分成三包后，各包占用一个单位，在三条链路错位重叠，5 时刻完成。"
      caption="同一份文件、三条等速链路。这里只画 serialization，令整个文件发送时间为 3，分为三个等长包后每包为 1。横轴是时间，块是接口忙于发送的区间；分包让不同链路同时工作。"
    >
      {['整份文件：9 完成', '三个 packet：5 完成'].map((heading, panel) => (
        <g key={heading}>
          {label(20, 25 + panel * 163, heading, 'csnet-journey-heading')}
          {[0, 1, 2].map((hop) => (
            <g key={hop}>
              {label(70, 63 + panel * 163 + hop * 32, `链路 ${hop + 1}`)}
              {panel === 0 ? (
                <>
                  <rect
                    x={130 + hop * 165}
                    y={43 + hop * 32}
                    width="165"
                    height="26"
                    className="csnet-ip"
                  />
                  {label(212 + hop * 165, 61 + hop * 32, '整份文件')}
                </>
              ) : (
                [0, 1, 2].map((packet) => (
                  <g key={packet}>
                    <rect
                      x={130 + (hop + packet) * 55}
                      y={206 + hop * 32}
                      width="55"
                      height="26"
                      className={['csnet-ip', 'csnet-link', 'csnet-tcp'][packet]}
                    />
                    {label(157 + (hop + packet) * 55, 224 + hop * 32, `P${packet + 1}`)}
                  </g>
                ))
              )}
            </g>
          ))}
          <line
            x1="130"
            y1={146 + panel * 163}
            x2="635"
            y2={146 + panel * 163}
            className="csnet-edge"
          />
          {Array.from({ length: 10 }, (_, t) => (
            <g key={t}>
              <line
                x1={130 + 55 * t}
                y1={143 + panel * 163}
                x2={130 + 55 * t}
                y2={150 + panel * 163}
                className="csnet-edge"
              />
              {label(130 + 55 * t, 164 + panel * 163, String(t))}
            </g>
          ))}
        </g>
      ))}
    </Diagram>
  );
}
function Multiplexing() {
  return (
    <Diagram
      id="csnet-multiplex"
      title="错开的突发与同步的突发"
      height={250}
      description="左侧三个用户每人峰值4，依次活跃，合计峰值4；右侧三人同时活跃，合计峰值12，超过10的链路容量。相同的个人峰值不决定共享收益。"
      caption="每个格子表示一个观察时隙，带填色表示该用户以 4 Mbit/s 活跃。两侧每人都只活跃一次，但错峰时合计为 4，同步时合计为 12。平均流量相同，瞬时容量需求不同。"
    >
      {[false, true].map((sync, panel) => (
        <g key={String(sync)}>
          {label(
            28 + panel * 335,
            27,
            sync ? '同步突发：峰值 12' : '错开突发：峰值 4',
            'csnet-journey-heading',
          )}
          {['A', 'B', 'C'].map((name, row) => (
            <g key={name}>
              {label(40 + panel * 335, 70 + row * 38, name)}
              {[0, 1, 2].map((slot) => (
                <rect
                  key={slot}
                  x={75 + slot * 70 + panel * 335}
                  y={48 + row * 38}
                  width="68"
                  height="31"
                  className={
                    (sync ? slot === 1 : row === slot)
                      ? ['csnet-ip', 'csnet-link', 'csnet-tcp'][row]
                      : 'csnet-data'
                  }
                />
              ))}
            </g>
          ))}
          {label(40 + panel * 335, 185, '合计')}
          {[0, 1, 2].map((slot) => (
            <g key={slot}>
              <rect
                x={75 + slot * 70 + panel * 335}
                y="164"
                width="68"
                height="31"
                className="csnet-data"
              />
              {label(109 + slot * 70 + panel * 335, 185, String(sync ? (slot === 1 ? 12 : 0) : 4))}
            </g>
          ))}
          {label(178 + panel * 335, 226, sync ? '超过容量 10 → queue' : '容量 10 足够')}
        </g>
      ))}
    </Diagram>
  );
}
function QueueBurst() {
  return (
    <Diagram
      id="csnet-queue"
      title="超载的面积变成 backlog"
      height={300}
      description="0到20毫秒输入12，容量10，超额面积40kbit；20毫秒后输入2，净排空速率8，25毫秒队列归零。下图队列从0线性增长到40kbit，再降到0。"
      caption="流体模型：上图是输入速率与容量，下图是积压。蓝色超额面积为 2 Mbit/s × 20 ms = 40 kbit；绿色表示可用于排空的剩余容量。小包的阶梯变化在这里被连续曲线近似。"
    >
      {label(15, 27, '输入 / Mbit/s', 'csnet-row-label')}
      <path d="M 100 42 H 420 V 58 H 100 Z" className="csnet-ip" />
      <path d="M 420 58 H 500 V 122 H 420 Z" className="csnet-link" />
      <path d="M 100 42 H 420 V 122 H 580" className="csnet-flow" />
      <path d="M 100 58 H 580" className="csnet-change" />
      {label(615, 62, '容量 10')}
      {label(80, 47, '12')}
      {label(80, 126, '2')}
      {label(245, 97, '多来的 40 kbit')}
      {label(548, 99, '净排空 8')}
      <path d="M 100 30 V 140 H 580" className="csnet-edge" />
      {label(15, 184, 'Q / kbit', 'csnet-row-label')}
      <path d="M 100 258 L 420 194 L 500 258 Z" className="csnet-ip" />
      <path d="M 100 258 L 420 194 L 500 258 H 580" className="csnet-flow" />
      <path d="M 100 178 V 258 H 580" className="csnet-edge" />
      {label(75, 198, '40')}
      {[
        [100, '0'],
        [420, '20'],
        [500, '25'],
        [580, '30 ms'],
      ].map(([x, text]) => (
        <g key={text}>{label(Number(x), 283, String(text))}</g>
      ))}
      <path d="M 420 140 V 258 M 500 140 V 258" className="csnet-physical" />
    </Diagram>
  );
}
function NarrowWaist() {
  const apps = ['HTTP', 'DNS', 'NTP', '新应用'];
  const links = ['Ethernet', 'Wi-Fi', 'PPP', '新链路'];
  return (
    <Diagram
      id="csnet-waist"
      title="IP 窄腰让两侧独立扩展"
      height={290}
      description="四种应用通过TCP或UDP使用统一IP接口，IP通过不同适配承载在Ethernet、Wi-Fi、PPP和新链路上。增加一种应用不需要修改所有链路，增加一种链路不需要修改所有应用。"
      caption="箭头表示依赖的服务接口。示意栈为 HTTP→TCP、DNS→UDP、NTP→UDP；DNS 也可使用 TCP，图中没有穷举。新应用和新链路分别接入同一个 IP 服务，无需两两重新设计。"
    >
      {apps.map((app, i) => (
        <g key={app}>
          <rect x={25 + i * 165} y="18" width="135" height="35" rx="5" className="csnet-data" />
          {label(92 + i * 165, 41, app)}
          {arrow('csnet-waist', 92 + i * 165, 53, i === 0 ? 180 : 500, 95)}
        </g>
      ))}
      {[
        { name: 'TCP', x: 112 },
        { name: 'UDP', x: 432 },
      ].map(({ name, x }) => (
        <g key={name}>
          <rect x={x} y="95" width="136" height="35" rx="5" className="csnet-tcp" />
          {label(x + 68, 118, name)}
          {arrow('csnet-waist', x + 68, 130, 340, 165)}
        </g>
      ))}
      <rect x="240" y="165" width="200" height="38" rx="5" className="csnet-ip" />
      {label(340, 190, 'IP · best-effort datagram')}
      {links.map((link, i) => (
        <g key={link}>
          {arrow('csnet-waist', 340, 203, 92 + i * 165, 241)}
          <rect x={25 + i * 165} y="241" width="135" height="35" rx="5" className="csnet-link" />
          {label(92 + i * 165, 264, link)}
        </g>
      ))}
    </Diagram>
  );
}
function Demultiplexing() {
  return (
    <Diagram
      id="csnet-demux"
      title="每个 header 指向下一个处理者"
      height={280}
      description="Ethernet EtherType 0x0800选择IPv4而不是IPv6；IPv4 Protocol 6选择TCP而不是UDP；TCP目的端口443及连接四元组选择已建立socket，另一客户端的443连接进入不同socket。"
      caption="接收端逐层 demultiplex：先认下一层协议，再定位连接。两个客户端都访问服务器 443，仍可进入不同的 established socket；连接身份还包括源地址、源端口和目的地址。"
    >
      {[
        {
          y: 20,
          box: 'Ethernet',
          field: 'EtherType = 0x0800',
          selected: 'IPv4',
          other: 'IPv6: 0x86DD',
        },
        { y: 105, box: 'IPv4', field: 'Protocol = 6', selected: 'TCP', other: 'UDP: 17' },
        {
          y: 190,
          box: 'TCP',
          field: 'dst port = 443 + tuple',
          selected: 'socket 1',
          other: 'socket 2: 另一 tuple',
        },
      ].map((row) => (
        <g key={row.box}>
          <rect x="20" y={row.y} width="130" height="40" rx="5" className="csnet-ip" />
          {label(85, row.y + 25, row.box)}
          {arrow('csnet-demux', 150, row.y + 20, 430, row.y + 20)}
          {label(290, row.y + 10, row.field)}
          <rect x="440" y={row.y} width="195" height="38" rx="5" className="csnet-link" />
          {label(537, row.y + 24, row.selected)}
          {label(530, row.y + 64, row.other, 'csnet-muted-label')}
          {row.box !== 'TCP' && (
            <path
              d={`M 635 ${row.y + 20} H 653 V ${row.y + 75} H 85 V ${row.y + 85}`}
              className="csnet-physical"
              markerEnd="url(#csnet-demux-arrow)"
            />
          )}
        </g>
      ))}
    </Diagram>
  );
}
function DeliveryBoundaries() {
  return (
    <Diagram
      id="csnet-boundaries"
      title="确认停在哪一条成功边界"
      height={255}
      description="同一份上传经历router、接收端TCP、应用校验、存储。逐跳ACK止于下一跳；TCP ACK止于接收端TCP；应用完成响应可以按约定止于校验和持久化之后。这些确认不是同一个成功条件。"
      caption="箭头显示因果边界，而非精确时序。链路 ACK 与 TCP ACK 都不能跨过应用处理与存储这一段。若目标是文件已持久化，应用响应的语义必须覆盖最后一个边界。"
    >
      {['发送者', 'router', '接收端 TCP', '应用校验', '存储'].map((name, i) => (
        <g key={name}>
          <rect
            x={15 + i * 135}
            y="18"
            width="112"
            height="40"
            rx="5"
            className={i === 4 ? 'csnet-link' : 'csnet-data'}
          />
          {label(71 + i * 135, 44, name)}
          {i < 4 && arrow('csnet-boundaries', 127 + i * 135, 38, 150 + i * 135, 38)}
          <line x1={71 + i * 135} y1="64" x2={71 + i * 135} y2="230" className="csnet-physical" />
        </g>
      ))}
      {arrow('csnet-boundaries', 206, 95, 71, 95)}
      {label(360, 101, '逐跳 ACK：下一跳已收 frame')}
      {arrow('csnet-boundaries', 341, 150, 71, 150)}
      {label(500, 155, 'TCP ACK：byte 已被确认')}
      {arrow('csnet-boundaries', 611, 215, 71, 215)}
      {label(385, 199, '应用响应：按约定，校验与持久化已完成')}
    </Diagram>
  );
}
function FateSharing() {
  return (
    <Diagram
      id="csnet-fate"
      title="换路后，谁还保存恢复所需的进度"
      height={285}
      description="上图发送端A保存未确认包P1和确认进度，R1故障后可经R2重传到B。下图只有R1保存关键会话状态，R1故障后端点仍存活，但失去不可重建的进度。"
      caption="故障和备用路径相同，差别是关键状态的归属。箭头是恢复后的路径；虚线是故障前路径。图中的下方方案假定关键会话进度没有副本且无法重建，并非所有 router 状态丢失都会永久中断通信。"
    >
      {['状态随端点保存', '关键状态仅存中途'].map((name, panel) => (
        <g key={name} transform={`translate(0 ${panel * 140})`}>
          {label(20, 22, name, 'csnet-journey-heading')}
          <path d="M 150 83 L 335 45 L 520 83" className="csnet-physical" />
          {arrow('csnet-fate', 150, 83, 310, 116)}
          {arrow('csnet-fate', 360, 116, 520, 83)}
          <rect
            x="20"
            y="60"
            width="130"
            height="50"
            rx="5"
            className={panel === 0 ? 'csnet-ip' : 'csnet-data'}
          />
          {label(85, 80, 'A')}
          {label(85, 101, panel === 0 ? '保存 P1 / ACK 进度' : '端点仍存活')}
          <rect x="520" y="60" width="140" height="50" rx="5" className="csnet-data" />
          {label(590, 80, 'B')}
          {label(590, 101, panel === 0 ? '可检查重传与重复' : '关键进度无法恢复')}
          <circle cx="335" cy="45" r="20" className="csnet-node" />
          {label(335, 50, 'R1')}
          {label(382, 49, '×', 'csnet-error-label')}
          <circle cx="335" cy="117" r="20" className="csnet-node" />
          {label(335, 122, 'R2')}
          {panel === 1 && (
            <>
              {label(460, 32, '会话进度随 R1 丢失')}
              {label(440, 135, '有路 ≠ 能恢复会话')}
            </>
          )}
        </g>
      ))}
    </Diagram>
  );
}
function HierarchicalRouting() {
  return (
    <Diagram
      id="csnet-hierarchy"
      title="区域内部变化，外部聚合保持稳定"
      height={260}
      description="外部router只有4.*经入口的聚合；区域4入口在内部区分4.1、4.2和4.6。4.6离开只改变内部细节，只要入口和聚合保持有效，外部表不需要改变。"
      caption="两级标签仅用于解释层级，不是真实 IPv4 格式。聚合同时减少表大小和远处更新：外部负责到区域，内部负责到成员。默认路由进一步压缩所有共用一个上游的外部目的地。"
    >
      <rect x="20" y="72" width="150" height="52" rx="6" className="csnet-data" />
      {label(95, 94, '外部 router')}
      {label(95, 114, '4.* → 入口')}
      <rect x="280" y="20" width="380" height="217" rx="10" className="csnet-link" />
      {label(470, 44, '区域 4：对外仍宣告 4.*')}
      {arrow('csnet-hierarchy', 170, 98, 295, 98)}

      <rect x="295" y="72" width="105" height="52" rx="6" className="csnet-data" />
      {label(347, 103, '入口')}
      {[
        { y: 79, id: '4.1' },
        { y: 136, id: '4.2' },
        { y: 193, id: '4.6 离开' },
      ].map(({ y, id }) => (
        <g key={id}>
          {arrow('csnet-hierarchy', 400, 98, 535, y)}
          <rect x="535" y={y - 20} width="105" height="40" rx="6" className="csnet-data" />
          {label(587, y + 5, id)}
          {id.startsWith('4.6') && label(515, y + 5, '×', 'csnet-error-label')}
        </g>
      ))}
      {label(130, 190, '外部不必逐主机记录')}
      {label(130, 215, '也不必逐主机撤销')}
    </Diagram>
  );
}
function RoutingStates() {
  const positions: Record<string, [number, number]> = {
    A: [35, 75],
    B: [160, 75],
    C: [35, 180],
    D: [160, 180],
  };
  const states = [
    {
      name: '有效：汇向 D',
      edges: [
        ['A', 'B'],
        ['B', 'D'],
        ['C', 'B'],
      ],
    },
    {
      name: 'Loop：A ↔ B',
      edges: [
        ['A', 'B'],
        ['B', 'A'],
        ['C', 'D'],
      ],
    },
    {
      name: 'Dead end：B 无出口',
      edges: [
        ['A', 'B'],
        ['C', 'D'],
      ],
    },
  ];
  return (
    <Diagram
      id="csnet-states"
      title="局部下一跳组成的三种全局状态"
      height={255}
      description="左图A经B到D且C经B到D，有效；中图A与B互相指向，形成环；右图A指B但B没有下一跳，形成非目的地dead end。"
      caption="只画选中的 forwarding edges，物理网络可以有更多链路。每个非目的节点最多选一个 next hop；单看 A→B 无法判断有效性，必须继续检查 B 的表。"
    >
      {states.map((state, panel) => (
        <g key={state.name} transform={`translate(${15 + panel * 225} 0)`}>
          {label(95, 28, state.name)}
          {state.edges.map(([from, to]) => {
            const [x1, y1] = positions[from];
            const [x2, y2] = positions[to];
            const length = Math.hypot(x2 - x1, y2 - y1);
            const offset =
              panel === 1 && (from === 'A' || from === 'B') ? (from === 'A' ? -7 : 7) : 0;
            return (
              <g key={`${from}${to}`}>
                {arrow(
                  'csnet-states',
                  x1 + ((x2 - x1) * 20) / length,
                  y1 + ((y2 - y1) * 20) / length + offset,
                  x2 - ((x2 - x1) * 23) / length,
                  y2 - ((y2 - y1) * 23) / length + offset,
                )}
              </g>
            );
          })}
          {Object.entries(positions).map(([id, [x, y]]) => (
            <g key={id}>
              <circle
                cx={x}
                cy={y}
                r="20"
                className={id === 'D' ? 'csnet-node csnet-destination' : 'csnet-node'}
              />
              {label(x, y + 5, id)}
            </g>
          ))}
          {label(
            95,
            234,
            panel === 0
              ? '相遇之后，后续路径相同'
              : panel === 1
                ? '表项都有，但无法到达 D'
                : 'D 正常终止，B 不是',
          )}
        </g>
      ))}
    </Diagram>
  );
}
function Microloop() {
  return (
    <Diagram
      id="csnet-microloop"
      title="同一故障下旧表和新表组成 microloop"
      height={230}
      description="A-B代价1，B-D代价1，A-D代价5。故障前A指B且B指D；B-D断开后B先更新指A，A仍指B产生环；A也更新后A直达D且B经A到D。"
      caption="虚线是物理链路，实线箭头是去 D 的 next hop，× 是失效链路。中间每台 router 都在自己的地图上正确算路，混合起来却出现 A↔B。"
    >
      {['故障前', '只有 B 更新', 'A、B 都更新'].map((name, panel) => (
        <g key={name} transform={`translate(${15 + panel * 225} 0)`}>
          {label(95, 25, name)}
          <path d="M 35 80 H 165 L 100 180 Z" className="csnet-physical" />
          {label(100, 62, '1')}
          {label(155, 142, '1')}
          {label(35, 142, '5')}
          {panel > 0 && label(132, 132, '×', 'csnet-error-label')}
          {panel === 0 ? (
            <>
              {arrow('csnet-microloop', 57, 80, 141, 80)}
              {arrow('csnet-microloop', 153, 98, 114, 158)}
            </>
          ) : panel === 1 ? (
            <>
              {arrow('csnet-microloop', 58, 74, 141, 74)}
              {arrow('csnet-microloop', 141, 87, 58, 87)}
            </>
          ) : (
            <>
              {arrow('csnet-microloop', 45, 99, 86, 158)}
              {arrow('csnet-microloop', 143, 80, 57, 80)}
            </>
          )}
          {[
            [35, 80, 'A'],
            [165, 80, 'B'],
            [100, 180, 'D'],
          ].map(([x, y, id]) => (
            <g key={id}>
              <circle cx={Number(x)} cy={Number(y)} r="21" className="csnet-node" />
              {label(Number(x), Number(y) + 5, String(id))}
            </g>
          ))}
        </g>
      ))}
    </Diagram>
  );
}
function FloodingVersions() {
  return (
    <Diagram
      id="csnet-flood"
      title="有环网络中的版本抑制"
      height={240}
      description="同一条A发布序号7的通告从A送B和C，B再送C，C再送B。B和C见到重复版本便不再扩散。A发布新版本8时，B和C必须再次接受。B自己的序号2不与A的8比较。"
      caption="以 (origin, sequence) 判新旧：物理图有环，信息扩散仍可终止。丢失副本需要单独的可靠传输机制；重复抑制本身不保证所有节点都收到。"
    >
      <path d="M 90 65 L 240 170 H 90 Z" className="csnet-physical" />
      {arrow('csnet-flood', 102, 84, 217, 154)}
      {arrow('csnet-flood', 90, 88, 90, 146)}
      {arrow('csnet-flood', 113, 162, 216, 162)}
      {arrow('csnet-flood', 216, 179, 113, 179)}
      {[
        [90, 65, 'A'],
        [90, 170, 'B'],
        [240, 170, 'C'],
      ].map(([x, y, id]) => (
        <g key={id}>
          <circle cx={Number(x)} cy={Number(y)} r="22" className="csnet-node" />
          {label(Number(x), Number(y) + 5, String(id))}
        </g>
      ))}
      {label(204, 80, '(A, 7)')}
      {label(155, 213, '重复副本 → 不再扩散')}
      {[
        ['已知版本', '新收到', '动作'],
        ['A: 7', '(A, 7)', '丢弃重复'],
        ['A: 7', '(A, 8)', '替换并扩散'],
        ['A: 8', '(B, 2)', '独立记录 B: 2'],
      ].map((row, i) => (
        <g key={i}>
          {row.map((value, j) => (
            <g key={value}>
              <rect
                x={335 + j * 107}
                y={26 + i * 45}
                width="107"
                height="40"
                className={i === 0 ? 'csnet-ip' : 'csnet-data'}
              />
              {label(388 + j * 107, 51 + i * 45, value)}
            </g>
          ))}
        </g>
      ))}
    </Diagram>
  );
}

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
  PacketPipeline,
  Multiplexing,
  QueueBurst,
  NarrowWaist,
  Demultiplexing,
  DeliveryBoundaries,
  FateSharing,
  HierarchicalRouting,
  RoutingStates,
  Microloop,
  FloodingVersions,
  DistanceVectorDemo,
  FailureDemo,
  DijkstraDemo,
  PrefixExplorer,
};
