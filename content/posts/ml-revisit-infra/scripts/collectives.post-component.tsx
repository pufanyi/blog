const RANKS = [0, 1, 2, 3] as const;
const LETTERS = ['A', 'B', 'C', 'D'] as const;
const SUBSCRIPTS = ['₀', '₁', '₂', '₃'] as const;

interface Term {
  source: number;
  shard?: number;
}

interface Block {
  terms: readonly Term[];
}

type Row = readonly Block[] | null;
type State = readonly Row[];

interface Operation {
  id: string;
  name: string;
  verb: string;
  description: string;
  input: State;
  output: State;
  flow: 'out' | 'in' | 'concat' | 'sum' | 'exchange';
  root?: boolean;
}

const block = (source: number, shard?: number): Block => ({ terms: [{ source, shard }] });
const sum = (blocks: readonly Block[]): Block => ({ terms: blocks.flatMap((item) => item.terms) });
const atRoot = (blocks: readonly Block[]): State =>
  RANKS.map((rank) => (rank === 0 ? blocks : null));
const replicate = (blocks: readonly Block[]): State => RANKS.map(() => blocks);

const pieces = RANKS.map((rank) => block(rank));
const distributedPieces = pieces.map((item) => [item]);
const vectors = RANKS.map((rank) => RANKS.map((shard) => block(rank, shard)));
// A destination receives the same-position shard from each source rank.
const columns = RANKS.map((shard) => vectors.map((row) => row[shard]!));
const totals = columns.map(sum);
const reducedShards = totals.map((item) => [item]);
const reducedEverywhere = replicate(reducedShards.flat());

const OPERATIONS: readonly Operation[] = [
  {
    id: 'broadcast',
    name: 'Broadcast',
    verb: '整份复制',
    description: 'R0 的完整张量 A、B、C、D 被复制到所有 rank，每个 rank 都得到完整的一份。',
    input: atRoot(pieces),
    output: replicate(pieces),
    flow: 'out',
    root: true,
  },
  {
    id: 'scatter',
    name: 'Scatter',
    verb: '切开分发',
    description: 'R0 持有 A、B、C、D 四块数据。分发后 R0 得到 A，R1 得到 B，R2 得到 C，R3 得到 D。',
    input: atRoot(pieces),
    output: distributedPieces,
    flow: 'out',
    root: true,
  },
  {
    id: 'gather',
    name: 'Gather',
    verb: '收集拼接',
    description:
      '四个 rank 分别提供 A、B、C、D，在 R0 按 rank 顺序拼接为四块数据。只在 R0 指定输出。',
    input: distributedPieces,
    output: atRoot(pieces),
    flow: 'in',
    root: true,
  },
  {
    id: 'reduce',
    name: 'Reduce',
    verb: '逐项相加',
    description:
      '四个 rank 的同形状数据 A、B、C、D 逐元素相加，R0 得到同形状的结果 Σ = A + B + C + D。只在 R0 指定输出。',
    input: distributedPieces,
    output: atRoot([sum(pieces)]),
    flow: 'sum',
    root: true,
  },
  {
    id: 'all-gather',
    name: 'All-gather',
    verb: '每处都拼接',
    description:
      '四个 rank 分别提供 A、B、C、D，每个 rank 都得到按 rank 顺序拼接的完整数据 A、B、C、D。',
    input: distributedPieces,
    output: replicate(pieces),
    flow: 'concat',
  },
  {
    id: 'reduce-scatter',
    name: 'Reduce-scatter',
    verb: '相加后分片',
    description:
      '各 rank 先按相同分片位置逐元素相加。Σᵢ = Aᵢ + Bᵢ + Cᵢ + Dᵢ。R0 只得到 Σ₀，R1 只得到 Σ₁，R2 只得到 Σ₂，R3 只得到 Σ₃。',
    input: vectors,
    output: reducedShards,
    flow: 'sum',
  },
  {
    id: 'all-reduce',
    name: 'All-reduce',
    verb: '每处都得总和',
    description: '各 rank 按相同分片位置逐元素相加，每个 rank 都得到完整结果 Σ₀、Σ₁、Σ₂、Σ₃。',
    input: vectors,
    output: reducedEverywhere,
    flow: 'sum',
  },
  {
    id: 'all-to-all',
    name: 'All-to-all',
    verb: '按列交换',
    description:
      '每个 rank 将第 i 个分片发给 Ri。Ri 按来源 rank 顺序收到 Aᵢ、Bᵢ、Cᵢ、Dᵢ。输入的每一列成为输出的一行，没有求和或复制。可用图下方的单选按钮高亮一个目标 rank。',
    input: vectors,
    output: columns,
    flow: 'exchange',
  },
];

