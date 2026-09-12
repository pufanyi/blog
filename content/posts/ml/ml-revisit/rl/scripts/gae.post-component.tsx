const HORIZONS = [1, 2, 3] as const;
const GRID_LEFT = 108;
const STEP_WIDTH = 108;
const GRID_RIGHT = 606;

function MathLabel({ x, y, width, tex }: { x: number; y: number; width: number; tex: string }) {
  return (
    <foreignObject x={x} y={y} width={width} height={46}>
      <div className="rl-gae-math">{'\\(' + tex + '\\)'}</div>
    </foreignObject>
  );
}

function rewardTerm(offset: number): string {
  if (offset === 0) return 'r_t';
  const discount = offset === 1 ? '\\gamma' : '\\gamma^{' + offset + '}';
  return discount + ' r_{t+' + offset + '}';
}

function GaeHorizonDiagram() {
  return (
    <figure className="rl-gae-figure">
      <div
        className="rl-gae-scroll"
        tabIndex={0}
        role="region"
        aria-label="不同步数的 advantage 估计；窄屏可横向滚动"
      >
        <svg
          className="rl-gae-diagram"
          width="704"
          height="298"
          viewBox="0 0 704 298"
          role="img"
          aria-labelledby="rl-gae-title rl-gae-description"
        >
          <title id="rl-gae-title">从一步到多步：逐渐推迟 bootstrap 的位置</title>
          <desc id="rl-gae-description">
            三行分别展示一步、两步和三步 advantage 估计。实线框表示实际观察到的折扣
            reward，虚线框表示由 critic 预测的剩余收益；每一行最后都减去当前状态的
            value。向下看时，实际 reward 覆盖的时间变长，交给 critic 接手的位置变晚。
          </desc>
          <rect x="110" y="14" width="24" height="18" rx="3" className="rl-gae-reward" />
          <text x="145" y="28" className="rl-gae-note">
            已观察到的 reward
          </text>
          <rect x="358" y="14" width="24" height="18" rx="3" className="rl-gae-bootstrap" />
          <text x="393" y="28" className="rl-gae-note">
            critic 预测剩余收益
          </text>
          {HORIZONS.map((horizon, row) => {
            const y = 60 + row * 78;
            const bootstrapX = GRID_LEFT + horizon * STEP_WIDTH;
            return (
              <g key={horizon}>
                <MathLabel
                  x={2}
                  y={y}
                  width={100}
                  tex={'\\hat{\\mathcal A}_t^{(' + horizon + ')}='}
                />
                {Array.from({ length: horizon }, (_, offset) => {
                  const x = GRID_LEFT + offset * STEP_WIDTH;
                  return (
                    <g key={offset}>
                      <rect x={x} y={y} width={88} height={46} rx={5} className="rl-gae-reward" />
                      <MathLabel x={x} y={y} width={88} tex={rewardTerm(offset)} />
                      <MathLabel x={x + 88} y={y} width={20} tex="+" />
                    </g>
                  );
                })}
                <rect
                  x={bootstrapX}
                  y={y}
                  width={GRID_RIGHT - bootstrapX}
                  height={46}
                  rx={5}
                  className="rl-gae-bootstrap"
                />
                <MathLabel
                  x={bootstrapX}
                  y={y}
                  width={GRID_RIGHT - bootstrapX}
                  tex={'\\gamma^{' + horizon + '}v_{t+' + horizon + '}'}
                />
                <MathLabel x={GRID_RIGHT + 5} y={y} width={85} tex="-v_t" />
              </g>
            );
          })}
          <text x="352" y="285" textAnchor="middle" className="rl-gae-note">
            向下：用更多实际 reward 替换对未来的预测
          </text>
        </svg>
      </div>
      <figcaption>
        每行都是“已观察的收益 + 预测的剩余收益 − 当前状态的 baseline”。GAE
        接下来会把这些不同长度的估计加权平均。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { GaeHorizonDiagram };
