import { Arrow, Box, Figure, Label, MathLabel, Vector } from './elements';

const CORNERS = [-1, 1].flatMap((x) => [-1, 1].map((y) => ({ x, y, mass: 0.25 })));
const DIRECTION = { x: 1 / Math.sqrt(2), y: 1 / Math.sqrt(2) };
const PROJECTIONS = new Map<number, number>();
for (const p of CORNERS) {
  const value = p.x * DIRECTION.x + p.y * DIRECTION.y;
  PROJECTIONS.set(value, (PROJECTIONS.get(value) ?? 0) + p.mass);
}
const MASS = [...PROJECTIONS].sort(([a], [b]) => a - b);
const GAUSSIAN = Array.from({ length: 101 }, (_, i) => {
  const x = -3 + (6 * i) / 100;
  return { x, density: Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI) };
});

function GaussianSlices() {
  return (
    <Figure
      id="ssl-slices"
      title="Covariance 为单位矩阵，仍然可能不是 Gaussian"
      description="左图四个顶点各有四分之一概率，均值为零、covariance 为单位矩阵。沿对角线单位方向投影后，负根号二、零、正根号二的概率为四分之一、二分之一、四分之一。右图单独画标准 Gaussian 密度供形状比较，密度与中图的离散质量不是同一种纵轴。"
      caption="一个精确的二维反例，未使用训练数据。中图画离散概率质量，右图画连续密度，不能直接比较两者的高度。"
      height={306}
    >
      <Label x={110} y={27}>
        四个点：相同二阶统计
      </Label>
      <Label x={330} y={27}>
        对角方向的投影
      </Label>
      <Label x={548} y={27}>
        标准 Gaussian
      </Label>
      <path d="M 25 137 H 195 M 110 52 V 222" className="ssl-axis" />
      <path d="M 45 202 L 175 72" className="ssl-edge ssl-update" />
      {CORNERS.map((p) => (
        <circle
          key={`${p.x},${p.y}`}
          cx={110 + p.x * 53}
          cy={137 - p.y * 53}
          r="6"
          className="ssl-point"
        />
      ))}
      <MathLabel
        x={17}
        y={237}
        width={186}
        tex={String.raw`\mathbb E[z]=0,\;\operatorname{Cov}(z)=I_2`}
      />
      <path d="M 237 207 H 423 M 237 48 V 207" className="ssl-axis" />
      {MASS.map(([value, mass]) => {
        const x = 330 + value * 48;
        return (
          <g key={value}>
            <line x1={x} y1="207" x2={x} y2={207 - mass * 264} className="ssl-mass" />
            <circle cx={x} cy={207 - mass * 264} r="4" className="ssl-mass" />
            <Label x={x} y={197 - mass * 264} note>
              {mass.toFixed(2)}
            </Label>
            <MathLabel
              x={x - 30}
              y={207}
              width={60}
              tex={value === 0 ? '0' : value < 0 ? String.raw`-\sqrt2` : String.raw`\sqrt2`}
            />
          </g>
        );
      })}
      <Label x={330} y={265} note>
        概率质量；三项相加为 1
      </Label>
      <path d="M 453 207 H 643 M 453 48 V 207" className="ssl-axis" />
      <path
        d={GAUSSIAN.map(
          (p, i) => `${i ? 'L' : 'M'} ${548 + p.x * 30} ${207 - p.density * 300}`,
        ).join(' ')}
        className="ssl-curve"
      />
      <MathLabel
        x={453}
        y={217}
        width={190}
        tex={String.raw`p(u)=\frac{e^{-u^2/2}}{\sqrt{2\pi}}`}
      />
      <Label x={548} y={284} note>
        概率密度；曲线下总面积为 1
      </Label>
    </Figure>
  );
}

