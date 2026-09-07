interface Point {
  x: number;
  y: number;
}

interface PricePoint {
  time: number;
  price: number;
  labelDy: number;
}

const tones = ['neutral', 'ink', 'blue', 'teal', 'rose'] as const;
type Tone = (typeof tones)[number];

const greedyPoints = {
  x1: { time: 0, price: 3, labelDy: 27 },
  x2: { time: 1, price: 7, labelDy: -17 },
  x3: { time: 2, price: 1.5, labelDy: 27 },
  x4: { time: 3, price: 5.8, labelDy: -17 },
  x5: { time: 5, price: 6.4, labelDy: -17 },
} satisfies Record<string, PricePoint>;

const intervalPoints = {
  l1: { time: 0, price: 1, labelDy: 27 },
  r1: { time: 1, price: 4.8, labelDy: -17 },
  l2: { time: 2, price: 2.4, labelDy: 27 },
  r2: { time: 3, price: 6.4, labelDy: -17 },
} satisfies Record<string, PricePoint>;

// Both decompositions share the same prices and positions. Only the pairing changes.
const intervalPairs = {
  original: [
    { from: 'l1', to: 'r1', tone: 'blue', dashed: false },
    { from: 'l2', to: 'r2', tone: 'teal', dashed: false },
  ],
  exchanged: [
    { from: 'l1', to: 'r2', tone: 'blue', dashed: false },
    { from: 'l2', to: 'r1', tone: 'teal', dashed: true },
  ],
} as const;

const projectGreedy = ({ time, price }: PricePoint): Point => ({
  x: 84 + time * 96,
  y: 286 - price * 30,
});

const projectInterval = ({ time, price }: PricePoint): Point => ({
  x: 36 + time * 86,
  y: 248 - price * 26,
});

function Arrowheads({ id }: { id: string }) {
  return (
    <defs>
      {tones.map(tone => (
        <marker
          key={tone}
          id={`${id}-${tone}-arrow`}
          className={`cf391f3-${tone}`}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="8"
          markerHeight="8"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 L 2 4 Z" className="cf391f3-arrowhead" />
        </marker>
      ))}
    </defs>
  );
}

function Arrow({
  from,
  to,
  tone,
  id,
  dashed = false,
  halo = false,
}: {
  from: Point;
  to: Point;
  tone: Tone;
  id: string;
  dashed?: boolean;
  halo?: boolean;
}) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const dx = (to.x - from.x) / length;
  const dy = (to.y - from.y) / length;
  // Leave a small gap around each point so the arrowhead remains visible.
  const line = {
    x1: from.x + dx * 6,
    y1: from.y + dy * 6,
    x2: to.x - dx * 9,
    y2: to.y - dy * 9,
  };

  return (
    <g className={`cf391f3-${tone}`}>
      {halo && <line {...line} className="cf391f3-halo" />}
      <line
        {...line}
        className={`cf391f3-edge${dashed ? ' cf391f3-dashed' : ''}`}
        markerEnd={`url(#${id}-${tone}-arrow)`}
      />
    </g>
  );
}

function Points({
  points,
  project,
}: {
  points: Record<string, PricePoint>;
  project: (point: PricePoint) => Point;
}) {
  return Object.entries(points).map(([label, sample]) => {
    const point = project(sample);
    return (
      <g key={label}>
        <circle cx={point.x} cy={point.y} r="4" className="cf391f3-point" />
        <text x={point.x} y={point.y + sample.labelDy} className="cf391f3-point-label">
          <tspan fontStyle="italic">{label[0]}</tspan>
          <tspan dy="5" fontSize="70%">{label.slice(1)}</tspan>
        </text>
      </g>
    );
  });
}

