import { Arrow, Box, Figure, Label } from '../../overview/scripts/elements';

function SwappedAssignments() {
  const id = 'ssl-swap';
  return (
    <Figure id={id} title="SwAV 的 swapped prediction"
      description="两个 view 的 embedding 与同一组 prototypes 计算 scores。各自的 scores 生成预测分布和 batch-balanced assignment；view 1 的 assignment 监督 view 2 的预测，反向也一样。"
      caption="每条跨行箭头表示来自另一 view 的监督。Assignment 由整个 batch 的 scores 联合计算，作为固定目标。" height={292}>
      {[0, 1].map(i => {
        const y = 45 + i * 150;
        return <g key={i}>
          <Box x={12} y={y} width={82} label={`View ${i + 1}`} tone="neutral" />
          <Box x={123} y={y} width={144} label="Embedding + scores" sub="两份 view 共享参数" />
          <Box x={311} y={y} width={139} label={`View ${i + 1} 的预测`} sub="Softmax；接收梯度" tone="blue" />
          <Box x={494} y={y} width={154} label={`View ${i + 1} 的 assignment`} sub="Balanced；stop-gradient" tone="teal" />
          <Arrow id={id} d={`M 94 ${y + 26} H 121`} />
          <Arrow id={id} d={`M 267 ${y + 26} H 309`} />
          <Arrow id={id} d={`M 195 ${i === 0 ? y : y + 52} V ${i === 0 ? 16 : 275} H 570 V ${i === 0 ? y - 2 : y + 54}`} />
        </g>;
      })}
      <Arrow id={id} d="M 570 97 C 570 143 383 146 383 193" />
      <Arrow id={id} d="M 570 195 C 570 149 383 145 383 99" />
      <Label x={163} y={141}>同一张原图的两份 view</Label>
      <Label x={163} y={163} note>用对方的 assignment 训练自己的预测</Label>
    </Figure>
  );
}

export const POST_COMPONENTS = { SwappedAssignments };
