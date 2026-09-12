import { Arrow, Box, Figure, Label } from './elements';

function ContrastiveDictionary() {
  const id = 'ssl-dictionary';
  return (
    <Figure id={id} title="SimCLR 与 MoCo v1/v2 的候选集合"
      description="SimCLR 从当前 batch 的其他 views 构造候选，两个分支都接收梯度。MoCo v1/v2 用当前 positive key 和 FIFO queue 中的历史 negatives；key encoder 由 query encoder 的 EMA 更新。"
      caption="实线表示数据流，虚线表示 EMA 参数更新。MoCo v3 不使用图中 v1/v2 的历史 queue。" height={326}>
      <Label x={90} y={28}>SimCLR</Label>
      <Box x={20} y={47} width={140} label="Anchor view" />
      <Box x={207} y={47} width={174} label="共享 encoder + head" sub="当前 step 都接收梯度" />
      <Box x={428} y={47} width={212} label="当前 batch 的候选" sub="一个 positive，其余 negatives" tone="teal" />
      <Arrow id={id} d="M 160 73 H 205" />
      <Arrow id={id} d="M 381 73 H 426" />
      <Label x={330} y={124} note>每个 view 都轮流成为 anchor；从候选中排除自身</Label>
      <Label x={90} y={161}>MoCo v1/v2</Label>
      <Box x={20} y={180} width={140} label="Query encoder" sub="梯度更新" />
      <Box x={207} y={180} width={174} label="对比目标" sub="从候选中找到 positive" tone="neutral" />
      <Box x={428} y={167} width={212} height={43} label="当前 positive key" tone="teal" />
      <Box x={428} y={225} width={212} height={43} label="FIFO queue：历史 negatives" tone="clay" />
      <Box x={20} y={260} width={140} height={43} label="Key encoder" tone="teal" />
      <Arrow id={id} d="M 160 206 H 205" />
      <Arrow id={id} d="M 428 190 H 404 V 196 H 383" />
      <Arrow id={id} d="M 428 247 H 397 V 218 H 383" />
      <Arrow id={id} d="M 160 283 H 649 V 189 H 642" />
      <Arrow id={id} d="M 534 211 V 223" />
      <Arrow id={id} d="M 90 232 V 258" update />
      <Label x={183} y={249} note>EMA</Label>
      <Label x={364} y={306} note>新 keys 入队，最旧 keys 出队</Label>
    </Figure>
  );
}

export const POST_COMPONENTS = { ContrastiveDictionary };
