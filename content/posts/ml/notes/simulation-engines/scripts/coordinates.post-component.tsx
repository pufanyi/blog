import type { ReactNode } from 'react';

function Label({
  x,
  y,
  width = 180,
  children,
}: {
  x: number;
  y: number;
  width?: number;
  children: ReactNode;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={32}>
      <div className="sim-coord-label">{children}</div>
    </foreignObject>
  );
}

function Tex({ tex }: { tex: string }) {
  return <span>{`\\(${tex}\\)`}</span>;
}

type Point = readonly [number, number];

function Rod({ from, to, second = false }: { from: Point; to: Point; second?: boolean }) {
  return (
    <path
      d={`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`}
      className={`sim-coord-rod${second ? ' sim-coord-second' : ''}`}
    />
  );
}

function Anchors({ a, b }: { a: Point; b: Point }) {
  return (
    <>
      <circle cx={a[0]} cy={a[1]} r="8" className="sim-coord-anchor-a" />
      <rect x={b[0] - 4} y={b[1] - 4} width="8" height="8" className="sim-coord-anchor-b" />
    </>
  );
}

function FreeStep({ x, separated, heading }: { x: number; separated: boolean; heading: string }) {
  const a: Point = [x + 100, 161];
  const drop = separated ? 28 : 0;
  const b: Point = [a[0], a[1] + drop];
  return (
    <g>
      <rect x={x} y={56} width="222" height="226" rx="9" className="sim-coord-panel" />
      <text x={x + 111} y="81" className="sim-coord-heading">
        {heading}
      </text>
      <Rod from={[x + 36, 222]} to={a} />
      <Rod from={b} to={[x + 180, 186 + drop]} second />
      <path d={`M${x + 24} 235h24M${x + 36} 222v13`} className="sim-coord-guide" />
      <text x={x + 47} y="184">
        A
      </text>
      <text x={x + 173} y={167 + drop}>
        B
      </text>
      {separated && (
        <>
          <path d={`M${x + 100} 169V${b[1] - 5}`} className="sim-coord-gap" />
          <path d={`M${x + 197} 170v28l-4 -6m4 6l4 -6`} className="sim-coord-gap" />
          <Label x={x + 108} y={140} width={60}>
            <Tex tex="a_A" />
          </Label>
          <Label x={x + 61} y={195} width={60}>
            <Tex tex="a_B" />
          </Label>
        </>
      )}
      <Anchors a={a} b={b} />
      <Label x={x + 11} y={237} width={200}>
        <Tex tex={separated ? 'a_A\\ne a_B' : 'a_A=a_B'} />
      </Label>
      <text x={x + 111} y="273" className="sim-coord-small">
        {separated ? '漏掉铰链反力，B 整体下落' : 'A 锁住；B 起初静止'}
      </text>
    </g>
  );
}

const lengths = [85, 80] as const;
function endpoint(origin: Point, length: number, degrees: number): Point {
  const angle = (degrees * Math.PI) / 180;
  return [origin[0] + length * Math.cos(angle), origin[1] - length * Math.sin(angle)];
}

function JointChain({ x, q1, q2 }: { x: number; q1: number; q2: number }) {
  const base: Point = [x + 35, 500];
  const a = endpoint(base, lengths[0], q1);
  const b = endpoint(a, lengths[1], q1 + q2);
  const arcStart = endpoint(base, 25, 0);
  const arcEnd = endpoint(base, 25, q1);
  const elbowStart = endpoint(a, 24, q1);
  const elbowEnd = endpoint(a, 24, q1 + q2);
  return (
    <g>
      <Label x={x} y={359} width={242}>
        <Tex tex={`q_1=${q1}^\\circ,\\quad q_2=${q2}^\\circ`} />
      </Label>
      <path
        d={`M${base[0]} ${base[1]}h54M${a[0]} ${a[1]}L${endpoint(a, 48, q1).join(' ')}`}
        className="sim-coord-guide sim-coord-dashed"
      />
      <Rod from={base} to={a} />
      <Rod from={a} to={b} second />
      <path
        d={`M${arcStart.join(' ')}A25 25 0 0 0 ${arcEnd.join(' ')}M${elbowStart.join(' ')}A24 24 0 0 1 ${elbowEnd.join(' ')}`}
        className="sim-coord-angle"
      />
      <circle cx={base[0]} cy={base[1]} r="6" className="sim-coord-joint" />
      <circle cx={a[0]} cy={a[1]} r="6" className="sim-coord-joint" />
      <circle cx={b[0]} cy={b[1]} r="4" className="sim-coord-joint" />
      <Label x={base[0] + 36} y={base[1] - 20} width={38}>
        <Tex tex="q_1" />
      </Label>
      <Label x={a[0] + 23} y={a[1] - 26} width={38}>
        <Tex tex="q_2" />
      </Label>
      <Label x={a[0] - 34} y={a[1] - 31} width={32}>
        <Tex tex="a" />
      </Label>
      <Label x={b[0] + 4} y={b[1] - 13} width={32}>
        <Tex tex="b" />
      </Label>
      <text x={x + 121} y="538" className="sim-coord-small">
        B 的起点直接使用 A 的终点
      </text>
    </g>
  );
}

