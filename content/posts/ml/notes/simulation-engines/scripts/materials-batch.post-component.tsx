import { Figure } from './diagram-primitives';

const femNodes = [
  [44, 72],
  [124, 91],
  [204, 72],
  [39, 132],
  [124, 145],
  [209, 132],
  [34, 197],
  [124, 202],
  [214, 197],
] as const;
const femTriangles = [
  [0, 1, 3],
  [1, 4, 3],
  [1, 2, 4],
  [2, 5, 4],
  [3, 4, 6],
  [4, 7, 6],
  [4, 5, 7],
  [5, 8, 7],
] as const;
const mpmParticles = [
  [45, 84],
  [92, 93],
  [147, 82],
  [189, 101],
  [61, 132],
  [116, 142],
  [174, 139],
  [73, 182],
  [131, 189],
  [190, 177],
] as const;

function PanelTitle({ x, title, subtitle }: { x: number; title: string; subtitle: string }) {
  return (
    <>
      <text x={x + 136} y="26" className="sim-heading">
        {title}
      </text>
      <text x={x + 136} y="47" className="sim-small">
        {subtitle}
      </text>
    </>
  );
}

function MaterialRepresentations() {
  return (
    <Figure
      id="sim-material"
      title="同一个外力下刚体、FEM 与 MPM 保存和更新不同状态"
      description="左侧刚体由一个参考方块经过整体平移和旋转得到，形状不变。中间 FEM 面板显示固定连接关系的节点网格在向下作用下发生形变。右侧 MPM 面板显示携带材料状态的粒子叠在不随材料移动的背景网格上，并标出粒子到网格、网格更新和网格到粒子的循环。"
      caption="三者不是不同精度的同一图标。刚体只推进整体位姿；FEM 的节点与单元随材料一起形变；MPM 的粒子携带材料历史，每一步临时把质量和动量传到背景网格，再把更新后的速度传回粒子。"
      height={360}
    >
      <PanelTitle x={16} title="Rigid body" subtitle="状态集中在整体位姿" />
      <PanelTitle x={310} title="FEM" subtitle="节点和单元就是材料网格" />
      <PanelTitle x={604} title="MPM" subtitle="粒子携带状态，网格临时计算" />

      {[16, 310, 604].map((x) => (
        <rect key={x} x={x} y="60" width="280" height="278" rx="10" className="sim-panel" />
      ))}

      <g transform="translate(16 60)">
        <path d="M140 14v40" className="sim-force" markerEnd="url(#sim-material-arrow)" />
        <text x="165" y="31" className="sim-force-label">
          外力
        </text>
        <rect x="74" y="79" width="106" height="84" rx="4" className="sim-reference-body" />
        <g transform="translate(16 8) rotate(-9 127 121)">
          <rect x="78" y="79" width="106" height="84" rx="4" className="sim-body" />
          <circle cx="131" cy="121" r="4" className="sim-center" />
          <path d="M106 121h50M131 96v50" className="sim-body-axis" />
        </g>
        <text x="140" y="206" className="sim-stage-label">
          形状保持不变
        </text>
        <text x="140" y="231" className="sim-small">
          保存 p, R, v, ω
        </text>
        <text x="140" y="255" className="sim-micro">
          所有表面点共享同一个 rigid transform
        </text>
      </g>

      <g transform="translate(310 60)">
        <path d="M140 14v40" className="sim-force" markerEnd="url(#sim-material-arrow)" />
        <text x="165" y="31" className="sim-force-label">
          外力
        </text>
        <rect x="34" y="72" width="180" height="125" className="sim-reference-mesh" />
        {femTriangles.map((indices) => (
          <polygon
            key={indices.join('-')}
            points={indices.map((index) => femNodes[index]!.join(',')).join(' ')}
            className="sim-mesh"
          />
        ))}
        {femNodes.map(([x, y], index) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="4"
            className={index === 1 ? 'sim-node sim-loaded-node' : 'sim-node'}
          />
        ))}
        <text x="140" y="231" className="sim-stage-label">
          连线随节点一起形变
        </text>
        <text x="140" y="255" className="sim-micro">
          connectivity 固定；xᵢ 与材料运动
        </text>
      </g>

      <g transform="translate(604 60)">
        <path d="M140 8v40" className="sim-force" markerEnd="url(#sim-material-arrow)" />
        <text x="165" y="25" className="sim-force-label">
          外力
        </text>
        {[28, 70, 112, 154, 196, 238].map((offset) => (
          <path key={`vertical-${offset}`} d={`M${offset} 62v145`} className="sim-grid" />
        ))}
        {[62, 98, 134, 170, 207].map((offset) => (
          <path key={`horizontal-${offset}`} d={`M28 ${offset}h210`} className="sim-grid" />
        ))}
        {[
          [70, 98],
          [112, 134],
          [154, 134],
          [196, 170],
        ].map(([x, y]) => (
          <rect
            key={`grid-node-${x}-${y}`}
            x={x - 4}
            y={y - 4}
            width="8"
            height="8"
            className="sim-active-grid"
          />
        ))}
        {mpmParticles.map(([x, y]) => (
          <circle key={`particle-${x}-${y}`} cx={x} cy={y} r="5" className="sim-particle" />
        ))}
        <path d="M46 226h52" className="sim-transfer" markerEnd="url(#sim-material-arrow)" />
        <text x="72" y="219" className="sim-micro">
          P2G
        </text>
        <rect x="102" y="213" width="76" height="27" rx="6" className="sim-grid-update" />
        <text x="140" y="231" className="sim-small">
          网格更新
        </text>
        <path d="M182 226h52" className="sim-transfer" markerEnd="url(#sim-material-arrow)" />
        <text x="208" y="219" className="sim-micro">
          G2P
        </text>
        <text x="140" y="264" className="sim-micro">
          下一步清空网格，粒子保留材料历史
        </text>
      </g>
    </Figure>
  );
}

