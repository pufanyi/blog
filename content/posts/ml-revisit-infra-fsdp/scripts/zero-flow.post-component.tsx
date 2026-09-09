const RANKS = [0, 1, 2, 3] as const;
type Stage = 1 | 2 | 3;
type Tensor = 'parameters' | 'gradients' | 'optimizer';
type Layout = 'replicated' | 'sharded' | 'retained';
type Collective = 'all-gather' | 'reduce-scatter';

const METHODS = [
  { stage: 1, partition: 'Optimizer states 分片' },
  { stage: 2, partition: '再分片 Gradients' },
  { stage: 3, partition: '再分片 Parameters' },
] as const;
const PANEL_WIDTH = 246;
const PANEL_HEIGHT = 866;
const CELL = 9;
const BAR_WIDTH = CELL * RANKS.length;
const BAR_HEIGHT = 8;
const gpuX = (rank: number): number => 24 + rank * 54;

interface Transfer {
  source: number;
  destination: number;
  shard: number;
}

// A reduction routes the same shard from every source to its owner. A gather
// broadcasts each owner's updated shard to the same slot at every destination.
export function zeroTransfers(operation: Collective): Transfer[] {
  return RANKS.flatMap((source) =>
    RANKS.map((destination) => ({
      source,
      destination,
      shard: operation === 'all-gather' ? source : destination,
    })),
  );
}

function TensorRow({
  y,
  tensor,
  layout,
  reduced = false,
}: {
  y: number;
  tensor: Tensor;
  layout: Layout;
  reduced?: boolean;
}) {
  return (
    <g className={`infra-zero-flow-tensors infra-zero-${tensor}`}>
      {RANKS.map((rank) => (
        <g key={rank}>
          {layout === 'sharded' && (
            <rect x={gpuX(rank)} y={y} width={BAR_WIDTH} height={BAR_HEIGHT} className="infra-zero-outline" />
          )}
          {RANKS.filter((shard) => layout !== 'sharded' || shard === rank).map((shard) => (
            <rect
              key={shard}
              x={gpuX(rank) + shard * CELL}
              y={y}
              width={CELL}
              height={BAR_HEIGHT}
              className={`infra-zero-block${layout === 'retained' && shard !== rank ? ' infra-zero-flow-unused' : ''}`}
            />
          ))}
          {reduced && (
            <rect x={gpuX(rank) + rank * CELL} y={y} width={CELL} height={BAR_HEIGHT} className="infra-zero-flow-reduced" />
          )}
        </g>
      ))}
    </g>
  );
}

function Exchange({ operation, from, to, stage }: { operation: Collective; from: number; to: number; stage: Stage }) {
  const tensor = operation === 'all-gather' ? 'parameters' : 'gradients';
  return (
    <g className={`infra-zero-flow-exchange infra-zero-${tensor}`}>
      {zeroTransfers(operation).map(({ source, destination, shard }) => {
        const focus = operation === 'all-gather' ? source === 0 : destination === 0;
        // Separate ports keep fan-in arrowheads and fan-out origins distinguishable.
        const sourcePort = operation === 'all-gather' ? (destination + 0.5) / RANKS.length : 0.5;
        const destinationPort = operation === 'reduce-scatter' ? (source + 0.5) / RANKS.length : 0.5;
        return (
          <path
            key={`${source}-${destination}`}
            d={`M ${gpuX(source) + (shard + sourcePort) * CELL} ${from + BAR_HEIGHT + 2} L ${gpuX(destination) + (shard + destinationPort) * CELL} ${to - 3}`}
            className={`infra-zero-flow-transfer${focus ? ' infra-zero-flow-transfer-focus' : ''}`}
            markerEnd={`url(#zero-flow-${stage}-${tensor}-arrow)`}
          />
        );
      })}
    </g>
  );
}

function LocalFlow({ from, to, stage }: { from: number; to: number; stage: Stage }) {
  return (
    <g className="infra-zero-flow-local">
      {RANKS.map((rank) => (
        <path key={rank} d={`M ${gpuX(rank) + BAR_WIDTH / 2} ${from} V ${to}`} markerEnd={`url(#zero-flow-${stage}-local-arrow)`} />
      ))}
    </g>
  );
}

function Operation({ y, title }: { y: number; title: string }) {
  return (
    <g>
      <rect x="16" y={y} width="220" height="30" rx="4" className="infra-zero-flow-operation" />
      <text x="126" y={y + 20} className="infra-zero-flow-action">{title}</text>
    </g>
  );
}

