const RANKS = [0, 1, 2, 3] as const;
const STATES = [
  { id: 'parameters', name: 'Parameters', term: '2\\Psi', bytes: 2, shardFrom: 3 },
  { id: 'gradients', name: 'Gradients', term: '2\\Psi', bytes: 2, shardFrom: 2 },
  { id: 'optimizer', name: 'Optimizer states', term: 'k\\Psi', bytes: 12, shardFrom: 1 },
] as const;
const STAGES = [
  { name: 'Baseline', detail: '全部复制' },
  { name: 'ZeRO-1', detail: '分片优化器状态' },
  { name: 'ZeRO-2', detail: '进一步分片梯度' },
  { name: 'ZeRO-3', detail: '进一步分片参数' },
] as const;

const WIDTH = 790;
const HEIGHT = 438;
const BAR_WIDTH = 88;
const ROW_HEIGHT = 96;
const BYTES_TO_HEIGHT = 4;
const BAND_GAP = 2;
const gpuX = (rank: number): number => 120 + rank * 110;
const rowY = (stage: number): number => 56 + stage * ROW_HEIGHT;
const bandY = (index: number): number =>
  STATES.slice(0, index).reduce((sum, state) => sum + state.bytes * BYTES_TO_HEIGHT + BAND_GAP, 0);

function memoryFormula(stage: number): string {
  const replicated = STATES.filter((state) => stage < state.shardFrom).map((state) => state.term);
  const sharded = STATES.filter((state) => stage >= state.shardFrom).map((state) => state.term);
  return [...replicated, ...(sharded.length ? [`\\frac{${sharded.join('+')}}{N_d}`] : [])].join(
    '+',
  );
}

function GpuState({ rank, stage }: { rank: number; stage: number }) {
  return (
    <g transform={`translate(${gpuX(rank)} ${rowY(stage)})`}>
      {STATES.map((state, index) => {
        const sharded = stage >= state.shardFrom;
        const height = state.bytes * BYTES_TO_HEIGHT;
        const shardWidth = BAR_WIDTH / RANKS.length;
        return (
          <g key={state.id} className={`infra-zero-${state.id}`}>
            {sharded && (
              <rect
                x="0"
                y={bandY(index)}
                width={BAR_WIDTH}
                height={height}
                className="infra-zero-outline"
              />
            )}
            {RANKS.filter((shard) => !sharded || shard === rank).map((shard) => (
              <rect
                key={shard}
                x={shard * shardWidth}
                y={bandY(index)}
                width={shardWidth}
                height={height}
                className="infra-zero-block"
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function ZeroShardingDiagram() {
  return (
    <figure id="zero-sharding" className="infra-zero-figure">
      <div
        className="infra-zero-scroll"
        role="region"
        aria-label="ZeRO 分片与单卡显存对比，可横向滚动"
        tabIndex={0}
      >
        <svg
          className="infra-zero-diagram"
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width={WIDTH}
          height={HEIGHT}
          role="img"
          aria-labelledby="infra-zero-title infra-zero-description"
        >
          <title id="infra-zero-title">ZeRO：从复制模型状态到逐步分片</title>
          <desc id="infra-zero-description">
            四列分别代表 GPU 0 至 GPU 3；每张卡的色块从上到下是参数、梯度、优化器状态。 Baseline
            在每张卡复制全部三类状态。ZeRO-1 只分片优化器状态，ZeRO-2 进一步分片梯度，ZeRO-3
            再分片参数。分片后 GPU i 仅保留第 i
            份，四张卡的分片合起来是一份完整状态。虚线框标出分片前的范围，留白部分不在本卡存储。
            右侧逐行给出每张 GPU 的模型状态显存公式。
          </desc>
          {RANKS.map((rank) => (
            <text key={rank} x={gpuX(rank) + BAR_WIDTH / 2} y="28" className="infra-zero-heading">
              {`GPU ${rank}`}
            </text>
          ))}
          <text x="677" y="21" className="infra-zero-heading">
            Memory / GPU
          </text>
          <text x="677" y="40" className="infra-zero-unit">
            模型状态 · bytes
          </text>
          <line x1="557" y1="10" x2="557" y2="428" className="infra-zero-divider" />
          {STAGES.map((stage, index) => (
            <g key={stage.name}>
              <text x="10" y={rowY(index) + 28} className="infra-zero-stage">
                {stage.name}
              </text>
              <text x="10" y={rowY(index) + 48} className="infra-zero-detail">
                {stage.detail}
              </text>
              {RANKS.map((rank) => (
                <GpuState key={rank} rank={rank} stage={index} />
              ))}
              <foreignObject x="568" y={rowY(index) - 1} width="218" height="72">
                <div className="infra-zero-formula">{`\\(\\displaystyle ${memoryFormula(index)}\\)`}</div>
              </foreignObject>
              <line
                x1="10"
                y1={rowY(index) + 82}
                x2="780"
                y2={rowY(index) + 82}
                className="infra-zero-divider"
              />
            </g>
          ))}
        </svg>
      </div>
      <div className="infra-zero-scroll-hint">左右滑动查看各 GPU 和显存公式</div>
      <div className="infra-zero-legend">
        {STATES.map((state) => (
          <span key={state.id} className={`infra-zero-legend-item infra-zero-${state.id}`}>
            <span className="infra-zero-swatch" aria-hidden="true" />
            <span>
              {state.name} <span className="infra-zero-legend-term">{`\\(${state.term}\\)`}</span>
            </span>
          </span>
        ))}
      </div>
      <figcaption>
        {'图示 \\(N_d = 4\\)，每张卡保留的分片位置不同；虚线框中的留白由其他 GPU 持有。'}
        <br />
        {
          '\\(\\Psi\\) 为参数量，\\(N_d\\) 为数据并行度。参数与梯度按 16-bit 计，优化器状态为每参数 \\(k\\) bytes；色块高度按混合精度 Adam 的 \\(k = 12\\) 绘制（FP32 主权重及一、二阶矩）。仅计模型状态，不含激活与临时通信缓冲区。'
        }
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { ZeroShardingDiagram };
