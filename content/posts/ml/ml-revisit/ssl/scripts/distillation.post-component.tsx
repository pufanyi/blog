import { Arrow, Box, Figure, ImageTile, Label, MathLabel } from './elements';

function Distribution({ x, y, values }: { x: number; y: number; values: number[] }) {
  return <g className="ssl-teal" aria-hidden="true">
    {values.map((p, i) => <rect key={i} x={x + i * 17} y={y + 40 - p * 58} width="12" height={p * 58} className="ssl-vector-bar" />)}
    <path d={`M ${x - 4} ${y + 42} H ${x + 66}`} className="ssl-axis" />
  </g>;
}

function DINOBranches() {
  const id = 'ssl-dino';
  return <Figure id={id} title="DINO：local 与 global views 向 EMA teacher 学习"
    description="Student 编码两份 global crops 和多份 local crops，产生 softmax 预测。Teacher 只编码 global crops，logits 经 running-center centering 和 sharpening 后 stop-gradient，监督不同 view 的 student。Teacher 参数的 EMA 来自 student 参数；center 的 EMA 来自 teacher batch logits 的平均，二者分开更新。"
    caption="实线：前向；长虚线：EMA；点线：梯度。两组小柱仅示意分布，输出槽位没有预先指定的类别含义。" height={407}>
    <Label x={76} y={25}>Global + local crops</Label>
    <ImageTile x={20} y={43} size={49} /><ImageTile x={84} y={43} size={49} />
    {[25, 65, 105].map(x => <ImageTile key={x} x={x} y={104} size={27} local />)}
    <Box x={183} y={63} width={164} label="Student encoder + head" sub="梯度更新" />
    <Box x={389} y={63} width={149} label="Softmax" sub="Student temperature" />
    <Distribution x={573} y={69} values={[0.12, 0.45, 0.28, 0.15]} />
    <Arrow id={id} d="M 135 88 H 181 M 349 89 H 387 M 540 89 H 568" />
    <Box x={549} y={165} width={98} height={56} label="Cross-entropy" sub="跨 view 配对" tone="clay" />
    <Arrow id={id} d="M 604 114 V 163" />
    <Arrow id={id} d="M 597 163 V 147 H 230 V 117" gradient />
    <Label x={421} y={184} note>排除 student 与 teacher</Label>
    <Label x={421} y={202} note>看同一份 crop 的配对</Label>
    <Label x={76} y={252}>仅 global crops</Label>
    <ImageTile x={20} y={271} size={49} /><ImageTile x={84} y={271} size={49} />
    <Box x={183} y={269} width={164} label="Teacher encoder + head" sub="不通过 loss 反传" tone="teal" />
    <Box x={389} y={269} width={149} label="Center + sharpen" sub="Teacher temperature" tone="teal" />
    <Distribution x={573} y={275} values={[0.06, 0.68, 0.19, 0.07]} />
    <Arrow id={id} d="M 135 294 H 181 M 349 295 H 387 M 540 295 H 568 M 603 273 V 223" />
    <Label x={603} y={248} note>Stop-grad</Label>
    <Arrow id={id} d="M 265 117 V 267" update />
    <Label x={306} y={230} note>参数 EMA</Label>
    <Box x={389} y={353} width={149} height={38} label="Running center" tone="neutral" />
    <Arrow id={id} d="M 368 295 V 372 H 387" update />
    <Arrow id={id} d="M 463 351 V 323" />
    <Label x={240} y={377} note>Teacher batch logits 的均值</Label>
  </Figure>;
}

export function patchGram(features: number[][]): number[][] {
  const normalized = features.map(row => {
    const norm = Math.hypot(...row);
    return row.map(value => value / norm);
  });
  return normalized.map(a => normalized.map(b => a.reduce((sum, value, i) => sum + value * b[i]!, 0)));
}

function Gram({ x, y, features }: { x: number; y: number; features: number[][] }) {
  return <g className="ssl-teal" aria-hidden="true">
    {patchGram(features).flatMap((row, i) => row.map((value, j) => <g key={`${i}-${j}`}>
      <rect x={x + j * 21} y={y + i * 21} width="19" height="19" className="ssl-cell" />
      <rect x={x + j * 21} y={y + i * 21} width="19" height="19" fill="currentColor" opacity={0.08 + Math.abs(value) * 0.55} />
    </g>))}
  </g>;
}

function PatchDistillation() {
  const id = 'ssl-patch-distillation';
  return <Figure id={id} title="从全局分布到 patch 与 patch 的关系"
    description="第一行：图像级 DINO loss 比较同一图像不同 crops 的 class-token 分布。第二行：iBOT 和 DINOv2 的 patch loss 在同一 crop 的对应位置比较 masked student 与 unmasked teacher。第三行：DINOv3 的 Gram anchoring 比较当前与稳定参考的 patch Gram matrices，矩阵的两个轴都是空间位置。"
    caption="每行突出一个监督尺度。前两行的 teacher 由 EMA 更新；第三行使用稳定参考，Gram 方格仅作示意。" height={400}>
    <Label x={330} y={25}>图像级：不同 crop 的全局判断一致</Label>
    <Box x={14} y={44} width={188} label="Student：crop A" sub="Class token → 分布" />
    <Box x={273} y={44} width={115} label="Global loss" tone="clay" />
    <Box x={458} y={44} width={188} label="Teacher：crop B" sub="Class token → 分布；stop-grad" tone="teal" />
    <Arrow id={id} d="M 204 70 H 271 M 456 70 H 390" />
    <path d="M 16 112 H 644" className="ssl-divider" />
    <Label x={330} y={138}>Patch 级：同一 crop 的对应位置</Label>
    <ImageTile x={18} y={157} size={56} masked />
    <Box x={93} y={158} width={132} label="Student patches" sub="被遮住的位置" />
    <Box x={273} y={158} width={115} label="Patch loss" tone="clay" />
    <Box x={435} y={158} width={132} label="Teacher patches" sub="对应位置；stop-grad" tone="teal" />
    <ImageTile x={588} y={157} size={56} />
    <Arrow id={id} d="M 76 184 H 91 M 227 184 H 271 M 433 184 H 390 M 586 184 H 569" />
    <Label x={119} y={235} note>Masked crop A</Label><Label x={540} y={235} note>Unmasked crop A</Label>
    <path d="M 16 254 H 644" className="ssl-divider" />
    <Label x={330} y={279}>DINOv3 Gram anchoring：保留空间关系</Label>
    <Box x={14} y={306} width={181} label="当前 patch features" sub="单位化后计算 Gram" />
    <Gram x={239} y={300} features={[[1, 0], [0.25, 1], [1, 1]]} />
    <Gram x={358} y={300} features={[[1, 0], [0, 1], [1, 1]]} />
    <Box x={464} y={306} width={182} label="稳定参考 features" sub="提供目标 patch 关系" tone="teal" />
    <Arrow id={id} d="M 197 332 H 237 M 462 332 H 423" />
    <MathLabel x={309} y={310} width={43} tex={String.raw`\approx`} />
    <Label x={330} y={385} note>比较位置之间的相似性，不是不同特征维度的 covariance</Label>
  </Figure>;
}

export const POST_COMPONENTS = { DINOBranches, PatchDistillation };
