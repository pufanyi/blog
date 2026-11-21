import { arrow, Diagram, label } from './ideas-primitives';

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

export const POST_COMPONENTS = {
  HierarchicalRouting,
  RoutingStates,
  Microloop,
  FloodingVersions,
};
