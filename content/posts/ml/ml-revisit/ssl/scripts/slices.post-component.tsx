import { Figure, Label, MathLabel } from './elements';

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
      height={290}
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
      <Label x={548} y={265} note>
        概率密度；曲线下总面积为 1
      </Label>
    </Figure>
  );
}

export const POST_COMPONENTS = { GaussianSlices };
