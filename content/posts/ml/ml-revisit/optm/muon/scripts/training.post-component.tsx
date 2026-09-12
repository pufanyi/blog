import { Diagram, MathLabel } from './elements';

function Arrowhead({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 8"
        refX="9"
        refY="4"
        markerWidth="7"
        markerHeight="6"
        orient="auto"
      >
        <path d="M 0 0 L 10 4 L 0 8 Z" className="muon-flow-arrow" />
      </marker>
    </defs>
  );
}

function Edge({ d, marker, state = false }: { d: string; marker: string; state?: boolean }) {
  return (
    <path
      d={d}
      className={`muon-flow-edge${state ? ' muon-flow-state' : ''}`}
      markerEnd={`url(#${marker})`}
    />
  );
}

function Box({
  x,
  y,
  width,
  height,
  tone = 'blue',
  state = false,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  tone?: 'blue' | 'teal' | 'clay';
  state?: boolean;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx="7"
      className={`muon-flow-box muon-${tone}${state ? ' muon-flow-state' : ''}`}
    />
  );
}

function MuonTrainingStep() {
  const marker = 'muon-training-arrow';
  return (
    <Diagram
      id="muon-training"
      title="Muon 在一次 Transformer 训练 step 中的位置"
      height={504}
      description="一个 mini-batch 经过参数为 θ_t 的模型 forward，得到 loss；backward 算出各参数的梯度。Optimizer step 按参数用途分组：隐藏层的 attention projection 和 MLP 矩阵由 Muon 更新，embedding、LM head、bias 和 normalization 参数由 AdamW 更新。两组更新共同组成下一步的模型参数 θ_{t+1}，再用于下一个 mini-batch 的 forward。两条优化器分支属于同一个模型。"
      caption="实线跟随当前 batch 的计算，虚线把更新后的模型送到下一步。Muon 和 AdamW 分别更新同一模型中的不同参数组；下面会放大左侧的 Muon 分支。"
    >
      <Arrowhead id={marker} />
      <Edge d="M 146 68 H 207" marker={marker} />
      <Edge d="M 431 68 H 495" marker={marker} />
      <Edge d="M 559 101 V 145 H 331 V 163" marker={marker} />
      <Edge d="M 331 222 V 246 H 170 V 276" marker={marker} />
      <Edge d="M 331 246 H 496 V 276" marker={marker} />
      <circle cx="331" cy="246" r="3" className="muon-flow-junction" />
      <Edge d="M 170 369 V 393 H 295 V 415" marker={marker} />
      <Edge d="M 496 369 V 393 H 365 V 415" marker={marker} />
      <Edge d="M 330 471 V 490 H 12 V 125 H 260 V 101" marker={marker} state />

      <Box x={28} y={35} width={118} height={66} tone="clay" />
      <text x="87" y="62" className="muon-heading">
        Mini-batch
      </text>
      <text x="87" y="83" className="muon-note">
        输入与训练目标
      </text>
      <Box x={207} y={35} width={224} height={66} />
      <text x="319" y="59" className="muon-heading">
        模型 · forward
      </text>
      <MathLabel x={274} y={65} width={90} tex={String.raw`\theta_t`} />
      <Box x={495} y={35} width={128} height={66} tone="clay" />
      <text x="559" y="59" className="muon-heading">
        Loss
      </text>
      <MathLabel x={514} y={65} width={90} tex={String.raw`\mathcal{L}_t`} />
      <Box x={231} y={163} width={200} height={59} />
      <text x="331" y="186" className="muon-heading">
        Backward
      </text>
      <MathLabel x={271} y={187} width={120} tex={String.raw`\nabla_\theta\mathcal{L}_t`} />
      <text x="493" y="239" className="muon-note">
        按参数用途分组
      </text>

      <Box x={36} y={276} width={268} height={93} tone="teal" />
      <text x="170" y="302" className="muon-heading">
        Muon
      </text>
      <text x="170" y="328" className="muon-heading">
        隐藏层 attention projection
      </text>
      <text x="170" y="350" className="muon-heading">
        与 MLP 权重矩阵
      </text>
      <Box x={362} y={276} width={268} height={93} tone="clay" />
      <text x="496" y="302" className="muon-heading">
        AdamW
      </text>
      <text x="496" y="328" className="muon-heading">
        Embedding、LM head
      </text>
      <text x="496" y="350" className="muon-heading">
        Bias、normalization 参数
      </text>
      <Box x={219} y={415} width={222} height={56} />
      <text x="330" y="437" className="muon-heading">
        更新后的同一个模型
      </text>
      <MathLabel x={274} y={437} width={112} tex={String.raw`\theta_{t+1}`} />
      <text x="131" y="456" className="muon-note">
        下一步，使用新 batch
      </text>
    </Diagram>
  );
}