function FlowPanel({ stage }: { stage: Stage }) {
  const parametersSharded = stage === 3;
  const parameterLayout = parametersSharded ? 'sharded' : 'replicated';
  const gradientLayout = stage === 1 ? 'retained' : 'sharded';
  const description = [
    `ZeRO-${stage} 的四张 GPU 从上到下经历前向、反向、优化器更新和下一步。`,
    parametersSharded
      ? '前向按层 All-Gather 参数，计算后释放完整参数。反向按逆序再次 All-Gather 本层参数，计算梯度，再 Reduce-Scatter 平均梯度并只保留本卡分片，释放完整参数。'
      : '完整参数常驻，前向和反向无需参数 All-Gather。反向产生的梯度通过 Reduce-Scatter 求平均，每张卡负责一个归约后的梯度分片。',
    stage === 1
      ? 'ZeRO-1 保留完整梯度缓冲区；描边标出本卡负责的已归约分片，其余淡色部分是本地梯度，不表示已得到完整平均梯度。'
      : '梯度就绪后按 bucket 归约，及时释放非本卡的梯度，仅保留本卡负责的已归约分片。',
    parametersSharded
      ? 'AdamW 只更新本卡参数分片，更新后不聚合完整模型；下一次前向再按层 All-Gather。'
      : 'AdamW 只更新本卡参数分片，然后 All-Gather 更新后的参数，使每张卡在下一步再次持有完整模型。',
    '实线箭头传参数，虚线箭头归约梯度；深色路径强调 GPU 0 的通信，其余 GPU 同时执行相同操作。',
  ].join(' ');
  return (
    <svg
      className="infra-zero-flow-diagram"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${PANEL_WIDTH} ${PANEL_HEIGHT}`}
      width={PANEL_WIDTH}
      height={PANEL_HEIGHT}
      role="img"
      aria-labelledby={`zero-flow-${stage}-title zero-flow-${stage}-description`}
    >
      <title id={`zero-flow-${stage}-title`}>{`ZeRO-${stage}：训练流程与 GPU 间通信`}</title>
      <desc id={`zero-flow-${stage}-description`}>{description}</desc>
      <defs>
        {(['parameters', 'gradients', 'local'] as const).map((kind) => (
          <marker key={kind} id={`zero-flow-${stage}-${kind}-arrow`} markerWidth="4" markerHeight="4" refX="3.6" refY="2" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 4 2 L 0 4 Z" className={`infra-zero-flow-arrow-${kind}`} />
          </marker>
        ))}
      </defs>
      {RANKS.map((rank) => (
        <text key={rank} x={gpuX(rank) + BAR_WIDTH / 2} y="20" className="infra-zero-flow-rank">{`GPU ${rank}`}</text>
      ))}
      <TensorRow y={32} tensor="parameters" layout={parameterLayout} />
      <TensorRow y={45} tensor="optimizer" layout="sharded" />
      <text x="126" y="73" className="infra-zero-flow-note">迭代开始 · 各卡持有的状态</text>

      <rect x="8" y="88" width="232" height="230" rx="5" className="infra-zero-flow-phase" />
      <text x="20" y="109" className="infra-zero-flow-phase-title">FORWARD · 层 1 → L</text>
      <text x="126" y="134" className={`infra-zero-flow-label${parametersSharded ? ' infra-zero-parameters' : ''}`}>
        {parametersSharded ? 'All-Gather · 本层参数' : '完整参数已在本卡 · 无通信'}
      </text>
      <TensorRow y={148} tensor="parameters" layout={parameterLayout} />
      {parametersSharded ? <Exchange stage={stage} operation="all-gather" from={148} to={210} /> : <LocalFlow stage={stage} from={160} to={205} />}
      <TensorRow y={210} tensor="parameters" layout="replicated" />
      <Operation y={226} title="Forward" />
      <LocalFlow stage={stage} from={262} to={277} />
      <TensorRow y={282} tensor="parameters" layout={parameterLayout} />
      <text x="126" y="306" className="infra-zero-flow-note">{parametersSharded ? '用完释放完整参数 → 下一层' : '完整参数常驻 → 下一层'}</text>

      <rect x="8" y="334" width="232" height="312" rx="5" className="infra-zero-flow-phase" />
      <text x="20" y="355" className="infra-zero-flow-phase-title">BACKWARD · 层 L → 1</text>
      <text x="126" y="380" className={`infra-zero-flow-label${parametersSharded ? ' infra-zero-parameters' : ''}`}>
        {parametersSharded ? '再次 All-Gather · 本层参数' : '完整参数仍在本卡 · 无通信'}
      </text>
      <TensorRow y={394} tensor="parameters" layout={parameterLayout} />
      {parametersSharded ? <Exchange stage={stage} operation="all-gather" from={394} to={446} /> : <LocalFlow stage={stage} from={406} to={441} />}
      <TensorRow y={446} tensor="parameters" layout="replicated" />
      <Operation y={462} title="Backward" />
      <text x="126" y="512" className="infra-zero-flow-label infra-zero-gradients">Reduce-Scatter · 平均梯度</text>
      <TensorRow y={526} tensor="gradients" layout="replicated" />
      <Exchange stage={stage} operation="reduce-scatter" from={526} to={582} />
      <TensorRow y={582} tensor="gradients" layout={gradientLayout} reduced />
      <text x="126" y="611" className="infra-zero-flow-note">{stage === 1 ? '保留完整梯度缓冲区' : '逐 bucket 归约 · 只保留本卡梯度'}</text>
      <text x="126" y="631" className="infra-zero-flow-note">{parametersSharded ? '释放本层完整参数 → 上一层' : stage === 1 ? '描边：本卡负责的已归约分片' : '其他梯度及时释放'}</text>

      <rect x="8" y="662" width="232" height="194" rx="5" className="infra-zero-flow-phase" />
      <text x="20" y="683" className="infra-zero-flow-phase-title">OPTIMIZER STEP</text>
      <Operation y={694} title="AdamW · 更新本卡分片" />
      <text x="126" y="744" className={`infra-zero-flow-label${parametersSharded ? '' : ' infra-zero-parameters'}`}>
        {parametersSharded ? '更新后保留分片 · 无通信' : 'All-Gather · 更新后的参数'}
      </text>
      <TensorRow y={756} tensor="parameters" layout="sharded" />
      {parametersSharded ? <LocalFlow stage={stage} from={768} to={811} /> : <Exchange stage={stage} operation="all-gather" from={756} to={816} />}
      <TensorRow y={816} tensor="parameters" layout={parameterLayout} />
      <text x="126" y="844" className="infra-zero-flow-note">{parametersSharded ? '下一步前向时再按层聚合' : '完整模型就绪 → 下一步前向'}</text>
    </svg>
  );
}

function ZeroFlowComparison() {
  return (
    <figure id="zero-flow" className="infra-zero-flow-figure">
      <div className="infra-zero-flow-scroll" role="region" aria-label="ZeRO 三种方法的训练流程对比，可横向滚动" tabIndex={0}>
        <div className="infra-zero-flow-grid">
          {METHODS.map(({ stage, partition }) => (
            <div key={stage} className="infra-zero-flow-panel">
              <div className="infra-zero-flow-heading"><strong>{`ZeRO-${stage}`}</strong><span>{partition}</span></div>
              <FlowPanel stage={stage} />
              <div className="infra-zero-flow-cost">
                <span>每步通信量</span>
                <span>{stage === 3 ? '\\(2\\Psi + 2\\Psi + 2\\Psi = 6\\Psi\\)' : '\\(2\\Psi + 2\\Psi = 4\\Psi\\)'}</span>
                <span>{stage === 3 ? '前向 AG + 反向 AG + 梯度 RS' : '梯度 RS + 更新后 AG'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="infra-zero-flow-scroll-hint">左右滑动对比 ZeRO-1 / ZeRO-2 / ZeRO-3</div>
      <div className="infra-zero-legend">
        <span className="infra-zero-legend-item infra-zero-parameters"><span className="infra-zero-swatch" aria-hidden="true" /><span>Parameters · 实线传输</span></span>
        <span className="infra-zero-legend-item infra-zero-gradients"><span className="infra-zero-swatch" aria-hidden="true" /><span>Gradients · 虚线归约</span></span>
        <span className="infra-zero-legend-item infra-zero-optimizer"><span className="infra-zero-swatch" aria-hidden="true" /><span>Optimizer states</span></span>
      </div>
      <figcaption>
        {'每条色带分为 \\(N_d = 4\\) 片，GPU i 负责第 i 片；深色箭头突出 GPU 0 的通信，其余路径淡化。所有方法中，优化器状态始终只保留本卡分片；更新处仅画出各卡新更新的参数分片。ZeRO-1 的淡色梯度是保留的本地缓冲区，不表示完整平均梯度。'}
        <br />
        {'ZeRO-3 的前向、反向框分别对每层重复，仅临时聚合当前层参数。通信量沿用正文的 16-bit 口径，忽略 \\(\\frac{N_d-1}{N_d}\\)；逐层 / bucket 的通信量按整个模型求和，不表示只有一次 API 调用。图中不展开预取与通信计算重叠。'}
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { ZeroFlowComparison };