const CELL = 25;
const PITCH = 28;
const ROW_WIDTH = 118;
const ROW_HEIGHT = 36;
const LEFT = 38;
const RIGHT = 264;
const rowY = (rank: number): number => 54 + rank * 46;
const blockLabel = ({ terms }: Block): string => {
  const first = terms[0]!;
  const name = terms.length > 1 ? 'Σ' : LETTERS[first.source];
  return `${name}${first.shard === undefined ? '' : SUBSCRIPTS[first.shard]}`;
};
const colorClass = ({ terms }: Block): string =>
  terms.length === 1 ? `infra-collective-source-${terms[0]!.source}` : 'infra-collective-combined';

function DataBlock({ item, x, y, column }: { item: Block; x: number; y: number; column: number }) {
  return (
    <g className={`infra-collective-block ${colorClass(item)}`} data-column={column}>
      <rect x={x} y={y} width={CELL} height="28" rx="4" className="infra-collective-tile" />
      {item.terms.map((term, index) => (
        <rect
          key={`${term.source}-${term.shard}`}
          x={x + 2 + (index * (CELL - 4)) / item.terms.length}
          y={y + 23}
          width={(CELL - 4) / item.terms.length}
          height="3"
          className={`infra-collective-stripe infra-collective-source-${term.source}`}
        />
      ))}
      <text x={x + CELL / 2} y={y + 14} className="infra-collective-value">
        {blockLabel(item)}
      </text>
    </g>
  );
}

