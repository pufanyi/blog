import { Box, Edge, Figure, MathLabel, Tile } from './elements';

export function DiffusionProbabilityPath() {
  const id = 'diffusion-probability-path';
  const times = [0, 0.25, 0.5, 0.75, 1];
  return (
    <Figure
      id={id}
      height={298}
      title="同一张图片与同一份 noise 的线性插值"
      description="固定一个 20×20 的房屋图案和一份独立 Gaussian noise，按 x_t = t z + (1-t) epsilon 显示 t=0、0.25、0.5、0.75、1 的结果。Data coefficient 依次是 0、0.25、0.5、0.75、1，noise coefficient 相反。这是已知端点的训练插值，不是网络生成结果。显示时统一截断到 [-2,2] 再映射为明暗。"
      caption="已知端点的训练插值：每一格都由同一对图片与 noise 计算。展示的是数值混合，不是模糊滤镜，也不是模型的生成轨迹。"
    >
      <MathLabel x={130} y={8} width={400} tex={String.raw`x_t=t z+(1-t)\epsilon`} />
      {times.map((t, i) => {
        const left = 110 + i * 109;
        return (
          <g key={t}>
            <Tile x={left} y={66} size={88} t={t} />
            <MathLabel x={left - 4} y={157} width={96} tex={`t=${t}`} />
            <MathLabel x={left - 4} y={219} width={96} tex={`${t}`} />
            <MathLabel x={left - 4} y={254} width={96} tex={`${1 - t}`} />
            {i < times.length - 1 && <Edge id={id} d={`M ${left + 92} 110 H ${left + 104}`} />}
          </g>
        );
      })}
      <text x={154} y={54} className="df-note">
        Gaussian noise
      </text>
      <text x={590} y={54} className="df-note">
        已知的 data
      </text>
      <MathLabel x={10} y={219} width={75} tex={String.raw`\alpha_t`} />
      <MathLabel x={10} y={254} width={75} tex={String.raw`\beta_t`} />
      <text x={330} y={207} className="df-note">
        线性 schedule 的两种系数
      </text>
    </Figure>
  );
}

export function DiffusionTrainingSampling() {
  const id = 'diffusion-training-sampling';
  return (
    <Figure
      id={id}
      height={472}
      title="训练构造一个时间点，生成依次走过多个时间点"
      description="训练：独立采样 data z、noise epsilon 和时间 t。z 与 epsilon 一路用于构造 x_t，一路计算固定 target z-epsilon；网络只接收 x_t 和 t，预测 velocity，MSE 的梯度更新网络。生成：初始 Gaussian noise 经过同一个 velocity network 和 Euler sampler 反复更新，当前输出成为下一次输入。训练不需要展开采样链。"
      caption="训练中的 target 可以直接算出来；生成中的下一个状态必须依赖网络。虚线表示用于监督的已知 target，所有采样步骤共享同一个网络。"
    >
      <text x={330} y={27} className="df-label">
        训练：随机取一个时间点
      </text>
      <Box
        x={25}
        y={59}
        width={130}
        height={60}
        label="独立采样"
        tex={String.raw`z,\epsilon,t`}
        tone="teal"
      />
      <Box
        x={195}
        y={59}
        width={156}
        height={60}
        label="构造 noisy input"
        tex={String.raw`x_t=tz+(1-t)\epsilon`}
        tone="teal"
      />
      <Box
        x={402}
        y={59}
        width={228}
        height={60}
        label="Velocity network"
        tex={String.raw`u_t^\theta(x_t)`}
      />
      <Edge id={id} d="M 155 89 H 195" />
      <Edge id={id} d="M 351 89 H 402" />
      <Box
        x={195}
        y={157}
        width={156}
        height={60}
        label="已知 target"
        tex={String.raw`z-\epsilon`}
        tone="clay"
      />
      <Box
        x={431}
        y={157}
        width={172}
        height={60}
        label="MSE"
        tex={String.raw`\|u_t^\theta-(z-\epsilon)\|^2`}
        tone="clay"
      />
      <Edge id={id} d="M 90 119 V 187 H 195" dashed />
      <Edge id={id} d="M 351 187 H 431" dashed />
      <Edge id={id} d="M 516 119 V 157" />
      <text x={516} y={242} className="df-note">
        梯度更新 velocity network
      </text>
      <path d="M 25 269 H 635" className="df-axis" />
      <text x={330} y={296} className="df-label">
        生成：当前状态 → 下一状态 → 再预测
      </text>
      <Box x={25} y={327} width={90} label="初始 noise" />
      <Box
        x={166}
        y={320}
        width={128}
        height={69}
        label="同一个网络"
        tex={String.raw`u_t^\theta(x_t)`}
      />
      <Box
        x={346}
        y={320}
        width={174}
        height={69}
        label="Euler sampler"
        tex={String.raw`x_{t+h}=x_t+h u_t^\theta`}
        tone="teal"
      />
      <Box x={565} y={327} width={70} label="输出" tone="teal" />
      <Edge id={id} d="M 115 354 H 166" />
      <Edge id={id} d="M 294 354 H 346" />
      <Edge id={id} d="M 520 354 H 565" />
      <Edge id={id} d="M 480 389 V 426 H 230 V 389" />
      <text x={355} y={450} className="df-note">
        推进时间，将新状态送回网络
      </text>
    </Figure>
  );
}