const rolloutRows = [
  { label: '环境 1', className: 'sim-env-one', positions: [8, 31, 51] },
  { label: '环境 2', className: 'sim-env-two', positions: [35, 25, 17] },
  { label: '环境 3', className: 'sim-env-three', positions: [17, 43, 66] },
] as const;

function StateCard({
  x,
  y,
  blockPosition,
  className,
}: {
  x: number;
  y: number;
  blockPosition: number;
  className: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width="116" height="48" rx="7" className="sim-state-card" />
      <path d={`M${x + 10} ${y + 35}h96`} className="sim-state-ground" />
      <rect x={x + 93} y={y + 19} width="11" height="16" className="sim-state-target" />
      <rect
        x={x + 11 + blockPosition}
        y={y + 20}
        width="18"
        height="15"
        rx="2"
        className={className}
      />
    </g>
  );
}

function BatchedRollouts() {
  return (
    <Figure
      id="sim-batch"
      title="批量仿真纵向并行多个环境，横向仍按时间顺序推进"
      description="三行是方块位置不同的独立环境。每行从状态 s t 经相同的物理映射 F h 得到 s t 加一，再经下一次映射得到 s t 加二。第一列物理映射被一个竖向色带包围，表示多个环境在同一次 kernel 或 batched solver 调用中并行；每行箭头仍从左向右，表示后一状态依赖前一状态。"
      caption="纵向的 B 个环境没有彼此的状态依赖，可以在同一次 batched physics call 中计算；横向的 sₜ → sₜ₊₁ → sₜ₊₂ 是同一轨迹的因果链，必须逐步完成。Batch size 提高的是每次推进的样本数，不是单条轨迹跨时间并行。"
      height={342}
    >
      <text x="830" y="25" className="sim-time-label">
        时间依赖 →
      </text>
      <text x="178" y="40" className="sim-heading">
        state sₜ
      </text>
      <text x="362" y="40" className="sim-heading">
        batched Fₕ
      </text>
      <text x="548" y="40" className="sim-heading">
        state sₜ₊₁
      </text>
      <text x="699" y="40" className="sim-heading">
        next Fₕ
      </text>
      <text x="830" y="40" className="sim-heading">
        state sₜ₊₂
      </text>

      <rect x="278" y="52" width="168" height="232" rx="12" className="sim-batch-band" />
      <text x="362" y="303" className="sim-batch-label">
        B 个环境一次送进同一个 kernel
      </text>

      {rolloutRows.map((row, index) => {
        const y = 68 + index * 72;
        return (
          <g key={row.label}>
            <circle cx="34" cy={y + 24} r="6" className={row.className} />
            <text x="90" y={y + 29} textAnchor="end" className="sim-row-label">
              {row.label}
            </text>
            <StateCard x={120} y={y} blockPosition={row.positions[0]} className={row.className} />
            <rect x="298" y={y + 5} width="128" height="38" rx="7" className="sim-operator" />
            <text x="362" y={y + 29} className="sim-operator-label">
              Fₕ(sᵇₜ, uᵇₜ)
            </text>
            <StateCard x={490} y={y} blockPosition={row.positions[1]} className={row.className} />
            <rect x="657" y={y + 7} width="82" height="34" rx="7" className="sim-next-operator" />
            <text x="698" y={y + 29} className="sim-operator-label">
              Fₕ
            </text>
            <StateCard x={772} y={y} blockPosition={row.positions[2]} className={row.className} />

            {[
              [238, 292],
              [432, 484],
              [608, 651],
              [745, 766],
            ].map(([start, end]) => (
              <path
                key={`${row.label}-${start}`}
                d={`M${start} ${y + 24}H${end}`}
                className="sim-flow"
                markerEnd="url(#sim-batch-arrow)"
              />
            ))}
          </g>
        );
      })}
      <text x="450" y="329" className="sim-small">
        纵向：环境之间可并行 · 横向：每条轨迹必须等待自己的前一状态
      </text>
    </Figure>
  );
}

export const POST_COMPONENTS = {
  MaterialRepresentations,
  BatchedRollouts,
};