function LeJEPAObjective() {
  const id = 'ssl-lejepa';
  const samples = [
    [12, 23, 17, 27],
    [27, 9, 22, 15],
    [10, 27, 13, 19],
  ];
  return (
    <Figure
      id={id}
      title="LeJEPA：沿 view 轴对齐，沿样本轴防止 collapse"
      description="Global 和 local views 经共享 encoder 与 projector 得到 projections。网格每行是一张图，每列是一种 view。Prediction loss 使每行的所有 views 接近该图 global views 的均值，均值参与求导。SIGReg 对每列的跨图像分布采样随机方向做一维投影，比较投影的 empirical characteristic function 与标准 Gaussian 的 characteristic function。每个 view 分别计算后平均，两项共同更新共享网络。"
      caption="横向联系同一图的不同 views，纵向约束不同图的分布。两项都反传；global center 也参与求导，无需 EMA teacher。"
      height={472}
    >
      <Box x={16} y={22} width={168} label="Global + local views" tone="neutral" />
      <Box x={237} y={22} width={210} label="共享 encoder + projector" />
      <Box x={502} y={22} width={143} label="Projections" />
      <Arrow id={id} d="M 186 48 H 235 M 449 48 H 500" />
      <Arrow id={id} d="M 574 76 V 91 H 164 V 100" />
      <Label x={90} y={116} note>
        Global 1
      </Label>
      <Label x={164} y={116} note>
        Global 2
      </Label>
      <Label x={238} y={116} note>
        Local
      </Label>
      {samples.map((sample, row) => (
        <g key={row}>
          <Label x={28} y={153 + row * 51} note>{`图 ${row + 1}`}</Label>
          {[0, 1, 2].map((column) => (
            <g key={column}>
              <rect
                x={62 + column * 74}
                y={127 + row * 51}
                width="57"
                height="42"
                rx="3"
                className="ssl-cell"
              />
              <Vector
                x={73 + column * 74}
                y={133 + row * 51}
                values={sample.map((value, i) => value + (i % 2 ? column : -column))}
                tone={row === 0 ? 'clay' : row === 1 ? 'blue' : 'teal'}
              />
            </g>
          ))}
        </g>
      ))}
      <rect x="57" y="122" width="216" height="52" rx="5" className="ssl-row-band" />
      <rect x="132" y="120" width="65" height="158" rx="5" className="ssl-column-band" />
      <Box
        x={362}
        y={131}
        width={280}
        label="Prediction：同一图的 views 对齐"
        sub="Target = 该图 global views 的均值"
        tone="clay"
      />
      <Arrow id={id} d="M 275 148 H 327 V 157 H 360" />
      <MathLabel
        x={366}
        y={193}
        width={270}
        tex={String.raw`\mu_i=\frac{z_{i,\mathrm{g1}}+z_{i,\mathrm{g2}}}{2}`}
      />
      <Label x={502} y={257} note>
        Local view 参与预测，不进入这个 center
      </Label>
      <Arrow id={id} d="M 163 280 V 306" />
      <Label x={167} y={327}>
        SIGReg：每个 view 的跨图像分布
      </Label>
      <Box x={16} y={346} width={174} label="收集这一列的样本" sub="每一列都单独计算" tone="teal" />
      <Box
        x={241}
        y={346}
        width={174}
        label="多个随机方向投影"
        sub="高维向量 → 一维样本"
        tone="teal"
      />
      <Box
        x={466}
        y={346}
        width={179}
        label="与标准 Gaussian 比较"
        sub="比较 characteristic functions"
        tone="teal"
      />
      <Arrow id={id} d="M 192 372 H 239 M 417 372 H 464" />
      <MathLabel
        x={154}
        y={417}
        width={350}
        tex={String.raw`\mathcal L=(1-\lambda)\mathcal L_{\mathrm{pred}}+\lambda\mathcal L_{\mathrm{SIGReg}}`}
      />
    </Figure>
  );
}

export const POST_COMPONENTS = { GaussianSlices, LeJEPAObjective };
