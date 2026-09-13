import { Box, Edge, Figure, MathLabel } from './diffusion-elements';

const examples = [1, 2, 3].map((count, i) => ({ count, i, reward: count === 2 ? 1 : 0 }));
const rewardMean = examples.reduce((sum, row) => sum + row.reward, 0) / examples.length;
const rewardSd = Math.sqrt(
  examples.reduce((sum, row) => sum + (row.reward - rewardMean) ** 2, 0) / examples.length,
);

function Scene({ x, y, count }: { x: number; y: number; count: number }) {
  return (
    <g>
      <rect x={x} y={y} width="116" height="65" rx="4" className="dfr-frame" />
      <g className="dfr-blue">
        {Array.from({ length: count }, (_, j) => (
          <circle
            key={j}
            cx={x + 24 + (j % 2) * 25}
            cy={y + (count > 2 ? 21 + Math.floor(j / 2) * 23 : 32)}
            r="9"
            className="dfr-bar"
          />
        ))}
      </g>
      <g className="dfr-clay">
        <rect x={x + 80} y={y + 21} width="23" height="23" className="dfr-bar" />
      </g>
    </g>
  );
}

export function DiffusionRlGroup() {
  const id = 'rl-diffusion-group';
  const advantages = examples.map((row) => (row.reward - rewardMean) / rewardSd);
  return (
    <Figure
      id={id}
      height={478}
      title="同一个 prompt 的三个生成结果，如何产生 group-relative advantage"
      description={`构造示例：prompt 为两个圆在方块左侧。三个独立 rollout 分别画出一个、两个、三个圆，简单规则只检查数量和左右关系，reward 为 ${examples.map((row) => row.reward).join('、')}。组均值 ${rewardMean.toFixed(3)}，population standard deviation ${rewardSd.toFixed(3)}；忽略稳定用 epsilon，advantage 为 ${advantages.map((a) => a.toFixed(3)).join('、')}。每条 trajectory 的所有 transitions 共享其终点 advantage，但各自计算逐步 probability ratio。场景与 reward 为教学构造，不是真实模型输出。`}
      caption="图形与 reward 为教学构造。中间结果在同组中更好，因此它的采样步骤获得正 advantage；另外两个结果获得负 advantage。比较发生在同一个 prompt 内。"
    >
      <Box
        x={112}
        y={12}
        width={436}
        height={48}
        label="同一个 prompt：两个圆，在方块左侧"
        tone="teal"
      />
      <text x={162} y={93} className="dfr-label">
        保存每一步的 latent transition
      </text>
      <text x={390} y={93} className="dfr-label">
        最终输出
      </text>
      <text x={518} y={93} className="dfr-label">
        Reward
      </text>
      <text x={607} y={93} className="dfr-label">
        Advantage
      </text>
      {examples.map((row) => {
        const y = 125 + row.i * 93;
        return (
          <g key={row.count}>
            {Array.from({ length: 4 }, (_, k) => (
              <g key={k}>
                <g className="dfr-blue">
                  <rect
                    x={24 + k * 74}
                    y={y + 7}
                    width="51"
                    height="51"
                    rx="4"
                    className="dfr-box"
                  />
                </g>
                <MathLabel
                  x={22 + k * 74}
                  y={y + 14}
                  width={55}
                  height={35}
                  tex={`x_${k}^{(${row.i + 1})}`}
                />
                {k < 3 && <Edge id={id} d={`M ${75 + k * 74} ${y + 32} H ${98 + k * 74}`} />}
              </g>
            ))}
            <Edge id={id} d={`M 297 ${y + 32} H 332`} />
            <Scene x={332} y={y} count={row.count} />
            <MathLabel x={486} y={y + 14} width={65} tex={`${row.reward}`} />
            <MathLabel
              x={560}
              y={y + 14}
              width={90}
              tex={`${advantages[row.i] > 0 ? '+' : ''}${advantages[row.i].toFixed(3)}`}
            />
            <path d={`M 461 ${y + 14} V ${y + 51}`} className="dfr-axis" />
          </g>
        );
      })}
      <MathLabel
        x={38}
        y={407}
        width={270}
        tex={String.raw`\bar r=\tfrac13,\quad\sigma_r=\tfrac{\sqrt2}{3}`}
      />
      <MathLabel
        x={345}
        y={402}
        width={275}
        height={49}
        tex={String.raw`\hat A_i=\frac{r_i-\bar r}{\sigma_r}`}
      />
      <text x={330} y={467} className="dfr-note">
        每行共享终点 advantage；每条边分别计算 ratio
      </text>
    </Figure>
  );
}

