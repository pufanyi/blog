import { Arrow, Box, Figure, Label, MathLabel } from './elements';

function SimSiamPaths() {
  const id = 'ssl-simsiam';
  return (
    <Figure
      id={id}
      title="SimSiam：共享参数，按计算路径 stop-gradient"
      description="两份 view 经同一 encoder 和 projector 得到 z1、z2。第一个方向由 predictor 从 z1 预测 stop-gradient 的 z2；第二个方向从 z2 预测 stop-gradient 的 z1。两个方向的 predictor 也共享参数。每个 z 在自己的预测路径接收梯度，在对方的目标路径被 detach，没有独立 EMA teacher。"
      caption="同一个表征有两种角色：作为预测输入时接收梯度，作为另一方向的 target 时 stop-gradient。"
      height={359}
    >
      <Box x={20} y={37} width={86} height={42} label="View 1" tone="neutral" />
      <Box x={20} y={109} width={86} height={42} label="View 2" tone="neutral" />
      <Box
        x={173}
        y={55}
        width={210}
        height={79}
        label="共享 encoder + projector"
        sub="同一套参数，处理两份 view"
      />
      <MathLabel x={453} y={39} width={54} tex="z_1" />
      <MathLabel x={453} y={109} width={54} tex="z_2" />
      <Arrow id={id} d="M 108 58 H 143 V 78 H 171 M 108 130 H 143 V 112 H 171" />
      <Arrow id={id} d="M 385 78 H 423 V 60 H 451 M 385 112 H 423 V 130 H 451" />
      <Label x={570} y={86} note>
        没有 EMA teacher
      </Label>
      <path d="M 16 172 H 644" className="ssl-divider" />
      {[0, 1].map((i) => {
        const y = 198 + i * 80;
        const source = i + 1,
          target = 2 - i;
        return (
          <g key={i}>
            <MathLabel x={12} y={y + 3} width={48} tex={`z_${source}`} />
            <Box x={98} y={y} width={120} height={46} label="Predictor" />
            <MathLabel x={250} y={y + 3} width={48} tex={`p_${source}`} />
            <Box
              x={338}
              y={y}
              width={125}
              height={46}
              label={`方向 ${i + 1} 的 loss`}
              tone="clay"
            />
            <Box
              x={508}
              y={y}
              width={138}
              height={46}
              label={`来自 view ${target}`}
              sub="Stop-gradient"
              tone="teal"
            />
            <Arrow
              id={id}
              d={`M 60 ${y + 23} H 96 M 220 ${y + 23} H 247 M 300 ${y + 23} H 336 M 506 ${y + 23} H 465`}
            />
          </g>
        );
      })}
      <Label x={330} y={349} note>
        两个方向共同训练；predictor 参数也共享
      </Label>
    </Figure>
  );
}

function Matrix({
  x,
  y,
  identity = false,
  diagonal = '1',
}: {
  x: number;
  y: number;
  identity?: boolean;
  diagonal?: string;
}) {
  return (
    <g aria-hidden="true">
      {Array.from({ length: 9 }, (_, k) => {
        const row = Math.floor(k / 3),
          column = k % 3;
        return (
          <g key={k}>
            <rect
              x={x + column * 26}
              y={y + row * 26}
              width="23"
              height="23"
              className={row === column ? 'ssl-positive' : 'ssl-cell'}
            />
            {identity && (
              <Label x={x + column * 26 + 11.5} y={y + row * 26 + 16} note>
                {row === column ? diagonal : '0'}
              </Label>
            )}
          </g>
        );
      })}
    </g>
  );
}

function CorrelationObjectives() {
  const id = 'ssl-correlation';
  return (
    <Figure
      id={id}
      title="Barlow Twins 与 VICReg 到底比较什么"
      description="上半图：Barlow Twins 在两个 view 之间比较每个特征维度，目标 cross-correlation 为单位矩阵。下半图：VICReg 分别比较同一图像的两份输出、检查每一维跨样本的标准差、惩罚同一分支 covariance 的非对角项。矩阵横纵轴都是特征维度，不是样本身份。"
      caption="上方跨 view 比较维度，下方拆开约束。矩阵是目标示意：VICReg 的 * 表示对角方差不被强制设为 1。"
      height={375}
    >
      <Label x={330} y={27}>
        Barlow Twins：跨 view 的特征相关性
      </Label>
      <Box x={14} y={76} width={155} label="View 1 的整批输出" sub="逐维在 batch 上标准化" />
      <Box
        x={206}
        y={76}
        width={155}
        label="View 2 的整批输出"
        sub="逐维在 batch 上标准化"
        tone="teal"
      />
      <Matrix x={432} y={64} identity />
      <Arrow id={id} d="M 169 91 H 187 V 45 H 469 V 61 M 363 105 H 430" />
      <MathLabel x={423} y={139} width={93} tex="C\to I_d" />
      <Label x={584} y={89} note>
        同一维：对齐
      </Label>
      <Label x={584} y={112} note>
        不同维：去冗余
      </Label>
      <path d="M 16 190 H 644" className="ssl-divider" />
      <Label x={330} y={216}>
        VICReg：把三个要求分开写
      </Label>
      {[16, 234, 452].map((x) => (
        <rect key={x} x={x} y="231" width="192" height="128" rx="5" className="ssl-panel" />
      ))}
      <Label x={112} y={253}>
        Invariance
      </Label>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={65 + i * 43} cy="279" r="5" className="ssl-point" />
          <circle cx={65 + i * 43} cy="310" r="5" className="ssl-mass" />
          <path d={`M ${65 + i * 43} 285 V 304`} className="ssl-edge" />
        </g>
      ))}
      <Label x={112} y={344} note>
        每对 view 相互对齐
      </Label>
      <Label x={330} y={253}>
        Variance
      </Label>
      <path d="M 252 298 H 426" className="ssl-axis" />
      {[265, 290, 328, 353, 404].map((x) => (
        <circle key={x} cx={x} cy="298" r="5" className="ssl-point" />
      ))}
      <Label x={330} y={280} note>
        某一维，在不同样本上
      </Label>
      <Label x={330} y={344} note>
        标准差达到下界
      </Label>
      <Label x={548} y={253}>
        Covariance
      </Label>
      <g transform="translate(516 264) scale(.72)">
        <Matrix x={0} y={0} identity diagonal="*" />
      </g>
      <Label x={548} y={344} note>
        每个分支分别去冗余
      </Label>
    </Figure>
  );
}

export const POST_COMPONENTS = { SimSiamPaths, CorrelationObjectives };