function GreedyExchangeDiagram() {
  const id = 'cf391f3-greedy';
  const point = (name: keyof typeof greedyPoints): Point => projectGreedy(greedyPoints[name]);

  return (
    <figure className="cf391f3-figure cf391f3-greedy-figure">
      <div
        className="cf391f3-scroll"
        role="region"
        aria-label="更低买入价的替换示意图，可横向滚动"
        tabIndex={0}
      >
        <svg
          className="cf391f3-greedy-diagram"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 680 324"
          width="680"
          height="324"
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>用更低的买入价 x₃ 与新卖出价 x₅ 匹配</title>
          <desc id={`${id}-desc`}>
            横轴表示时间，纵轴表示价格。灰色点线表示原区间 x₁ 到 x₂、x₃ 到 x₄。
            x₃ 的价格低于 x₁。玫瑰色虚线表示尝试将 x₁ 与 x₅ 配对，
            加粗的蓝色实线表示改用 x₃ 与 x₅ 配对；后者收益更高，且能单独保留原区间 x₁ 到 x₂。
          </desc>
          <Arrowheads id={id} />
          <path
            d="M 42 286 H 652"
            className="cf391f3-axis"
            markerEnd={`url(#${id}-neutral-arrow)`}
          />
          <path
            d="M 42 286 V 39"
            className="cf391f3-axis"
            markerEnd={`url(#${id}-neutral-arrow)`}
          />
          <text x="42" y="23" className="cf391f3-axis-label">价格</text>
          <text x="637" y="311" className="cf391f3-axis-label">时间</text>
          <Arrow from={point('x1')} to={point('x2')} tone="ink" id={id} />
          <Arrow from={point('x3')} to={point('x4')} tone="ink" id={id} />
          <Arrow from={point('x1')} to={point('x5')} tone="rose" id={id} dashed halo />
          <Arrow from={point('x3')} to={point('x5')} tone="blue" id={id} />
          <Points points={greedyPoints} project={projectGreedy} />
        </svg>
      </div>
      <div className="cf391f3-legend" aria-hidden="true">
        <span><i className="cf391f3-key cf391f3-ink cf391f3-key-dotted" />原区间</span>
        <span><i className="cf391f3-key cf391f3-rose cf391f3-key-dashed" />{'尝试 \\(x_1\\to x_5\\)'}</span>
        <span><i className="cf391f3-key cf391f3-blue" />{'改用 \\(x_3\\to x_5\\)'}</span>
      </div>
      <figcaption>
        {'\\(x_3<x_1\\)，所以 \\(x_5-x_3>x_5-x_1\\)；\\([x_1,x_2]\\) 可单独保留。'}
        <span className="cf391f3-scroll-hint">（左右滑动查看完整图示）</span>
      </figcaption>
    </figure>
  );
}

function IntervalPanel({ variant }: { variant: keyof typeof intervalPairs }) {
  const id = `cf391f3-${variant}`;
  const title = variant === 'original' ? '原区间' : '交换端点';

  return (
    <div className="cf391f3-panel">
      <svg
        className="cf391f3-interval-diagram"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 332 276"
        width="332"
        height="276"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>{`${title}的配对关系`}</title>
        <desc id={`${id}-desc`}>
          {variant === 'original'
            ? '点从左至右按时间排列，纵向位置表示价格，满足 l₁ < l₂ < r₁ < r₂。蓝色实线连接 l₁ 与 r₁，青色实线连接 l₂ 与 r₂。'
            : '所有点的位置与原图相同。蓝色实线连接 l₁ 与 r₂，可以继续合并；青色虚线连接 l₂ 与 r₁，表示单独存入 b 的收益 r₁ − l₂。'}
        </desc>
        <Arrowheads id={id} />
        <text x="166" y="30" className="cf391f3-panel-title">{title}</text>
        {intervalPairs[variant].map(({ from, to, tone, dashed }) => (
          <Arrow
            key={`${from}-${to}`}
            from={projectInterval(intervalPoints[from])}
            to={projectInterval(intervalPoints[to])}
            tone={tone}
            id={id}
            dashed={dashed}
            halo={dashed}
          />
        ))}
        <Points points={intervalPoints} project={projectInterval} />
      </svg>
      <div className="cf391f3-profit">
        {variant === 'original'
          ? '\\((r_1-l_1)+(r_2-l_2)\\)'
          : '\\((r_2-l_1)+(r_1-l_2)\\)'}
      </div>
    </div>
  );
}

function IntervalEquivalenceDiagram() {
  return (
    <figure className="cf391f3-figure">
      <div className="cf391f3-equivalence">
        <IntervalPanel variant="original" />
        <span className="cf391f3-equals" aria-hidden="true">=</span>
        <IntervalPanel variant="exchanged" />
      </div>
      <div className="cf391f3-legend" aria-hidden="true">
        <span><i className="cf391f3-key cf391f3-blue" />合并后可继续匹配</span>
        <span><i className="cf391f3-key cf391f3-teal cf391f3-key-dashed" />{'独立的收益存入 \\(b\\)'}</span>
      </div>
      <figcaption>
        {'交换端点不改变总收益；虚线 \\([l_2,r_1]\\) 表示单独计入 \\(b\\) 的收益 \\(r_1-l_2\\)。'}
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { GreedyExchangeDiagram, IntervalEquivalenceDiagram };
