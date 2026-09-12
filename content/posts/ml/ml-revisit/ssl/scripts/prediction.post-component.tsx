import { Arrow, Box, Figure, Label, MathLabel } from './elements';

const TARGETS = new Set([2, 3, 6, 7]);
const CONTEXT = new Set([0, 1, 4, 5, 8, 9, 12, 13]);
const PATCHES = Array.from({ length: 16 }, (_, i) => ({
  i,
  x: 18 + (i % 4) * 27,
  y: 27 + Math.floor(i / 4) * 27,
  role: TARGETS.has(i) ? 'target' : CONTEXT.has(i) ? 'visible' : 'masked',
}));

function JEPAPrediction() {
  const id = 'ssl-jepa';
  return (
    <Figure
      id={id}
      title="I-JEPA 的 context 与 target 路径"
      description="网格中的 context 与 target 位置不重叠。Context encoder 只读取 context pixels，predictor 接收 context features 和目标位置。Target encoder 读取完整图像，再选择 target 位置的特征，经 normalization 和 stop-gradient 作为回归目标。"
      caption="实线是数据流，虚线是 EMA 更新。完整图像只送入 target 分支；目标特征不会成为 predictor 的输入。"
      height={336}
    >
      {PATCHES.map((p) => (
        <rect key={p.i} x={p.x} y={p.y} width="22" height="22" className={`ssl-${p.role}`} />
      ))}
      <Label x={76} y={160} note>
        绿色填充：context
      </Label>
      <Label x={76} y={179} note>
        棕色粗框：target
      </Label>
      <Box x={180} y={33} width={148} label="Context encoder" sub="只读取可见 context" />
      <Box x={369} y={33} width={133} label="Predictor" sub="预测 target features" />
      <Box x={537} y={99} width={109} label="Feature loss" tone="clay" />
      <Box x={12} y={234} width={117} label="完整图像" tone="neutral" />
      <Box x={180} y={234} width={148} label="Target encoder" sub="EMA 参数" tone="teal" />
      <Box
        x={369}
        y={234}
        width={153}
        label="选出 target 位置"
        sub="Normalization + stop-grad"
        tone="teal"
      />
      <Arrow id={id} d="M 129 59 H 178" />
      <Arrow id={id} d="M 328 59 H 367" />
      <Arrow id={id} d="M 502 59 H 520 V 112 H 535" />
      <Arrow id={id} d="M 129 260 H 178" />
      <Arrow id={id} d="M 328 260 H 367" />
      <Arrow id={id} d="M 522 260 H 591 V 153" />
      <Arrow id={id} d="M 254 85 V 232" update />
      <Label x={281} y={161} note>
        EMA
      </Label>
      <Label x={435} y={176} note>
        Target 的位置编码
      </Label>
      <Arrow id={id} d="M 435 158 V 87" />
      <Label x={330} y={318} note>
        空间布局为示意；实际训练采样多块 target，并移除与 context 的重叠
      </Label>
    </Figure>
  );
}

function VideoPrediction() {
  const id = 'ssl-video';
  return (
    <Figure
      id={id}
      title="视频 masked prediction 与带动作的规划"
      description="上半图：视频时间轴中的目标区域位于中间，可见 context 可以同时来自过去与未来；V-JEPA 在特征空间预测目标，这本身不是 causal dynamics。下半图：经过额外动作条件训练后，从当前表征输入候选动作序列，逐步预测未来表征，与目标表征比较，选取动作再执行；这是规划接口的简化示意。"
      caption="上方学习时空关系；下方是另经动作数据训练后的规划接口。颜色和布局只示意 context 与 target，不是实验结果。"
      height={412}
    >
      <Label x={330} y={26}>
        V-JEPA 预训练：用时空 context 预测被遮住的区域
      </Label>
      {[0, 1, 2, 3, 4].map((frame) => (
        <g key={frame}>
          {Array.from({ length: 9 }, (_, patch) => (
            <rect
              key={patch}
              x={20 + frame * 62 + (patch % 3) * 15}
              y={60 + Math.floor(patch / 3) * 15}
              width="12"
              height="12"
              className={frame === 2 ? 'ssl-target' : 'ssl-visible'}
            />
          ))}
          <MathLabel
            x={15 + frame * 62}
            y={109}
            width={50}
            tex={frame === 2 ? 't' : `t${frame < 2 ? '-' : '+'}${Math.abs(frame - 2)}`}
          />
        </g>
      ))}
      <Arrow id={id} d="M 23 153 H 310" />
      <Label x={162} y={176} note>
        Context 可同时来自目标之前与之后
      </Label>
      <Box
        x={370}
        y={57}
        width={274}
        label="Context encoder → predictor"
        sub="目标时间与位置作为预测条件"
      />
      <Box
        x={370}
        y={139}
        width={274}
        height={45}
        label="匹配 EMA teacher 的目标区域特征"
        tone="teal"
      />
      <Arrow id={id} d="M 313 80 H 368 M 508 111 V 137" />
      <path d="M 16 209 H 644" className="ssl-divider" />
      <Label x={330} y={235}>
        Action-conditioned 阶段之后：比较候选动作的预测结果
      </Label>
      <MathLabel x={12} y={293} width={61} tex="h_t" />
      {[0, 1].map((step) => (
        <g key={step}>
          <Box x={110 + step * 231} y={289} width={115} label="Predictor F" sub="输入状态与动作" />
          <MathLabel x={132 + step * 231} y={246} width={75} tex={step === 0 ? 'a_t' : 'a_{t+1}'} />
          <Arrow id={id} d={`M ${167 + step * 231} 282 V 287`} />
          <MathLabel
            x={244 + step * 231}
            y={292}
            width={80}
            tex={String.raw`\hat h_{t+${step + 1}}`}
          />
        </g>
      ))}
      <Arrow
        id={id}
        d="M 75 315 H 108 M 227 315 H 242 M 325 315 H 339 M 458 315 H 473 M 558 315 H 581"
      />
      <Box x={583} y={289} width={65} label="距离" sub="目标状态" tone="clay" />
      <MathLabel x={575} y={244} width={80} tex="h_{\mathrm{goal}}" />
      <Arrow id={id} d="M 615 282 V 287" />
      <Label x={330} y={377} note>
        比较候选动作序列 → 执行所选动作 → 用新观测重新规划
      </Label>
      <Label x={330} y={399} note>
        目标图像经 encoder 得到目标表征；图中省略动作后训练与控制器细节
      </Label>
    </Figure>
  );
}

export const POST_COMPONENTS = { JEPAPrediction, VideoPrediction };
