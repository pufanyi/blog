import type { ReactNode } from 'react';

const diagramWidth = 900;

function MathLabel({
  x,
  y,
  width,
  height = 30,
  className = '',
  tex,
}: {
  x: number;
  y: number;
  width: number;
  height?: number;
  className?: string;
  tex: string;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div className={`sim-math-label ${className}`}>{`\\(${tex}\\)`}</div>
    </foreignObject>
  );
}

function Figure({
  id,
  title,
  description,
  caption,
  height,
  children,
}: {
  id: string;
  title: string;
  description: string;
  caption: string;
  height: number;
  children: ReactNode;
}) {
  return (
    <figure className="sim-figure">
      <div className="sim-scroll">
        <svg
          viewBox={`0 0 ${diagramWidth} ${height}`}
          width={diagramWidth}
          height={height}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <defs>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 10 8"
              refX="9"
              refY="4"
              markerWidth="7"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0 0 10 4 0 8Z" className="sim-arrowhead" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function OverviewScene({ x, advanced = false }: { x: number; advanced?: boolean }) {
  const groundY = 213;
  const elbow = advanced ? [x + 103, 126] : [x + 91, 116];
  const wrist = advanced ? [x + 150, 157] : [x + 136, 148];
  const fingerX = advanced ? x + 174 : x + 158;
  const blockX = advanced ? x + 184 : x + 166;

  return (
    <g>
      <path d={`M${x + 18} ${groundY}H${x + 222}`} className="sim-overview-ground" />
      <path
        d={`M${x + 42} ${groundY - 2}V171L${elbow.join(' ')}L${wrist.join(
          ' ',
        )}L${fingerX} 179V${groundY - 2}`}
        className="sim-overview-arm"
      />
      {[[x + 42, 171], elbow, wrist].map(([jointX, jointY]) => (
        <circle
          key={`${jointX}-${jointY}`}
          cx={jointX}
          cy={jointY}
          r="5.5"
          className="sim-overview-joint"
        />
      ))}
      <rect x={blockX} y="177" width="36" height="36" rx="3" className="sim-overview-block" />
      {advanced && (
        <>
          <path
            d={`M${x + 166} 197h12`}
            className="sim-overview-motion"
            markerEnd="url(#sim-overview-arrow)"
          />
          <path d={`M${x + 75} 104a42 42 0 0 1 26 9`} className="sim-overview-motion" />
        </>
      )}
    </g>
  );
}

function Camera({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path
        d={`M${x - 6} ${y + 19}L${x - 72} ${y + 79}L${x - 4} ${y + 92}Z`}
        className="sim-view-cone"
      />
      <rect x={x} y={y} width="43" height="28" rx="5" className="sim-camera-body" />
      <path d={`M${x} ${y + 7}l-13 4v9l13 4Z`} className="sim-camera-lens" />
      <path d={`M${x + 12} ${y}l5 -8h13l5 8`} className="sim-camera-body" />
      <circle cx={x + 29} cy={y + 14} r="5" className="sim-camera-indicator" />
    </g>
  );
}

function StateObservationOverview() {
  return (
    <Figure
      id="sim-overview"
      title="物理状态推进、相机观测与训练框架的职责边界"
      description="左侧机械臂推方块的场景表示当前状态 s t。动作 u t、步长 h 和质量、摩擦、关节阻尼等物理参数 theta 输入物理映射 F h，产生右侧下一状态 s t 加一。右侧相机只拍摄这个新状态；相机参数、光照、噪声和采样设置 eta 输入观测映射 H，生成图像观测 o t 加一。底部独立条带表示训练框架管理 reward、reset、episode 和 policy update。"
      caption="同一个仿真任务里有三条边界：物理引擎用动作、步长和 θ 推进完整状态；相机与传感器用 η 从新状态生成观测；训练框架再组织轨迹和学习。相机看到的是状态的投影，既不等于完整状态，也不负责决定物体怎样运动。"
      height={510}
    >
      <text x="20" y="27" textAnchor="start" className="sim-overview-layer-title">
        物理状态推进
      </text>

      <rect x="20" y="50" width="240" height="190" rx="12" className="sim-overview-scene" />
      <MathLabel x={34} y={61} width={58} tex="s_t" className="sim-math-state" />
      <text x="246" y="78" textAnchor="end" className="sim-overview-note">
        当前完整状态
      </text>
      <OverviewScene x={20} />
      <text x="140" y="230" className="sim-overview-detail">
        位姿 · 速度 · 电机内部状态
      </text>

      <rect x="326" y="88" width="168" height="98" rx="12" className="sim-physics-operator" />
      <MathLabel
        x={337}
        y={105}
        width={146}
        height={35}
        tex={String.raw`F_h(s_t,u_t;\theta)`}
        className="sim-math-operator"
      />
      <text x="410" y="161" className="sim-overview-detail">
        physics engine
      </text>
      <path
        d="M260 137H316"
        className="sim-overview-state-flow"
        markerEnd="url(#sim-overview-arrow)"
      />
      <path
        d="M494 137H540"
        className="sim-overview-state-flow"
        markerEnd="url(#sim-overview-arrow)"
      />

      <rect x="321" y="31" width="74" height="40" rx="8" className="sim-overview-input" />
      <MathLabel x={327} y={36} width={62} tex="u_t" className="sim-math-input" />
      <text x="358" y="27" className="sim-overview-input-label">
        动作
      </text>
      <path
        d="M358 72V81"
        className="sim-overview-input-flow"
        markerEnd="url(#sim-overview-arrow)"
      />

      <rect x="426" y="31" width="55" height="40" rx="8" className="sim-overview-input" />
      <MathLabel x={432} y={36} width={43} tex="h" className="sim-math-input" />
      <text x="453" y="27" className="sim-overview-input-label">
        步长
      </text>
      <path
        d="M453 72V81"
        className="sim-overview-input-flow"
        markerEnd="url(#sim-overview-arrow)"
      />

      <rect x="310" y="205" width="200" height="94" rx="10" className="sim-physical-parameters" />
      <MathLabel
        x={321}
        y={211}
        width={34}
        tex={String.raw`\theta`}
        className="sim-math-parameter"
      />
      <text x="359" y="232" textAnchor="start" className="sim-overview-parameter-title">
        物理参数
      </text>
      <g className="sim-parameter-chips">
        <rect x="321" y="247" width="50" height="25" rx="12" />
        <rect x="377" y="247" width="57" height="25" rx="12" />
        <rect x="440" y="247" width="59" height="25" rx="12" />
      </g>
      <MathLabel x={324} y={246} width={44} height={26} tex="m" className="sim-math-chip" />
      <MathLabel
        x={382}
        y={246}
        width={47}
        height={26}
        tex={String.raw`\mu`}
        className="sim-math-chip"
      />
      <MathLabel x={445} y={246} width={49} height={26} tex="b" className="sim-math-chip" />
      <text x="410" y="290" className="sim-overview-parameter-key">
        质量 · 接触摩擦 · 关节阻尼
      </text>
      <path d="M410 204V196" className="sim-parameter-flow" markerEnd="url(#sim-overview-arrow)" />

      <rect x="550" y="50" width="330" height="190" rx="12" className="sim-overview-scene" />
      <MathLabel x={564} y={61} width={80} tex="s_{t+1}" className="sim-math-state" />
      <text x="864" y="78" textAnchor="end" className="sim-overview-note">
        推进后的完整状态
      </text>
      <OverviewScene x={570} advanced />
      <Camera x={816} y={96} />
      <text x="838" y="140" className="sim-camera-label">
        camera
      </text>
      <text x="710" y="230" className="sim-overview-detail">
        物体已移动；相机读取此刻场景
      </text>

      <text x="20" y="341" textAnchor="start" className="sim-overview-layer-title">
        传感器与观测
      </text>
      <path
        d="M738 240V326H645V342"
        className="sim-observation-flow"
        markerEnd="url(#sim-overview-arrow)"
      />

      <rect x="306" y="344" width="204" height="79" rx="10" className="sim-sensor-parameters" />
      <MathLabel x={317} y={350} width={34} tex={String.raw`\eta`} className="sim-math-parameter" />
      <text x="355" y="371" textAnchor="start" className="sim-overview-parameter-title">
        观测参数
      </text>
      <text x="408" y="393" className="sim-overview-detail">
        内外参 · 光照 · 噪声 · 采样
      </text>
      <path d="M510 383H555" className="sim-sensor-flow" markerEnd="url(#sim-overview-arrow)" />

      <rect x="565" y="344" width="132" height="79" rx="10" className="sim-sensor-operator" />
      <MathLabel
        x={578}
        y={354}
        width={106}
        height={35}
        tex={String.raw`H(s_{t+1};\eta)`}
        className="sim-math-operator"
      />
      <text x="631" y="409" className="sim-overview-detail">
        render / sample
      </text>
      <path
        d="M697 383H727"
        className="sim-observation-flow"
        markerEnd="url(#sim-overview-arrow)"
      />

      <rect x="737" y="334" width="143" height="99" rx="9" className="sim-observation-frame" />
      <MathLabel x={747} y={340} width={123} tex="o_{t+1}" className="sim-math-observation" />
      <path d="M751 413H866" className="sim-observation-ground" />
      <path d="M761 411v-17l21-25l23 14l12 17v11" className="sim-observation-arm" />
      <circle cx="782" cy="369" r="3.5" className="sim-observation-joint" />
      <circle cx="805" cy="383" r="3.5" className="sim-observation-joint" />
      <rect x="826" y="386" width="25" height="27" rx="2" className="sim-observation-block" />

      <rect x="20" y="459" width="860" height="38" rx="10" className="sim-training-band" />
      <text x="37" y="483" textAnchor="start" className="sim-training-label">
        训练框架（独立的一层）
      </text>
      <text x="292" y="483" className="sim-training-item">
        reward
      </text>
      <text x="420" y="483" className="sim-training-item">
        reset
      </text>
      <text x="548" y="483" className="sim-training-item">
        episode
      </text>
      <text x="708" y="483" className="sim-training-item">
        policy update
      </text>
    </Figure>
  );
}

type ScenePhase = 'current' | 'free' | 'corrected';

const sceneConfiguration: Record<ScenePhase, { fingerX: number; blockX: number }> = {
  current: { fingerX: 126, blockX: 139 },
  free: { fingerX: 151, blockX: 139 },
  corrected: { fingerX: 147, blockX: 153 },
};

function PushScene({
  x,
  phase,
  heading,
  detail,
}: {
  x: number;
  phase: ScenePhase;
  heading: string;
  detail: string;
}) {
  const { fingerX, blockX } = sceneConfiguration[phase];
  const panelY = 42;
  const panelWidth = 252;
  const groundY = 145;

  return (
    <g transform={`translate(${x} 0)`}>
      <text x={panelWidth / 2} y="25" className="sim-heading">
        {heading}
      </text>
      <rect x="0" y={panelY} width={panelWidth} height="126" rx="10" className="sim-panel" />
      <path d={`M16 ${groundY}H236`} className="sim-ground" />
      <path
        d={`M28 ${groundY - 3}V${groundY - 25}L72 76L111 96L${fingerX} 116V${groundY - 3}`}
        className="sim-arm"
      />
      {[
        [28, groundY - 25],
        [72, 76],
        [111, 96],
      ].map(([jointX, jointY]) => (
        <circle
          key={`${phase}-${jointX}-${jointY}`}
          cx={jointX}
          cy={jointY}
          r="6.5"
          className="sim-joint"
        />
      ))}
      <rect x={blockX} y="102" width="43" height="43" rx="3" className="sim-body" />

      {phase === 'current' && (
        <>
          <path d={`M${fingerX + 2} 94h${blockX - fingerX - 4}`} className="sim-gap" />
          <text x={(fingerX + blockX) / 2} y="87" className="sim-micro">
            gap
          </text>
        </>
      )}
      {phase === 'free' && (
        <>
          <rect x={blockX} y="102" width={fingerX - blockX} height="43" className="sim-overlap" />
          <text x={panelWidth / 2} y="68" className="sim-warning">
            φ &lt; 0：候选状态穿透
          </text>
        </>
      )}
      {phase === 'corrected' && (
        <>
          <path
            d={`M${fingerX - 2} 96H${fingerX - 28}`}
            className="sim-contact-force"
            markerEnd="url(#sim-step-arrow)"
          />
          <path
            d={`M${blockX + 2} 96H${blockX + 30}`}
            className="sim-contact-force"
            markerEnd="url(#sim-step-arrow)"
          />
          <text x={panelWidth / 2} y="68" className="sim-contact-label">
            Jᵀf 同时作用于双方
          </text>
        </>
      )}
      <text x={panelWidth / 2} y="161" className="sim-small">
        {detail}
      </text>
    </g>
  );
}

function StageBox({
  x,
  label,
  detail,
  kind,
}: {
  x: number;
  label: string;
  detail: string;
  kind: 'input' | 'free' | 'contact' | 'output';
}) {
  return (
    <g>
      <rect
        x={x}
        y="218"
        width="182"
        height="69"
        rx="9"
        className={`sim-stage sim-stage-${kind}`}
      />
      <text x={x + 91} y="246" className="sim-stage-label">
        {label}
      </text>
      <text x={x + 91} y="270" className="sim-small">
        {detail}
      </text>
    </g>
  );
}

function SimulationStep() {
  return (
    <Figure
      id="sim-step"
      title="自由运动候选经过接触求解成为合法的下一状态"
      description="三个连续场景分别显示当前机械臂和方块、忽略接触后手指穿入方块的自由运动候选、以及接触求解器算出接触作用后得到的下一状态。下方流程从当前状态和驱动力矩出发，计算自由加速度，利用间隙和接触 Jacobian 求未知接触力，再积分得到下一状态。"
      caption="接触力不是输入表中的已知常数。仿真器先计算没有接触时的候选运动；碰撞几何给出间隙 φ 和 Jacobian J，solver 再求出能同时修正机器人与方块的 f，最后才得到下一状态。"
      height={320}
    >
      <PushScene x={18} phase="current" heading="1  当前状态" detail="已知 (qₜ, vₜ) 与驱动 τ" />
      <PushScene x={324} phase="free" heading="2  自由运动候选" detail="只按 a₀ 推进会穿透" />
      <PushScene
        x={630}
        phase="corrected"
        heading="3  接触修正后"
        detail="双方使用同一个求解结果"
      />

      <path d="M276 105h34" className="sim-flow" markerEnd="url(#sim-step-arrow)" />
      <text x="293" y="94" className="sim-micro">
        忽略接触
      </text>
      <path d="M582 105h34" className="sim-flow" markerEnd="url(#sim-step-arrow)" />
      <text x="599" y="94" className="sim-micro">
        求解 f
      </text>

      <StageBox x={18} label="(qₜ, vₜ), τ" detail="当前 state + drive" kind="input" />
      <StageBox x={244} label="a₀ = M⁻¹(τ − c)" detail="free dynamics" kind="free" />
      <StageBox x={470} label="φ, J  →  solve f" detail="f 是耦合求解的结果" kind="contact" />
      <StageBox x={696} label="a = a₀ + M⁻¹Jᵀf" detail="积分到 (qₜ₊₁, vₜ₊₁)" kind="output" />
      {[200, 426, 652].map((start) => (
        <path
          key={start}
          d={`M${start} 252h30`}
          className="sim-flow"
          markerEnd="url(#sim-step-arrow)"
        />
      ))}
    </Figure>
  );
}

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
  StateObservationOverview,
  SimulationStep,
  MaterialRepresentations,
  BatchedRollouts,
};
