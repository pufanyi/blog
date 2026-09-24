import type { ReactNode } from 'react';

function WorldFigure({
  id,
  title,
  description,
  height,
  caption,
  children,
}: {
  id: string;
  title: string;
  description: string;
  height: number;
  caption: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="ows-figure" id={id}>
      <div className="ows-scroll">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="780"
          height={height}
          viewBox={`0 0 780 ${height}`}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          {children}
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function WorldActivity() {
  return (
    <WorldFigure
      id="ows-activity"
      title="加载需求可以形成多个分离的活动区域"
      description="示意地图上，玩家周围的一组区块以及远处另一加载来源附近的区块获得模拟资格。活动区域外还有只保持数据加载的区块，其余区域可以只保留存档。区块状态由需求决定，不等于玩家视野中的一个圆。"
      height={334}
      caption="空间资格示意，不表示任何 Minecraft 版本的精确半径、ticket 等级或边界形状。蓝色区域获得某类模拟资格，仍要满足具体机制的额外条件；玩家与远处加载来源可以共同维持分离的活动区域。"
    >
      <text x="26" y="35" className="ows-heading">
        谁还需要这个区域？
      </text>
      {Array.from({ length: 126 }, (_, index) => {
        const x = index % 18;
        const y = Math.floor(index / 18);
        const simulating =
          (x >= 2 && x <= 5 && y >= 2 && y <= 4) || (x >= 13 && x <= 14 && y >= 3 && y <= 4);
        const loaded =
          (x >= 1 && x <= 6 && y >= 1 && y <= 5) || (x >= 12 && x <= 15 && y >= 2 && y <= 5);
        return (
          <rect
            key={`${x}-${y}`}
            x={26 + x * 27}
            y={61 + y * 27}
            width="25"
            height="25"
            rx="2"
            className={`ows-cell ${simulating ? 'ows-active' : loaded ? 'ows-loaded' : 'ows-stored'}`}
          />
        );
      })}
      <circle cx="132" cy="155" r="7" className="ows-player" />
      <path d="M390 153L399 162L390 171L381 162Z" className="ows-source" />
      <path d="M132 175V275M390 179V275" className="ows-guide" />
      <text x="132" y="299" textAnchor="middle">
        玩家
      </text>
      <text x="390" y="299" textAnchor="middle">
        另一加载来源
      </text>
      {[
        { y: 80, className: 'ows-active', label: '获得模拟资格', note: '仍需检查具体更新条件' },
        { y: 148, className: 'ows-loaded', label: '数据已加载', note: '不代表所有逻辑运行' },
        { y: 216, className: 'ows-stored', label: '可只保留存档', note: '需要时再恢复运行状态' },
      ].map(({ y, className, label, note }) => (
        <g key={className}>
          <rect
            x="546"
            y={y - 15}
            width="21"
            height="21"
            rx="2"
            className={`ows-cell ${className}`}
          />
          <text x="580" y={y} className="ows-label">
            {label}
          </text>
          <text x="546" y={y + 28} className="ows-small">
            {note}
          </text>
        </g>
      ))}
    </WorldFigure>
  );
}

function TimeStrategies() {
  return (
    <WorldFigure
      id="ows-time"
      title="持续运行、暂停与返回补算的区别"
      description="以磨坊离开六百秒的简化例子比较三种策略。持续运行在离开期间反复执行；暂停不执行也不累计生产时间；补算把中间执行压缩为返回时的一次六百秒结算。只在速率恒定、原料和库存都不构成限制时，持续运行与补算才在例子的最终产量上相同。"
      height={326}
      caption="圆点表示逻辑执行机会，不代表一帧或一袋面粉。以正文的磨坊为例：持续运行与等价补算都能增加 20 袋，完全暂停则不会增加。图中只比较最终产量；补算并没有重建中间的动画、碰撞或外部交互。"
    >
      <rect x="255" y="55" width="276" height="215" rx="5" className="ows-away" />
      <text x="255" y="34" textAnchor="middle" className="ows-label">
        离开
      </text>
      <text x="531" y="34" textAnchor="middle" className="ows-label">
        返回
      </text>
      <text x="393" y="80" textAnchor="middle" className="ows-small">
        世界时间经过 600 秒
      </text>
      {[
        { y: 115, label: '继续更新', result: '+20 袋' },
        { y: 178, label: '完全暂停', result: '+0 袋' },
        { y: 241, label: '返回时补算', result: '+20 袋' },
      ].map(({ y, label, result }, row) => (
        <g key={label}>
          <text x="28" y={y + 5} className="ows-label">
            {label}
          </text>
          <path d={`M172 ${y}H613`} className="ows-guide" />
          {[181, 207, 233, 559, 585].map((x) => (
            <circle key={x} cx={x} cy={y} r="4.5" className="ows-dot" />
          ))}
          {row === 0 ? (
            Array.from({ length: 10 }, (_, i) => (
              <circle
                key={`update-${i + 1}`}
                cx={267 + i * 26}
                cy={y}
                r="4.5"
                className="ows-dot"
              />
            ))
          ) : (
            <path d={`M266 ${y}H514`} className="ows-skip" />
          )}
          {row === 2 ? (
            <>
              <circle cx="531" cy={y} r="11" className="ows-catchup" />
              <text x="531" y="291" textAnchor="middle" className="ows-small">
                结算这 600 秒
              </text>
            </>
          ) : null}
          <text x="649" y={y + 5} className="ows-label">
            {result}
          </text>
        </g>
      ))}
    </WorldFigure>
  );
}

function House({ x, y, detail }: { x: number; y: number; detail: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 29L38 0L76 29V78H0Z" className="ows-house" />
      {detail ? (
        <>
          <path d="M-6 30L38 -4L82 30M0 36H76" className="ows-edge" />
          <rect x="12" y="44" width="15" height="16" className="ows-window" />
          <rect x="49" y="44" width="15" height="16" className="ows-window" />
          <path d="M31 78V51H45V78M57 11V0H67V19" className="ows-edge" />
        </>
      ) : null}
    </g>
  );
}

function RepresentationLayers() {
  return (
    <WorldFigure
      id="ows-layers"
      title="同一座村庄可以拥有不同成本的表示"
      description="左边完整场景包含两座带门窗的房屋，中间远景代理保留整体轮廓，右边没有视觉表示。但三个阶段都可连接到下方的一份权威状态：房屋破坏记录、库存和生产时间。视图切换不应创建第二份库存或恢复已经被破坏的房屋。"
      height={390}
      caption="一种大世界设计示例：表示可以更换，玩家造成的变化仍属于同一份权威状态。HLOD 管场景的远景外观；生产是否继续、库存何时结算，需要另外设计。图中的三列表示三种观察条件，不是 Unreal 自动提供的一条完整游戏逻辑。"
    >
      {[
        { x: 130, label: '附近：完整场景', note: '可交互对象与必要碰撞' },
        { x: 390, label: '远处：外观代理', note: '保留轮廓，减少场景细节' },
        { x: 650, label: '不可见：无画面', note: '仍可保留后台逻辑状态' },
      ].map(({ x, label, note }) => (
        <g key={label}>
          <text x={x} y="35" textAnchor="middle" className="ows-heading">
            {label}
          </text>
          <text x={x} y="202" textAnchor="middle" className="ows-small">
            {note}
          </text>
          <path d={`M${x} 223V275`} className="ows-edge" />
          <circle cx={x} cy="275" r="4" className="ows-dot" />
        </g>
      ))}
      <House x={66} y={68} detail />
      <House x={118} y={89} detail />
      <path d="M58 172H205" className="ows-guide" />
      <House x={326} y={68} detail={false} />
      <House x={378} y={89} detail={false} />
      <path d="M318 172H465" className="ows-guide" />
      <rect x="597" y="81" width="106" height="86" rx="7" className="ows-empty" />
      <path d="M629 123H671" className="ows-guide" />
      <rect x="49" y="275" width="682" height="85" rx="8" className="ows-state" />
      <text x="390" y="306" textAnchor="middle" className="ows-label">
        一份权威状态
      </text>
      <text x="390" y="336" textAnchor="middle">
        房屋是否烧毁 · 仓库库存 · 生产进度 · 上次结算时间
      </text>
    </WorldFigure>
  );
}

export const POST_COMPONENTS = { WorldActivity, TimeStrategies, RepresentationLayers };
