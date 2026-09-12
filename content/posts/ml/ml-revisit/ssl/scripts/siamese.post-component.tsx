import { Arrow, Box, Figure, Label } from './elements';

function SiameseBranches() {
  const id = 'ssl-siamese';
  return (
    <Figure id={id} title="BYOL 的一个预测方向"
      description="View 1 经过 online encoder、projector、predictor；view 2 经过 EMA target encoder 与 projector，再 stop-gradient。训练交换 views 后也计算另一个方向。SimSiam 用共享参数代替独立 EMA target。"
      caption="BYOL 的单方向示意。实线是前向数据流，虚线是 EMA；target 不通过 loss 反传，但随 EMA 持续更新。" height={268}>
      <Box x={14} y={34} width={84} label="View 1" tone="neutral" />
      <Box x={131} y={34} width={172} label="Encoder + projector" sub="Online：接收梯度" />
      <Box x={337} y={34} width={132} label="Predictor" />
      <Box x={517} y={85} width={128} label="Feature loss" sub="两侧先单位化" tone="clay" />
      <Box x={14} y={153} width={84} label="View 2" tone="neutral" />
      <Box x={131} y={153} width={172} label="Encoder + projector" sub="Target：EMA 更新" tone="teal" />
      <Box x={337} y={153} width={132} label="Stop-gradient" sub="只阻断反向梯度" tone="teal" />
      <Arrow id={id} d="M 98 60 H 129" />
      <Arrow id={id} d="M 303 60 H 335" />
      <Arrow id={id} d="M 469 60 H 490 V 99 H 515" />
      <Arrow id={id} d="M 98 179 H 129" />
      <Arrow id={id} d="M 303 179 H 335" />
      <Arrow id={id} d="M 469 179 H 490 V 123 H 515" />
      <Arrow id={id} d="M 216 86 V 151" update />
      <Label x={249} y={124} note>EMA</Label>
      <Label x={330} y={241}>SimSiam：共享 encoder / projector 参数，没有独立 EMA teacher</Label>
    </Figure>
  );
}

const VALUES = [-1, -0.6, -0.2, 0.2, 0.6, 1];
const CLOUD = [
  [-0.8, -0.7], [-0.8, 0.7], [0.8, -0.7], [0.8, 0.7],
  [-0.2, -0.3], [-0.2, 0.3], [0.2, -0.3], [0.2, 0.3],
] as const;

function CollapseGeometry() {
  const panels = [
    { title: 'Complete collapse', note: '样本间没有变化', points: VALUES.map(() => [0, 0]) },
    { title: 'Dimensional collapse', note: '两维变化完全重复', points: VALUES.map(v => [v, v]) },
    { title: '使用两个方向', note: '仍需检查语义与 view 对齐', points: CLOUD },
  ];
  return (
    <Figure id="ssl-collapse" title="常数退化与维度退化"
      description="左图所有样本重合，中图样本位于一条对角线上，右图在两个方向上都有变化。右图只是非退化的几何示意，并非真实训练结果或语义质量证明。"
      caption="同一套坐标比例。VICReg 的 variance 项针对左图，covariance 项还会惩罚中图的重复方向；右图只是几何示意。" height={247}>
      {panels.map((panel, i) => {
        const cx = 110 + i * 220;
        return <g key={panel.title}>
          <Label x={cx} y={28}>{panel.title}</Label>
          <path d={`M ${cx - 76} 126 H ${cx + 76} M ${cx} 50 V 202`} className="ssl-axis" />
          {panel.points.map(([x = 0, y = 0], j) => (
            <circle key={`${x}-${y}-${j}`} cx={cx + x * 62} cy={126 - y * 62} r="5" className="ssl-point" />
          ))}
          <Label x={cx} y={227} note>{panel.note}</Label>
        </g>;
      })}
    </Figure>
  );
}

export const POST_COMPONENTS = { SiameseBranches, CollapseGeometry };
