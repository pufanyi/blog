import { Arrow, Box, Figure, Label } from './elements';

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

export const POST_COMPONENTS = { JEPAPrediction };