export function DiffusionLatentPipeline() {
  const id = 'diffusion-latent-pipeline';
  return (
    <Figure
      id={id}
      height={457}
      title="图像、latent 与生成网络各在什么位置"
      description="训练生成 backbone 时，真实图片经过固定 encoder 得到 clean latent z，再与 Gaussian noise 混合成 x_t；时间 t 和 text encoder 提供的条件共同输入可训练的 U-Net 或 DiT，以 velocity prediction 为例，输出 velocity 并与已知 target z-epsilon 计算 loss。推理时不需要真实图片和 encoder，从 latent noise 开始迭代调用 backbone 与 sampler，最后经过固定 decoder 得到图片。"
      caption="上方是训练时 clean latent 的来源，下方是生成流程。加噪与多步采样发生在 latent space，decoder 只负责把最终 latent 还原为图片。图示采用 velocity prediction，以及固定 autoencoder 与 text encoder 的常见设置。"
    >
      <text x={330} y={25} className="df-label">
        训练 backbone：从图片构造带噪 latent
      </text>
      <Box x={20} y={51} width={87} label="真实图片" tone="teal" />
      <Box x={139} y={51} width={110} label="Encoder" tone="teal" />
      <Box x={281} y={51} width={90} label="Clean latent" tex="z" height={65} tone="teal" />
      <Box x={414} y={51} width={92} label="加噪" tex="x_t" height={65} tone="teal" />
      <Box
        x={546}
        y={51}
        width={92}
        label="MSE target"
        tex={String.raw`z-\epsilon`}
        height={65}
        tone="clay"
      />
      <Edge id={id} d="M 107 78 H 139" />
      <Edge id={id} d="M 249 78 H 281" />
      <Edge id={id} d="M 371 78 H 414" />
      <text x={192} y={134} className="df-note">
        固定参数
      </text>
      <MathLabel x={315} y={125} width={80} tex={String.raw`\epsilon,t`} />
      <Edge id={id} d="M 395 143 H 405 V 103 H 414" />
      <Edge id={id} d="M 592 116 V 195 H 481" dashed />
      <Box
        x={230}
        y={171}
        width={250}
        height={72}
        label="U-Net / DiT + training loss"
        tex={String.raw`u_t^\theta(x_t,c)`}
      />
      <Edge id={id} d="M 460 116 V 171" />
      <Box x={20} y={171} width={149} height={72} label="Text encoder" tex="c" tone="clay" />
      <Edge id={id} d="M 169 207 H 230" />
      <text x={355} y={265} className="df-note">
        这里更新 backbone 的参数
      </text>
      <path d="M 20 284 H 638" className="df-axis" />
      <text x={330} y={313} className="df-label">
        生成：从 latent noise 出发
      </text>
      <Box x={20} y={340} width={94} height={64} label="Latent noise" tex="x_0" />
      <Box
        x={148}
        y={340}
        width={220}
        height={64}
        label="Backbone + sampler"
        tex={String.raw`x_{t_0}\to x_{t_1}\to\cdots\to x_1`}
      />
      <Box x={407} y={340} width={103} height={64} label="Decoder" tex="D" tone="teal" />
      <Box x={548} y={340} width={90} height={64} label="生成图片" tex="D(x_1)" tone="teal" />
      <Edge id={id} d="M 114 372 H 148" />
      <Edge id={id} d="M 368 372 H 407" />
      <Edge id={id} d="M 510 372 H 548" />
      <text x={258} y={432} className="df-note">
        每一步都读取时间与条件
      </text>
      <text x={459} y={432} className="df-note">
        固定参数
      </text>
    </Figure>
  );
}

export const POST_COMPONENTS = {
  DiffusionProbabilityPath,
  DiffusionTrainingSampling,
  DiffusionLatentPipeline,
};
