const TRAINER_A = 0.8;
const SAMPLER_A = 0.6;
const ACTIONS = [
  { p: TRAINER_A, q: SAMPLER_A, reward: 1, score: 1 - TRAINER_A },
  { p: 1 - TRAINER_A, q: 1 - SAMPLER_A, reward: 0, score: -TRAINER_A },
];
const MEAN_SCORE = ACTIONS.reduce((sum, action) => sum + action.q * action.score, 0);
const OFFSETS = [0, 0.25, 0.5, 0.75, 1];
const METHODS = [
  { name: 'On-policy', className: 'rl-sc-target', legendX: 112, kind: 'target' },
  { name: 'Score Centering', className: 'rl-sc-centered', legendX: 270, kind: 'centered' },
  { name: 'Naive off-policy', className: 'rl-sc-naive', legendX: 486, kind: 'naive' },
] as const;

function update(offset: number, kind: (typeof METHODS)[number]['kind']): number {
  return ACTIONS.reduce((sum, action) => {
    const probability = kind === 'target' ? action.p : action.q;
    const score = action.score - (kind === 'centered' ? MEAN_SCORE : 0);
    return sum + probability * (action.reward + offset) * score;
  }, 0);
}

function x(offset: number): number {
  return 88 + offset * 484;
}

function y(gradient: number): number {
  return 258 - ((gradient + 0.12) / 0.44) * 190;
}

function number(value: number): string {
  return value.toFixed(2).replace('-', '−');
}

function ScoreShiftDiagram() {
  return (
    <figure className="rl-sc-figure">
      <div
        className="rl-sc-scroll"
        role="region"
        tabIndex={0}
        aria-label="奖励平移对期望更新的影响；窄屏可横向滚动"
      >
        <svg
          className="rl-sc-diagram"
          width="688"
          height="326"
          viewBox="0 0 688 326"
          role="img"
          aria-labelledby="rl-sc-title rl-sc-desc"
        >
          <title id="rl-sc-title">
            给所有 reward 加同一个常数，naive off-policy 更新会改变方向
          </title>
          <desc id="rl-sc-desc">
            {`横轴是加到两个 action 上的共同 reward，从 0 到 1；纵轴是期望 ascent update。
            On-policy 始终为 ${number(update(0, 'target'))}，Score Centering 始终为
            ${number(update(0, 'centered'))}，naive off-policy 从
            ${number(update(0, 'naive'))} 降到 ${number(update(1, 'naive'))}，越过零线。
            Score Centering 恢复了平移不变性，但仍与 on-policy 更新有差距。`}
          </desc>
          {METHODS.map((method) => (
            <g key={method.kind}>
              <line
                x1={method.legendX - 38}
                x2={method.legendX - 9}
                y1={28}
                y2={28}
                className={method.className}
              />
              <text x={method.legendX} y={33} className="rl-sc-label">
                {method.name}
              </text>
            </g>
          ))}
          {[-0.1, 0, 0.1, 0.2, 0.3].map((tick) => (
            <g key={tick}>
              <line
                x1={x(0)}
                x2={x(1)}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? 'rl-sc-zero' : 'rl-sc-grid'}
              />
              <text x={74} y={y(tick) + 5} textAnchor="end" className="rl-sc-tick">
                {number(tick)}
              </text>
            </g>
          ))}
          <path d={`M ${x(0)} 62 V 258 H ${x(1)}`} className="rl-sc-axis" />
          {OFFSETS.map((offset) => (
            <g key={offset}>
              <line x1={x(offset)} x2={x(offset)} y1={258} y2={264} className="rl-sc-axis" />
              <text x={x(offset)} y={284} textAnchor="middle" className="rl-sc-tick">
                {number(offset)}
              </text>
            </g>
          ))}
          {METHODS.map((method) => (
            <g key={method.kind}>
              <polyline
                points={OFFSETS.map(
                  (offset) => `${x(offset)},${y(update(offset, method.kind))}`,
                ).join(' ')}
                className={method.className}
              />
              {[0, 1].map((offset) => (
                <circle
                  key={offset}
                  cx={x(offset)}
                  cy={y(update(offset, method.kind))}
                  r={4}
                  className={`rl-sc-point ${method.className}`}
                />
              ))}
              <text x={590} y={y(update(1, method.kind)) + 5} className="rl-sc-label">
                {number(update(1, method.kind))}
              </text>
            </g>
          ))}
          <text x={330} y={314} textAnchor="middle" className="rl-sc-label">
            Added reward
          </text>
          <text
            x={20}
            y={164}
            textAnchor="middle"
            transform="rotate(-90 20 164)"
            className="rl-sc-label"
          >
            Expected ascent update
          </text>
        </svg>
      </div>
      <figcaption>
        {String.raw`两个 action 的解析例子，非模型实验：\(p(A)=${TRAINER_A}\)、\(q(A)=${SAMPLER_A}\)，初始 rewards 为 \((1,0)\)。`}{' '}
        给两者同时加上从 0 到 1 的常数，naive update 从 {number(update(0, 'naive'))} 变成{' '}
        {number(update(1, 'naive'))}；SC 始终为 {number(update(0, 'centered'))}，on-policy 始终为{' '}
        {number(update(0, 'target'))}。SC 消除了对 reward 平移的依赖，但保留了与理想更新的差距。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { ScoreShiftDiagram };
