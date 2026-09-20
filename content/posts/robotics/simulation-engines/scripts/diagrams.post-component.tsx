import type { ReactNode } from 'react';

function Figure({
  id,
  title,
  description,
  caption,
  height,
  children,
}: {
  id: string;
  title: string;
  description: string;
  caption: string;
  height: number;
  children: ReactNode;
}) {
  return (
    <figure className="sim-figure">
      <div className="sim-scroll">
        <svg
          viewBox={`0 0 720 ${height}`}
          width="720"
          height={height}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <defs>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 10 8"
              refX="9"
              refY="4"
              markerWidth="7"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 4 L 0 8 Z" className="sim-arrowhead" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function SimulationStep() {
  const stages = ['自由运动预测', '检测接触', '求解约束响应', '积分到新状态'];
  return (
    <Figure
      id="sim-step"
      title="机械臂推方块的一次物理推进与观测反馈"
      description="上方机械臂的末端向右接触桌面上的方块。下方实线连接自由运动预测、接触检测、约束求解和状态积分。新状态经虚线传给传感器，再由控制器产生下一次驱动。示意图强调物理状态推进与观测反馈的区别，步骤之间可能复用中间计算。"
      caption="同一个接触同时改变机器人和方块的运动。实线表示物理推进，虚线表示新状态通过观测与控制反馈到下一步；图示只表达主要依赖，不规定各引擎内部的精确调用顺序。"
      height={350}
    >
      <path d="M 80 161 H 637" className="sim-ground" />
      <path d="M 131 155 V 132 L 208 64 L 290 99 L 322 135" className="sim-arm" />
      {[
        [131, 132],
        [208, 64],
        [290, 99],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="9" className="sim-joint" />
      ))}
      <path d="M 321 126 V 151" className="sim-contact-edge" />
      <rect x="327" y="115" width="64" height="45" rx="2" className="sim-body" />
      <path d="M 395 135 H 469" className="sim-line" markerEnd="url(#sim-step-arrow)" />
      <rect x="492" y="115" width="64" height="45" rx="2" className="sim-target" />
      <text x="172" y="30">
        关节驱动
      </text>
      <text x="356" y="94">
        接触
      </text>
      <text x="524" y="94">
        目标
      </text>
      {stages.map((label, index) => {
        const x = 28 + index * 180;
        return (
          <g key={label}>
            <rect x={x} y="202" width="145" height="49" rx="6" className="sim-box" />
            <text x={x + 72.5} y="232">
              {label}
            </text>
            {index < stages.length - 1 && (
              <path
                d={`M ${x + 146} 226 H ${x + 175}`}
                className="sim-line"
                markerEnd="url(#sim-step-arrow)"
              />
            )}
          </g>
        );
      })}
      <path
        d="M 640 253 V 301 H 430 M 289 301 H 100 V 253"
        className="sim-feedback"
        markerEnd="url(#sim-step-arrow)"
      />
      <text x="359" y="307">
        传感器 → 控制
      </text>
    </Figure>
  );
}

const materialNodes = [
  [0, 0],
  [45, 8],
  [89, 0],
  [8, 43],
  [50, 49],
  [94, 38],
  [15, 88],
  [57, 94],
  [99, 85],
];
const triangles = [
  [0, 1, 3],
  [1, 4, 3],
  [1, 2, 4],
  [2, 5, 4],
  [3, 4, 6],
  [4, 7, 6],
  [4, 5, 7],
  [5, 8, 7],
];

function MaterialRepresentations() {
  return (
    <Figure
      id="sim-material"
      title="刚体、网格材料和 MPM 粒子的状态表示"
      description="左图中一个刚性方块由中心位姿决定整体运动。中图中材料由相连的三角网格示意，节点可以相对移动产生形变。右图中材料粒子叠放在独立的规则背景网格上；粒子保存材料状态，网格临时参与动量和力的计算。二维图形只是表示方式示意，不是仿真输出或网格精度比较。"
      caption="刚体保存整体位姿；FEM 的材料网格随物体形变；MPM 粒子与背景网格不绑定，通过 particle-to-grid 与 grid-to-particle 传递信息。这里用二维截面示意，未展示实际三维离散单元。"
      height={252}
    >
      {['Rigid body', 'FEM', 'MPM'].map((label, index) => (
        <text key={label} x={120 + index * 240} y="32" className="sim-heading">
          {label}
        </text>
      ))}
      <path d="M 240 53 V 221 M 480 53 V 221" className="sim-divider" />
      <g transform="translate(74 77) rotate(-8 48 47)">
        <rect width="96" height="94" className="sim-body" />
        <path d="M 48 65 V 26 M 28 47 H 68" className="sim-line" />
        <circle cx="48" cy="47" r="4" className="sim-dot" />
      </g>
      <g transform="translate(310 75)">
        {triangles.map((indices) => (
          <polygon
            key={indices.join('-')}
            points={indices.map((index) => materialNodes[index]!.join(',')).join(' ')}
            className="sim-mesh"
          />
        ))}
        {materialNodes.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" className="sim-dot" />
        ))}
      </g>
      <g transform="translate(542 68)">
        {[0, 24, 48, 72, 96, 120].map((offset) => (
          <path key={offset} d={`M ${offset} 0 V 120 M 0 ${offset} H 120`} className="sim-grid" />
        ))}
        {materialNodes.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x! + 9} cy={y! + 13} r="5" className="sim-particle" />
        ))}
      </g>
      <text x="120" y="219">
        整体平移与旋转
      </text>
      <text x="360" y="219">
        节点与单元形变
      </text>
      <text x="600" y="219">
        粒子 ↔ 背景网格
      </text>
    </Figure>
  );
}

function BatchedRollouts() {
  const lanes = ['环境 1', '环境 2', '环境 3'];
  const columns = ['当前状态', '推进一步', '再推进一步', '后续轨迹'];
  return (
    <Figure
      id="sim-batch"
      title="环境维度可以并行，同一轨迹的时间依赖仍然存在"
      description="三行表示三个独立环境，四列表示沿时间推进的状态。每行箭头从左到右，没有跨环境的状态依赖。中间一列用虚线框标出，表示这些环境在同一次批量推进中并行计算；每一行仍需等待自己的前一状态。"
      caption="横向是同一环境的时间依赖，纵向是独立环境的并行。提高 batch size 增加一次推进产出的样本数，不会消除一条轨迹内部的因果依赖。"
      height={297}
    >
      <rect x="264" y="52" width="111" height="192" rx="8" className="sim-batch-column" />
      {columns.map((label, index) => (
        <text key={label} x={165 + 155 * index} y="30">
          {label}
        </text>
      ))}
      {lanes.map((label, row) => {
        const y = 83 + row * 64;
        return (
          <g key={label}>
            <text x="49" y={y + 5}>
              {label}
            </text>
            {columns.map((column, index) => {
              const x = 124 + index * 155;
              return (
                <g key={column}>
                  <rect x={x} y={y - 19} width="82" height="38" rx="5" className="sim-box" />
                  <circle cx={x + 24 + index * 10} cy={y} r="6" className="sim-particle" />
                  {index < columns.length - 1 && (
                    <path
                      d={`M ${x + 85} ${y} H ${x + 148}`}
                      className="sim-line"
                      markerEnd="url(#sim-batch-arrow)"
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      <text x="320" y="275" className="sim-heading">
        同一次 batch step
      </text>
    </Figure>
  );
}

export const POST_COMPONENTS = { SimulationStep, MaterialRepresentations, BatchedRollouts };
