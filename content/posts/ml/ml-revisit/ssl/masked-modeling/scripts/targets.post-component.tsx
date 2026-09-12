import { Arrow, Box, Figure, Label } from '../../overview/scripts/elements';

const VISIBLE = new Set([0, 3, 9, 14]);
const PATCHES = Array.from({ length: 16 }, (_, index) => ({
  index, row: Math.floor(index / 4), column: index % 4, visible: VISIBLE.has(index),
}));

function MaskedTargets() {
  const id = 'ssl-masked';
  return (
    <Figure id={id} title="MAE 与 BEiT：输入的计算与预测目标"
      description="示意网格有 16 个 patches，MAE 保留 4 个可见 patches 进入 encoder，在 decoder 补入 mask tokens 后回归像素。BEiT 的 encoder 处理可见和 mask tokens，预测固定 tokenizer 产生的离散 IDs。这里的网格仅示意 MAE 的 75% masking，不代表 BEiT 的 mask 配方。"
      caption="上图以 16 个 patches 保留 4 个示意 MAE；下图只比较 BEiT 的计算路径，并不共用上图的 mask ratio。" height={330}>
      <Label x={80} y={25}>MAE：只编码可见部分</Label>
      {PATCHES.map(p => <rect key={p.index} x={20 + p.column * 27} y={42 + p.row * 27}
        width="22" height="22" className={p.visible ? 'ssl-visible' : 'ssl-masked'} />)}
      <Box x={173} y={58} width={123} label="Encoder" sub="4 个 visible tokens" />
      <Box x={350} y={58} width={135} label="小 Decoder" sub="补齐为 16 个 tokens" tone="teal" />
      <Box x={534} y={58} width={113} label="Pixels" sub="Masked-only MSE" tone="clay" />
      <Arrow id={id} d="M 130 84 H 171" />
      <Arrow id={id} d="M 296 84 H 348" />
      <Arrow id={id} d="M 485 84 H 532" />
      <Label x={417} y={146} note>Mask tokens + 位置编码</Label>
      <Arrow id={id} d="M 417 130 V 112" />
      <Label x={88} y={188}>BEiT：替换部分 tokens</Label>
      <Box x={14} y={211} width={128} label="Visible + mask" sub="完整位置序列" tone="neutral" />
      <Box x={190} y={211} width={128} label="ViT encoder" />
      <Box x={363} y={211} width={122} label="分类 Head" tone="teal" />
      <Box x={532} y={211} width={115} label="Token IDs" sub="Cross-entropy" tone="clay" />
      <Arrow id={id} d="M 142 237 H 188" />
      <Arrow id={id} d="M 318 237 H 361" />
      <Arrow id={id} d="M 485 237 H 530" />
      <Label x={390} y={306} note>完整原图 → 固定 tokenizer → target IDs</Label>
      <Arrow id={id} d="M 590 291 V 265" />
    </Figure>
  );
}

export const POST_COMPONENTS = { MaskedTargets };