function MuonMatrixStep() {
  const marker = 'muon-matrix-arrow';
  const steps = Array.from({ length: 6 }, (_, k) => ({ k, x: 230 + 66 * k }));
  return (
    <Diagram
      id="muon-matrix-step"
      title="一个权重矩阵的 Muon 更新：历史状态、内部迭代与 weight decay"
      height={680}
      description="以默认的 Nesterov-style momentum 为例：上一步保存的 M_{t-1} 和当前梯度 G_t 共同计算 M_t，M_t 保存给下一个训练 step，同时与 G_t 组合成 H_t。H_t 经过 Frobenius 归一化得到 X_0，在当前训练 step 内依次计算 X_1 到 X_5，输出近似 polar 结果 O_t；乘以 learning rate η_t 和形状系数 s_{m,n} 得到要减去的更新。另一条路径从原权重 W_t 直接计算 decoupled weight decay，得到 (1−η_tλ)W_t，再减去缩放后的更新得到 W_{t+1}。保存的 momentum 不经过 Newton–Schulz；weight decay 不经过 Newton–Schulz，也不乘形状系数。"
      caption="实线是本次更新的数据流，虚线表示跨训练 step 保存的 momentum。浅色框里的五次迭代只产生本步更新；下方的 weight decay 路径直接作用于原权重，最后减去右侧的缩放更新。"
    >
      <Arrowhead id={marker} />
      <Edge d="M 156 77 H 210" marker={marker} state />
      <Edge d="M 482 77 H 520" marker={marker} state />
      <Edge d="M 156 203 H 181 V 111 H 210" marker={marker} />
      <Edge d="M 181 203 H 210" marker={marker} />
      <circle cx="181" cy="203" r="3" className="muon-flow-junction" />
      <Edge d="M 347 130 V 166" marker={marker} />
      <Edge d="M 347 242 V 283" marker={marker} />
      <Edge d="M 158 514 H 208" marker={marker} />
      <Edge d="M 308 541 V 594 H 405" marker={marker} />
      <Edge d="M 542 541 V 594 H 445" marker={marker} />
      <Edge d="M 425 614 V 633" marker={marker} />

      <Box x={24} y={42} width={132} height={71} state />
      <text x="90" y="65" className="muon-heading">
        历史 momentum
      </text>
      <MathLabel x={44} y={72} width={92} tex={String.raw`M_{t-1}`} />
      <Box x={210} y={42} width={272} height={88} />
      <text x="346" y="69" className="muon-heading">
        更新 momentum
      </text>
      <MathLabel x={217} y={81} width={258} tex={String.raw`M_t=\beta M_{t-1}+(1-\beta)G_t`} />
      <Box x={520} y={42} width={120} height={88} state />
      <text x="580" y="67" className="muon-heading">
        保存到下一步
      </text>
      <MathLabel x={539} y={80} width={82} tex={String.raw`M_t`} />

      <Box x={24} y={168} width={132} height={71} tone="clay" />
      <text x="90" y="191" className="muon-heading">
        来自 backward
      </text>
      <MathLabel x={30} y={198} width={120} tex={String.raw`G_t=\nabla_W\mathcal{L}_t`} />
      <Box x={210} y={166} width={272} height={76} />
      <text x="346" y="191" className="muon-heading">
        Nesterov 组合
      </text>
      <MathLabel x={217} y={199} width={258} tex={String.raw`H_t=\beta M_t+(1-\beta)G_t`} />

      <rect x="210" y="283" width="430" height="163" rx="9" className="muon-flow-group" />
      <text x="425" y="309" className="muon-heading">
        Newton–Schulz · 本次更新内部的 5 次迭代
      </text>
      <MathLabel
        x={259}
        y={321}
        width={332}
        height={53}
        tex={String.raw`X_0=\displaystyle\frac{H_t}{\lVert H_t\rVert_F+\epsilon}`}
      />
      <Edge d="M 425 374 V 382 H 254 V 390" marker={marker} />
      {steps.map(({ k, x }) => (
        <g key={k}>
          {k < steps.length - 1 && <Edge d={`M ${x + 48} 409 H ${x + 66}`} marker={marker} />}
          <Box x={x} y={390} width={48} height={38} tone="teal" />
          <MathLabel x={x} y={392} width={48} tex={`X_${k}`} />
        </g>
      ))}
      <Edge d="M 584 428 V 483" marker={marker} />
      <MathLabel x={580} y={445} width={72} tex={String.raw`O_t`} />

      <Box x={24} y={483} width={134} height={58} tone="clay" />
      <text x="91" y="505" className="muon-heading">
        当前权重
      </text>
      <MathLabel x={52} y={504} width={78} tex={String.raw`W_t`} />
      <Box x={208} y={483} width={200} height={58} tone="clay" />
      <text x="308" y="505" className="muon-heading">
        Weight decay
      </text>
      <MathLabel x={218} y={504} width={180} tex={String.raw`(1-\eta_t\lambda)W_t`} />
      <Box x={448} y={483} width={188} height={58} tone="teal" />
      <text x="542" y="505" className="muon-heading">
        缩放更新
      </text>
      <MathLabel x={460} y={504} width={164} tex={String.raw`\eta_t s_{m,n}O_t`} />
      <circle cx="425" cy="594" r="20" className="muon-flow-sum" />
      <MathLabel x={410} y={577} width={30} tex="+" />
      <MathLabel x={376} y={557} width={28} tex="+" />
      <MathLabel x={449} y={557} width={28} tex="-" />
      <Box x={348} y={633} width={154} height={38} />
      <MathLabel x={353} y={635} width={144} tex={String.raw`W_{t+1}`} />
    </Diagram>
  );
}

export const POST_COMPONENTS = { MuonTrainingStep, MuonMatrixStep };