function StateRows({
  state,
  x,
  side,
  labels = false,
  root = false,
}: {
  state: State;
  x: number;
  side: string;
  labels?: boolean;
  root?: boolean;
}) {
  return (
    <g className={`infra-collective-state infra-collective-${side}`}>
      {state.map((row, rank) => (
        <g key={rank} className="infra-collective-row" data-rank={rank}>
          {labels && (
            <text
              x={x - 9}
              y={rowY(rank)}
              className={`infra-collective-rank${root && rank === 0 ? ' infra-collective-root' : ''}`}
            >
              R{rank}
            </text>
          )}
          <rect
            x={x}
            y={rowY(rank) - ROW_HEIGHT / 2}
            width={ROW_WIDTH}
            height={ROW_HEIGHT}
            rx="6"
            className={row ? 'infra-collective-buffer' : 'infra-collective-empty'}
          />
          {row ? (
            row.map((item, column) => (
              <DataBlock
                key={column}
                item={item}
                x={x + 4 + column * PITCH}
                y={rowY(rank) - 14}
                column={column}
              />
            ))
          ) : (
            <text x={x + ROW_WIDTH / 2} y={rowY(rank)} className="infra-collective-absent">
              —
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

function FlowPath({
  fromX,
  fromY,
  toX,
  toY,
  marker,
  color = '',
  destination,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  marker?: string;
  color?: string;
  destination?: number;
}) {
  const bend = (toX - fromX) * 0.5;
  return (
    <path
      d={`M ${fromX} ${fromY} C ${fromX + bend} ${fromY}, ${toX - bend} ${toY}, ${toX} ${toY}`}
      className={`infra-collective-flow ${color}`}
      data-destination={destination}
      markerEnd={marker ? `url(#${marker})` : undefined}
    />
  );
}

function ArrowMarker({ id }: { id: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 8 8"
      refX="7"
      refY="4"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <path d="M 1 1 L 7 4 L 1 7" className="infra-collective-arrowhead" />
    </marker>
  );
}

function Flows({ operation, marker }: { operation: Operation; marker: string }) {
  const fromX = LEFT + ROW_WIDTH + 5;
  const toX = RIGHT - 6;
  const centerX = (fromX + toX) / 2;
  const centerY = (rowY(0) + rowY(3)) / 2;
  const { input, output, flow } = operation;

  if (flow === 'out' || flow === 'in') {
    return RANKS.map((rank) => (
      <FlowPath
        key={rank}
        fromX={fromX}
        fromY={rowY(flow === 'out' ? 0 : rank)}
        toX={toX}
        toY={rowY(flow === 'out' ? rank : 0)}
        marker={marker}
        color={colorClass(sum((flow === 'out' ? output[rank] : input[rank])!))}
      />
    ));
  }

  if (flow === 'exchange') {
    return RANKS.flatMap((destination) =>
      RANKS.map((source) => (
        <FlowPath
          key={`${source}-${destination}`}
          fromX={fromX}
          fromY={rowY(source)}
          toX={toX}
          toY={rowY(destination)}
          marker={marker}
          color={colorClass(input[source]![destination]!)}
          destination={destination}
        />
      )),
    );
  }

  return (
    <>
      {input.map(
        (row, rank) =>
          row && (
            <FlowPath
              key={`in-${rank}`}
              fromX={fromX}
              fromY={rowY(rank)}
              toX={centerX - 17}
              toY={centerY}
              color={colorClass(row[0]!)}
            />
          ),
      )}
      {output.map(
        (row, rank) =>
          row && (
            <FlowPath
              key={`out-${rank}`}
              fromX={centerX + 17}
              fromY={centerY}
              toX={toX}
              toY={rowY(rank)}
              marker={marker}
            />
          ),
      )}
      <rect
        x={centerX - 17}
        y={centerY - 17}
        width="34"
        height="34"
        rx={flow === 'sum' ? 17 : 6}
        className="infra-collective-operator"
      />
      {flow === 'sum' ? (
        <text x={centerX} y={centerY} className="infra-collective-plus">
          +
        </text>
      ) : (
        RANKS.map((rank) => (
          <rect
            key={rank}
            x={centerX - 12 + rank * 6.5}
            y={centerY - 7}
            width="5"
            height="14"
            rx="1"
            className={`infra-collective-stripe infra-collective-source-${rank}`}
          />
        ))
      )}
    </>
  );
}

function OperationPanel({ operation, index }: { operation: Operation; index: number }) {
  const id = `infra-collective-${operation.id}`;
  const marker = `${id}-arrow`;
  return (
    <div className="infra-collective-panel" data-operation={operation.id}>
      <div className="infra-collective-panel-heading" aria-hidden="true">
        <span className="infra-collective-number">{String(index + 1).padStart(2, '0')}</span>
        <span className="infra-collective-name">{operation.name}</span>
        <span className="infra-collective-verb">{operation.verb}</span>
      </div>
      <div className="infra-collective-scroll">
        <svg
          className="infra-collective-diagram"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 222"
          width="400"
          height="222"
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{`${operation.name}：${operation.verb}`}</title>
          <desc id={`${id}-desc`}>{operation.description}</desc>
          <defs>
            <ArrowMarker id={marker} />
          </defs>
          <text x={LEFT + ROW_WIDTH / 2} y="15" className="infra-collective-stage">
            输入
          </text>
          <text x={RIGHT + ROW_WIDTH / 2} y="15" className="infra-collective-stage">
            输出
          </text>
          <g className="infra-collective-flows">
            <Flows operation={operation} marker={marker} />
          </g>
          <StateRows state={operation.input} x={LEFT} side="input" labels root={operation.root} />
          <StateRows state={operation.output} x={RIGHT} side="output" />
        </svg>
      </div>
      {operation.flow === 'exchange' && (
        <div
          className="infra-collective-routing"
          role="group"
          aria-label="高亮 All-to-all 的目标 rank"
        >
          <span>追踪去向</span>
          {['all', ...RANKS].map((rank) => (
            <label key={rank}>
              <input
                type="radio"
                name="infra-collective-destination"
                value={rank}
                defaultChecked={rank === 'all'}
              />
              <span>{rank === 'all' ? '全部' : `R${rank}`}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function SumKey() {
  return (
    <svg
      className="infra-collective-sum-key"
      viewBox="0 0 218 34"
      width="218"
      height="34"
      role="img"
      aria-labelledby="infra-collective-sum-title infra-collective-sum-desc"
    >
      <title id="infra-collective-sum-title">逐元素求和的图例</title>
      <desc id="infra-collective-sum-desc">
        Σ₀ = A₀ + B₀ + C₀ + D₀，表示同一分片位置的逐元素求和。
      </desc>
      {RANKS.map((rank) => (
        <g key={rank}>
          <DataBlock item={block(rank, 0)} x={rank * 42} y={3} column={rank} />
          <text x={rank * 42 + 33} y="17" className="infra-collective-key-sign">
            {rank === 3 ? '=' : '+'}
          </text>
        </g>
      ))}
      <DataBlock item={totals[0]!} x={170} y={3} column={0} />
    </svg>
  );
}

function AllReduceDecomposition() {
  const id = 'infra-collective-decomposition';
  return (
    <div className="infra-collective-decomposition">
      <div className="infra-collective-decomposition-heading">
        All-reduce = Reduce-scatter + All-gather
      </div>
      <div className="infra-collective-scroll-hint" aria-hidden="true">
        横向滑动查看完整分解 →
      </div>
      <div
        className="infra-collective-scroll"
        tabIndex={0}
        role="region"
        aria-label="All-reduce 的两步分解图，可横向滚动"
      >
        <svg
          className="infra-collective-decomposition-diagram"
          viewBox="0 0 728 222"
          width="728"
          height="222"
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>All-reduce 的两步分解</title>
          <desc id={`${id}-desc`}>
            左侧每个 rank 有四个输入分片。Reduce-scatter 后，中间的每个 rank 持有一个求和分片
            Σᵢ。再经 All-gather，右侧每个 rank 都持有完整结果 Σ₀、Σ₁、Σ₂、Σ₃，与 All-reduce
            的输出相同。这是结果等价的分解，不限定实际通信算法。
          </desc>
          <defs>
            <ArrowMarker id={`${id}-arrow`} />
          </defs>
          <text x="99" y="15" className="infra-collective-stage">
            输入
          </text>
          <text x="355" y="15" className="infra-collective-stage">
            每处一片
          </text>
          <text x="611" y="15" className="infra-collective-stage">
            每处一整份
          </text>
          <StateRows state={vectors} x={40} side="original" labels />
          <StateRows state={reducedShards} x={296} side="sharded" labels />
          <StateRows state={reducedEverywhere} x={552} side="replicated" labels />
          {[0, 1].map((step) => (
            <g key={step}>
              <text x={214 + step * 256} y="96" className="infra-collective-step-name">
                {step === 0 ? 'Reduce-scatter' : 'All-gather'}
              </text>
              <FlowPath
                fromX={177 + step * 256}
                fromY={122}
                toX={252 + step * 256}
                toY={122}
                marker={`${id}-arrow`}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function CollectiveOperationsDiagram() {
  return (
    <figure className="infra-collective-shell">
      <div className="infra-collective-key">
        <span>每行一张 GPU · root = R0</span>
        <span>颜色跟随数据块，下标表示分片</span>
        <SumKey />
      </div>
      <div className="infra-collective-grid">
        {OPERATIONS.map((operation, index) => (
          <OperationPanel key={operation.id} operation={operation} index={index} />
        ))}
      </div>
      <AllReduceDecomposition />
      <figcaption>
        更详细的代码可以看{' '}
        <a href="https://cs336.stanford.edu/lectures/?trace=lecture_07">CS336 · Lecture 7</a>
        。归约以 SUM 为例；箭头表示数据关系。虚线框表示无指定输入或输出，并不表示清空原数据。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { CollectiveOperationsDiagram };
