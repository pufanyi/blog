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
      caption="需求驱动的空间调度示意，形状与范围不对应某个引擎的固定参数。蓝色区域获得某类模拟资格，仍要满足具体更新条件；玩家与远处其他需求可以共同维持分离的活动区域。"
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

function StreamingPipeline() {
  return (
    <WorldFigure
      id="ows-streaming"
      title="读取完成之后，还要留出分批激活的时间"
      description="时间从左向右。后台读取与解压先完成，随后把对象创建、恢复和注册工作分散到三个帧的预算内；必要工作完成后，区域才能交互。每帧未被占用的空间留给正常游戏工作。图中的时间长度和批次数是示意，不是实测。"
      height={318}
      caption="一种流水线示例：资源就绪与场景可交互是两个时刻。后台工作可以并行，依赖于它的创建、恢复与注册仍需安排预算。图中用三个批次展示分帧处理，不要求所有引擎都在同一线程完成这些阶段。"
    >
      <text x="26" y="35" className="ows-heading">
        从发出请求，到真正可交互
      </text>
      <text x="26" y="117" className="ows-label">
        后台工作
      </text>
      <rect x="168" y="89" width="212" height="44" rx="5" className="ows-loaded" />
      <text x="274" y="117" textAnchor="middle">
        读取与解压
      </text>
      <text x="380" y="72" textAnchor="middle" className="ows-small">
        资源就绪
      </text>
      <path d="M380 134V162H419" className="ows-edge" />
      <path d="M412 158L420 162L412 166Z" className="ows-dot" />
      <text x="26" y="206" className="ows-label">
        分帧激活
      </text>
      {[420, 510, 600].map((x, index) => (
        <g key={x}>
          <rect x={x} y="174" width="78" height="52" rx="4" className="ows-empty" />
          <rect x={x} y="174" width="43" height="52" rx="4" className="ows-active" />
          <text x={x + 39} y="250" textAnchor="middle" className="ows-small">
            {`第 ${index + 1} 帧`}
          </text>
        </g>
      ))}
      <path d="M643 200H705V109" className="ows-edge" />
      <path d="M701 116L705 108L709 116Z" className="ows-dot" />
      <circle cx="705" cy="94" r="8" className="ows-catchup" />
      <text x="705" y="72" textAnchor="middle" className="ows-small">
        可交互
      </text>
      <path d="M168 277H736" className="ows-guide" />
      <path d="M729 273L736 277L729 281" className="ows-guide" />
      <text x="168" y="299" className="ows-small">
        发出请求
      </text>
      <text x="516" y="299" textAnchor="middle" className="ows-small">
        实色：激活工作；虚框余量：其他帧内工作
      </text>
    </WorldFigure>
  );
}

const caravan = [
  { id: '车 1', cargo: 8 },
  { id: '车 2', cargo: 7 },
  { id: '车 3', cargo: 5 },
];
const caravanCargo = caravan.reduce((sum, vehicle) => sum + vehicle.cargo, 0);

function SimulationHandoff() {
  return (
    <WorldFigure
      id="ows-handoff"
      title="商队在详细与抽象表示之间交接"
      description={`详细表示包含三辆车，分别装有 ${caravan.map((vehicle) => vehicle.cargo).join('、')} 袋货物。抽象表示保存同一组车辆身份、路线进度与总计 ${caravanCargo} 袋货物。离开时汇总，接近时恢复；交接不应复制货物，也不应让两种模型同时推进同一商队。`}
      height={350}
      caption={`原创设计示例：切换前后都保有 ${caravanCargo} 袋货物和同一组身份。可以省掉每辆车的逐帧避障，但需要保留路线进度，并明确交接前后由哪个模型推进状态。两侧表示同一商队的两种运行方式。`}
    >
      <text x="194" y="35" textAnchor="middle" className="ows-heading">
        详细表示：逐车运动
      </text>
      <text x="587" y="35" textAnchor="middle" className="ows-heading">
        抽象表示：路线上的一条记录
      </text>
      {caravan.map(({ id, cargo }, index) => {
        const x = 55 + index * 95;
        return (
          <g key={id}>
            <text x={x + 37} y="83" textAnchor="middle" className="ows-small">
              {id}
            </text>
            <rect x={x} y="103" width="73" height="44" rx="4" className="ows-house" />
            <circle cx={x + 16} cy="154" r="8" className="ows-dot" />
            <circle cx={x + 57} cy="154" r="8" className="ows-dot" />
            <text x={x + 37} y="131" textAnchor="middle">
              {`${cargo} 袋`}
            </text>
          </g>
        );
      })}
      <path d="M42 176H332" className="ows-guide" />
      <text x="194" y="218" textAnchor="middle" className="ows-label">
        {`合计 ${caravanCargo} 袋`}
      </text>
      <path d="M348 108H422M422 176H348" className="ows-edge" />
      <path d="M415 104L423 108L415 112ZM355 172L347 176L355 180Z" className="ows-dot" />
      <text x="385" y="94" textAnchor="middle" className="ows-small">
        汇总
      </text>
      <text x="385" y="200" textAnchor="middle" className="ows-small">
        恢复
      </text>
      <rect x="453" y="60" width="268" height="174" rx="8" className="ows-loaded" />
      <path d="M476 142H696" className="ows-edge" />
      <circle cx="476" cy="142" r="4" className="ows-dot" />
      <circle cx="696" cy="142" r="4" className="ows-dot" />
      <circle cx="571" cy="142" r="8" className="ows-catchup" />
      <text x="571" y="116" textAnchor="middle" className="ows-label">
        {`${caravanCargo} 袋`}
      </text>
      <text x="587" y="176" textAnchor="middle" className="ows-small">
        沿路线推进
      </text>
      <text x="587" y="214" textAnchor="middle">
        {caravan.map((vehicle) => vehicle.id).join(' · ')}
      </text>
      <path d="M194 246V272H587V246" className="ows-guide" />
      <text x="390" y="304" textAnchor="middle" className="ows-label">
        交接推进职责，保持身份与货物总量
      </text>
      <text x="390" y="330" textAnchor="middle" className="ows-small">
        新模型接管后，旧模型停止相关结算
      </text>
    </WorldFigure>
  );
}

export const POST_COMPONENTS = {
  WorldActivity,
  TimeStrategies,
  RepresentationLayers,
  StreamingPipeline,
  SimulationHandoff,
};
