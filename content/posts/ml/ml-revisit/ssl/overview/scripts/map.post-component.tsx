import { Box, Figure, Label } from './elements';

const FAMILIES = [
  ['Contrastive', '样本身份 / 另一 view', '负样本比较'],
  ['Self-distillation', 'Teacher / prototype 分布', '非对称更新 / 分配约束'],
  ['Masked prediction', '像素 / token / 连续特征', '取决于 target 的来源'],
  ['Distribution regularization', '另一 view 的连续特征', '方差 / covariance / Gaussian'],
] as const;

function SSLMap() {
  return (
    <Figure id="ssl-map" title="用预测目标和避免退化的机制阅读 SSL"
      description="四种可交叉的设计：contrastive 比较样本，self-distillation 匹配 teacher 或 prototype，masked prediction 隐藏部分输入，分布正则化约束整个 batch 的特征。"
      caption="按设计问题阅读：同一种算法可以同时使用 masking、teacher 和分布约束。" height={314}>
      <Label x={124} y={28}>设计思路</Label>
      <Label x={344} y={28}>预测什么</Label>
      <Label x={554} y={28}>怎样保持可区分</Label>
      {FAMILIES.map(([name, target, control], i) => (
        <g key={name}>
          <Box x={12} y={44 + i * 64} width={224} label={name} tone="blue" />
          <Box x={246} y={44 + i * 64} width={196} label={target} tone="teal" />
          <Box x={452} y={44 + i * 64} width={196} label={control} tone="neutral" />
        </g>
      ))}
    </Figure>
  );
}

export const POST_COMPONENTS = { SSLMap };
