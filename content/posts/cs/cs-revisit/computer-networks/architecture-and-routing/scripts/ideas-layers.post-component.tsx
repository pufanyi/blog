import { arrow, Diagram, label } from './ideas-primitives';

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

export const POST_COMPONENTS = {
  PacketPipeline,
  Multiplexing,
  QueueBurst,
  NarrowWaist,
  Demultiplexing,
  DeliveryBoundaries,
  FateSharing,
};
