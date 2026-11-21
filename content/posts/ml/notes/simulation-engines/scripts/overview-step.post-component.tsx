import { Figure, MathLabel } from './diagram-primitives';

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

function StateObservationOverview() {
  return (
    <Figure
      id="sim-overview"
      title="机械臂推进一步，再由相机生成观测"
      description="左侧是状态 s t：质量 m 标在方块上，摩擦系数 mu 指向桌面接触处，阻尼 b 指向机械臂关节，这些量属于物理参数 theta。动作 u t 经过时间 h 推进到右侧状态 s t 加一，方块的虚线轮廓表示原位置。相机朝向右侧场景，按观测参数 eta 通过 H 生成右上角的画面 o t 加一。"
      caption="机械臂在动作作用下推进一步，相机再拍摄新状态。图中仅示意位姿，完整状态还包含速度等量；物理参数 θ 影响运动，观测参数 η 影响画面。缩略图为观测示意。"
      width={780}
      height={310}
    >
      <MathLabel x={115} y={25} width={65} tex="s_t" className="sim-math-state" />
      <MathLabel x={451} y={25} width={85} tex="s_{t+1}" className="sim-math-state" />
      <OverviewScene x={35} />
      <path
        d="M104 89H126V108M252 140H270V195H239M268 244H238L224 213"
        className="sim-parameter-leader"
      />
      <text x="49" y="91" textAnchor="start" className="sim-overview-detail">
        阻尼
      </text>
      <MathLabel x={78} y={70} width={25} tex="b" />
      <text x="233" y="132" className="sim-overview-detail">
        质量
      </text>
      <MathLabel x={222} y={139} width={25} tex="m" />
      <text x="279" y="250" textAnchor="start" className="sim-overview-detail">
        摩擦
      </text>
      <MathLabel x={308} y={229} width={25} tex={'\\mu'} />
      <text x="113" y="286" className="sim-overview-detail">
        物理参数
      </text>
      <MathLabel x={146} y={265} width={130} tex={'\\theta=(m,\\mu,b,\\ldots)'} />
      <text x="320" y="125" className="sim-overview-detail">
        动作
      </text>
      <MathLabel x={329} y={104} width={38} tex="u_t" />
      <path
        d="M280 163H370"
        className="sim-overview-state-flow"
        markerEnd="url(#sim-overview-arrow)"
      />
      <MathLabel x={286} y={175} width={40} tex="F_h" />
      <text x="338" y="196" className="sim-overview-detail">
        经过
      </text>
      <MathLabel x={350} y={175} width={25} tex="h" />
      <path d="M591 77L429 119L591 217Z" className="sim-view-cone" />
      <rect x="551" y="177" width="36" height="36" rx="3" className="sim-overview-ghost" />
      <OverviewScene x={385} advanced />
      <text x="502" y="246" className="sim-overview-detail">
        虚线：方块原位置
      </text>
      <g className="sim-camera-body">
        <rect x="604" y="60" width="43" height="28" rx="5" />
        <path d="M604 67l-13 4v9l13 4ZM616 60l5-8h13l5 8" />
      </g>
      <circle cx="634" cy="74" r="4" className="sim-camera-indicator" />
      <text x="625" y="111" className="sim-overview-detail">
        相机
      </text>
      <text x="613" y="138" className="sim-overview-detail">
        观测参数
      </text>
      <MathLabel x={640} y={117} width={25} tex={'\\eta'} />
      <path
        d="M650 74H664"
        className="sim-overview-state-flow"
        markerEnd="url(#sim-overview-arrow)"
      />
      <MathLabel x={641} y={39} width={30} tex="H" />
      <rect x="670" y="44" width="100" height="100" rx="5" className="sim-observation-frame" />
      <svg x="675" y="51" width="90" height="85" viewBox="393 104 228 120" aria-hidden="true">
        <OverviewScene x={385} advanced />
      </svg>
      <MathLabel x={680} y={150} width={80} tex="o_{t+1}" className="sim-math-observation" />
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

export const POST_COMPONENTS = {
  StateObservationOverview,
  SimulationStep,
};