export function DiffusionRlReplay() {
  const id = 'rl-diffusion-replay';
  const oldMean = 0;
  const newMean = 0.4;
  const sigma = 0.6;
  const action = 0.8;
  const density = (x: number, mean: number) =>
    Math.exp(-((x - mean) ** 2) / (2 * sigma ** 2)) / (Math.sqrt(2 * Math.PI) * sigma);
  const ratio = density(action, newMean) / density(action, oldMean);
  const xMap = (x: number) => 329 + ((x + 1.8) / 4) * 287;
  const yMap = (value: number) => 257 - value * 202;
  return (
    <Figure
      id={id}
      height={478}
      title="更新时重新评估同一个 action，不重新生成 trajectory"
      description={`一维 Gaussian transition 示例。保存 state s_k 与旧 policy 采样的 action a_k=${action}。Old policy 的 mean 为 ${oldMean}，current policy 的 mean 为 ${newMean}，二者 standard deviation 都是 ${sigma}。在同一 action 处，density ratio 为 ${ratio.toFixed(3)}。当 advantage=1、clip epsilon=0.2 时，clipped surrogate 为 1.2。曲线只是 latent transition 的一维示例，真实 policy density 定义在整个 latent tensor 上。计算梯度时 action、old log density 与 advantage 固定，当前 mean 来自可训练网络。`}
      caption="参数更新后，同一个已保存 action 在新旧 policy 下具有不同 density。图示是一维 Gaussian；真实训练需明确整个 latent tensor 的 log density 是求和，还是采用了另一个缩放 surrogate。"
    >
      <text x={132} y={28} className="dfr-label">
        Rollout 时保存
      </text>
      <text x={480} y={28} className="dfr-label">
        更新时：读取同一个 state 与 action
      </text>
      <Box
        x={25}
        y={53}
        width={213}
        height={60}
        label="固定的 state"
        tex={String.raw`s_k=(c,t_k,x_k)`}
        tone="teal"
      />
      <Box
        x={25}
        y={137}
        width={213}
        height={60}
        label="已采样的 action"
        tex={`a_k=${action}`}
        tone="teal"
      />
      <Box
        x={25}
        y={222}
        width={213}
        height={60}
        label="固定的 old log density"
        tex={String.raw`\ell_{\mathrm{old}}=\log\pi_{\mathrm{old}}(a_k\mid s_k)`}
        tone="teal"
      />
      <Edge id={id} d="M 238 83 H 280 V 117 H 321" />
      <g className="dfr-blue">
        <path d="M 342 63 H 369" className="dfr-curve dfr-dashed" strokeDasharray="5 3" />
        <MathLabel
          x={371}
          y={45}
          width={235}
          tex={String.raw`\pi_{\mathrm{old}}:\ \mu=0,\ \nu=0.6`}
        />
      </g>
      <g className="dfr-clay">
        <path d="M 342 94 H 369" className="dfr-curve" />
        <MathLabel x={371} y={76} width={235} tex={String.raw`\pi_\theta:\ \mu=0.4,\ \nu=0.6`} />
      </g>
      <path d="M 329 116 V 257 H 616" className="dfr-axis" />
      {[oldMean, newMean].map((mean, i) => (
        <g className={`dfr-${i ? 'clay' : 'blue'}`} key={mean}>
          <path
            d={Array.from({ length: 121 }, (_, j) => {
              const x = -1.8 + (4 * j) / 120;
              return `${j ? 'L' : 'M'} ${xMap(x).toFixed(2)} ${yMap(density(x, mean)).toFixed(2)}`;
            }).join(' ')}
            className="dfr-curve"
            strokeDasharray={i ? undefined : '5 3'}
          />
          <circle cx={xMap(action)} cy={yMap(density(action, mean))} r="4" className="dfr-point" />
        </g>
      ))}
      <path d={`M ${xMap(action)} 122 V 260`} className="dfr-edge dfr-dashed" />
      <MathLabel x={xMap(action) - 62} y={261} width={124} tex={`a_k=${action}`} />
      <MathLabel
        x={285}
        y={305}
        width={350}
        height={54}
        tex={String.raw`\rho=\exp(\ell_\theta-\ell_{\mathrm{old}})\approx ${ratio.toFixed(2)}`}
      />
      <Edge id={id} d="M 131 282 V 332 H 281" dashed />
      <MathLabel
        x={34}
        y={378}
        width={593}
        height={43}
        tex={String.raw`\hat A=1,\ \epsilon=0.2:\qquad \min(\rho\hat A,\operatorname{clip}(\rho,0.8,1.2)\hat A)=1.2`}
      />
      <text x={330} y={449} className="dfr-note">
        这个正 advantage 样本已超过上侧 clip threshold
      </text>
      <text x={330} y={469} className="dfr-note">
        固定数据；梯度只通过当前 policy 的 density 计算
      </text>
    </Figure>
  );
}

export const POST_COMPONENTS = { DiffusionRlGroup, DiffusionRlReplay };