function CoordinateRepresentations() {
  return (
    <figure className="sim-figure sim-coord-figure">
      <div
        className="sim-scroll"
        role="region"
        aria-label="两种坐标表示对照，窄屏可横向滚动"
        tabIndex={0}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="760"
          height="557"
          viewBox="0 0 760 557"
          role="img"
          aria-labelledby="sim-coord-title sim-coord-desc"
        >
          <title id="sim-coord-title">为什么关节会分离，以及两种坐标表示怎样维持连接</title>
          <desc id="sim-coord-desc">
            上方取一个铰链：蓝色连杆 A 锁住，绿色连杆 B
            起初静止。圆圈与方块标出从各连杆位姿算出的连接点。忽略铰链反力时，B
            受重力整体下落，两个连接点分开；约束求解需要维持它们重合。下方把机械臂简化成平面两连杆，从同一组固定长度和两组关节角计算姿态：40
            度、负 60 度，以及 65 度、负 90
            度。两种姿态都从共享的肘关节位置继续构造第二根连杆，因此没有分离的自由度。
          </desc>
          <text x="20" y="26" textAnchor="start" className="sim-coord-heading">
            Maximal：分别保存位姿，再要求连接点重合
          </text>
          <FreeStep x={16} separated={false} heading="当前：连接点重合" />
          <FreeStep x={267} separated heading="假设：只算自由运动" />
          <path d="M242 170h18l-5 -4m5 4l-5 4" className="sim-coord-guide" />
          <rect x="518" y="56" width="226" height="226" rx="9" className="sim-coord-panel" />
          <text x="631" y="81" className="sim-coord-heading">
            需要补上的约束
          </text>
          <Label x={536} y={108} width={190}>
            <Tex tex="C=a_A-a_B=0" />
          </Label>
          <text x="631" y="164">
            求铰链反力 / 冲量
          </text>
          <text x="631" y="189">
            协调两侧的运动
          </text>
          <text x="631" y="228" className="sim-coord-small">
            小误差若未受控，可能积累
          </text>
          <text x="631" y="253" className="sim-coord-small">
            图中间隙放大，不是求解结果
          </text>
          <text x="20" y="322" textAnchor="start" className="sim-coord-heading">
            Reduced：保存关节角，沿连杆构造位姿
          </text>
          <rect x="16" y="340" width="728" height="206" rx="9" className="sim-coord-panel" />
          <JointChain x={77} q1={40} q2={-60} />
          <JointChain x={431} q1={65} q2={-90} />
          <text x="380" y="424" className="sim-coord-small">
            改变角度
          </text>
          <path d="M345 443h70l-6 -4m6 4l-6 4" className="sim-coord-guide" />
        </svg>
      </div>
      <figcaption>
        上图的圆圈与方块分别属于 A、B，位置由各自位姿计算，并非额外独立保存的状态。
        下图使用同一组连杆长度：先求肘关节，再从肘关节求末端，角度改变时连接仍成立。
        两个例子分别放大一个铰链、简化成平面两连杆，用来解释七关节机械臂的同一机制。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { CoordinateRepresentations };
