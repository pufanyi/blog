import { Arrow, Box, Figure, Label, MathLabel } from './elements';

// Every view and source outline uses these same scene coordinates.
const crops = [
  { name: 'Global 1', x: 12, y: 16, size: 156, tone: 'blue' },
  { name: 'Global 2', x: 90, y: 5, size: 126, tone: 'teal' },
  { name: 'Local 1', x: 117, y: 21, size: 58, tone: 'clay' },
  { name: 'Local 2', x: 64, y: 64, size: 62, tone: 'clay' },
] as const;

function BirdScene() {
  return (
    <g aria-hidden="true">
      <rect width="240" height="180" className="ssl-swav-sky" />
      <path
        d="M 0 154 Q 35 96 74 145 T 158 131 T 240 119 V 180 H 0 Z"
        className="ssl-swav-foliage"
      />
      <path
        d="M -8 151 L 250 131 M 187 136 L 223 99 M 30 149 L 14 126"
        className="ssl-swav-branch"
      />
      <path
        d="M 209 114 Q 191 83 215 80 Q 232 94 209 114 M 222 105 Q 225 76 239 88 Q 246 101 222 105"
        className="ssl-swav-leaf"
      />
      <path d="M 94 101 L 36 134 L 50 106 L 88 81 Z" className="ssl-swav-wing" />
      <ellipse
        cx="116"
        cy="89"
        rx="42"
        ry="32"
        transform="rotate(-23 116 89)"
        className="ssl-swav-bird"
      />
      <circle cx="144" cy="49" r="25" className="ssl-swav-bird" />
      <path
        d="M 127 58 Q 153 58 155 82 Q 144 110 120 116 Q 146 86 127 58"
        className="ssl-swav-breast"
      />
      <path d="M 91 78 Q 131 62 127 88 Q 116 108 84 105 Z" className="ssl-swav-wing" />
      <path d="M 167 44 L 189 52 L 166 59 Z" className="ssl-swav-beak" />
      <circle cx="153" cy="43" r="4" className="ssl-swav-eye" />
      <circle cx="154" cy="42" r="1.1" className="ssl-swav-glint" />
      <path
        d="M 113 116 L 114 141 L 104 146 M 114 141 L 124 144 M 133 110 L 137 139 L 129 144 M 137 139 L 147 143"
        className="ssl-swav-feet"
      />
    </g>
  );
}

function Crop({ index, x, y, size }: { index: number; x: number; y: number; size: number }) {
  const crop = crops[index];
  return (
    <g className={`ssl-${crop.tone}`}>
      <svg
        x={x}
        y={y}
        width={size}
        height={size}
        viewBox={`${crop.x} ${crop.y} ${crop.size} ${crop.size}`}
        overflow="hidden"
        aria-hidden="true"
      >
        <BirdScene />
      </svg>
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        className={`ssl-swav-crop${index % 2 ? ' ssl-swav-dashed' : ''}`}
      />
    </g>
  );
}

function SwAVViews() {
  const id = 'ssl-swav-views';
  return (
    <Figure
      id={id}
      title="同一场景，两种观察"
      description="左侧是枝头小鸟的示意图，实线框与虚线框标出两个实际裁剪区域。右侧按相同坐标放大：view 1 保留更多身体、尾部与枝条，view 2 更突出头部、胸部和右侧背景。两份输入来自同一图像，没有提供鸟的类别标签。"
      caption="先看模型的输入：两个框从同一幅示意图裁出不同内容，再缩放到相同输入尺寸。这里只画裁剪；训练还会使用颜色变化等增强。框线样式与右侧 view 对应。"
      height={270}
    >
      <Label x={136} y={25}>
        原图：没有类别标签
      </Label>
      <svg x="16" y="48" width="240" height="180" viewBox="0 0 240 180" aria-hidden="true">
        <BirdScene />
        {crops.slice(0, 2).map((crop, i) => (
          <g key={crop.name} className={`ssl-${crop.tone}`}>
            <rect
              x={crop.x}
              y={crop.y}
              width={crop.size}
              height={crop.size}
              className={`ssl-swav-crop${i ? ' ssl-swav-dashed' : ''}`}
            />
            <text x={crop.x + 8} y={crop.y + 19} className="ssl-swav-crop-number">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <Arrow id={id} d="M 265 138 H 296" />
      {[0, 1].map((i) => (
        <g key={i}>
          <Label x={377 + i * 173} y={25}>{`View ${i + 1}`}</Label>
          <Crop index={i} x={306 + i * 173} y={66} size={142} />
          <Label x={377 + i * 173} y={234} note>
            {i === 0 ? '身体、尾部与枝条' : '头部、胸部与背景'}
          </Label>
        </g>
      ))}
    </Figure>
  );
}

function SwappedAssignments() {
  const id = 'ssl-swap';
  return (
    <Figure
      id={id}
      title="SwAV：先生成两份目标，再交叉监督"
      description="两列分别对应同一张图的 view 1 与 view 2，共享 encoder、projection head 和 prototypes。各列 scores 分为两路：单图 softmax 产生预测 p，整个 batch 的同类 view 经 Sinkhorn 产生目标 q。q1 交叉监督 p2，q2 交叉监督 p1。目标线路停止梯度；loss 经预测线路更新共享模型参数。"
      caption="实线是前向计算；交叉虚线传递固定目标；点线表示梯度经预测分支回传到 scores，再更新共享网络与 prototypes。两列的 Sinkhorn 分别使用 batch 中对应 view 的 scores，图中只展开其中一张图。"
      height={540}
    >
      {[0, 1].map((i) => {
        const offset = i * 330;
        const predictionX = i === 0 ? 24 : 510;
        const targetX = i === 0 ? 178 : 356;
        return (
          <g key={i}>
            <Label x={165 + offset} y={23}>{`View ${i + 1}`}</Label>
            <Crop index={i} x={38 + offset} y={42} size={58} />
            <Box
              x={125 + offset}
              y={45}
              width={183}
              label="Encoder + projection"
              sub="两列共享参数"
            />
            <Arrow id={id} d={`M ${96 + offset} 71 H ${123 + offset}`} />
            <rect
              x={84 + offset}
              y="125"
              width="160"
              height="54"
              rx="5"
              className="ssl-box ssl-blue"
            />
            <MathLabel
              x={84 + offset}
              y={129}
              width={160}
              tex={String.raw`s^{(${i + 1})}=C^\top z^{(${i + 1})}`}
            />
            <Arrow id={id} d={`M ${216 + offset} 97 V 112 H ${164 + offset} V 123`} />
            <Arrow id={id} d={`M ${164 + offset} 179 V 216 H ${predictionX + 62} V 240`} />
            <Arrow id={id} d={`M ${164 + offset} 216 H ${targetX + 62} V 240`} />
            <rect
              x={predictionX}
              y="242"
              width="126"
              height="85"
              rx="5"
              className="ssl-box ssl-blue"
            />
            <Label x={predictionX + 63} y={264}>
              Softmax
            </Label>
            <MathLabel x={predictionX} y={273} width={126} tex={`p^{(${i + 1})}`} />
            <rect x={targetX} y="242" width="126" height="85" rx="5" className="ssl-box ssl-teal" />
            <Label x={targetX + 63} y={263}>
              Batch → Sinkhorn
            </Label>
            <MathLabel x={targetX} y={269} width={126} height={30} tex={`q^{(${i + 1})}`} />
            <Label x={targetX + 63} y={315} note>
              stop-gradient
            </Label>
          </g>
        );
      })}
      <Arrow id={id} d="M 87 327 V 412 M 573 327 V 412" />
      <Arrow id={id} d="M 241 327 L 509 432 M 419 327 L 151 432" update />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect
            x={24 + i * 486}
            y="414"
            width="126"
            height="50"
            rx="5"
            className="ssl-box ssl-clay"
          />
          <MathLabel
            x={24 + i * 486}
            y={418}
            width={126}
            tex={`H(q^{(${2 - i})},p^{(${i + 1})})`}
          />
        </g>
      ))}
      <Arrow
        id={id}
        d="M 87 464 V 484 H 10 V 152 H 82 M 573 464 V 484 H 650 V 152 H 576"
        gradient
      />
      <Label x={330} y={494}>
        交换的是监督目标
      </Label>
      <Label x={330} y={520} note>
        梯度经过预测 p；目标 q 在本次更新中固定
      </Label>
    </Figure>
  );
}

const allocationExamples = [
  {
    title: '全挤进一个 prototype',
    rows: [
      [1, 0],
      [1, 0],
      [1, 0],
      [1, 0],
    ],
    verdict: '列和不均衡',
    tone: 'clay',
  },
  {
    title: '均衡，而且各有偏好',
    rows: [
      [0.9, 0.1],
      [0.8, 0.2],
      [0.2, 0.8],
      [0.1, 0.9],
    ],
    verdict: '满足约束，有区分度',
    tone: 'teal',
  },
  {
    title: '均衡，却人人相同',
    rows: [
      [0.5, 0.5],
      [0.5, 0.5],
      [0.5, 0.5],
      [0.5, 0.5],
    ],
    verdict: '满足约束，仍是退化解',
    tone: 'clay',
  },
] as const;

function SwAVBalance() {
  const transcript = allocationExamples
    .map(
      ({ title, rows, verdict }) =>
        `${title}：各行分别为${rows.map((row) => `(${row.join(', ')})`).join('、')}；列和为${rows[0].map((_, k) => rows.reduce((sum, row) => sum + row[k], 0)).join('、')}。${verdict}。`,
    )
    .join('');
  return (
    <Figure
      id="ssl-swav-balance"
      title="均衡看列和，区分度看各行"
      description={`四张图、两个 prototypes 的三个分配矩阵。${transcript}`}
      caption="每行总质量都为 1，理想列和各为 4 ÷ 2 = 2。填充条长度表示概率大小。中间是满足约束的示例，不是实际 Sinkhorn 迭代输出；最右侧说明均衡本身不足以保证学到有用表征。"
      height={322}
    >
      {allocationExamples.map(({ title, rows, verdict, tone }, n) => {
        const x = 12 + n * 220;
        return (
          <g key={title}>
            <Label x={x + 99} y={25}>
              {title}
            </Label>
            {[0, 1].map((k) => (
              <MathLabel
                key={k}
                x={x + 52 + k * 68}
                y={38}
                width={60}
                height={30}
                tex={`c_${k + 1}`}
              />
            ))}
            {rows.map((row, i) => (
              <g key={i}>
                <Label x={x + 23} y={95 + i * 38} note>{`图 ${i + 1}`}</Label>
                {row.map((value, k) => (
                  <g key={k}>
                    <rect
                      x={x + 52 + k * 68}
                      y={73 + i * 38}
                      width="60"
                      height="32"
                      rx="3"
                      className="ssl-cell"
                    />
                    <rect
                      x={x + 54 + k * 68}
                      y={75 + i * 38}
                      width={56 * value}
                      height="28"
                      rx="2"
                      className="ssl-swav-probability"
                    />
                    <Label x={x + 82 + k * 68} y={95 + i * 38}>
                      {value.toFixed(1)}
                    </Label>
                  </g>
                ))}
              </g>
            ))}
            <path d={`M ${x + 48} 235 H ${x + 183}`} className="ssl-divider" />
            <Label x={x + 23} y={262} note>
              列和
            </Label>
            {[0, 1].map((k) => (
              <Label key={k} x={x + 82 + k * 68} y={262}>
                {rows.reduce((sum, row) => sum + row[k], 0).toFixed(1)}
              </Label>
            ))}
            <g className={`ssl-${tone}`}>
              <rect x={x + 8} y="280" width="186" height="28" rx="4" className="ssl-box" />
              <Label x={x + 101} y={299} note>
                {verdict}
              </Label>
            </g>
          </g>
        );
      })}
    </Figure>
  );
}

function SwAVMultiCrop() {
  return (
    <Figure
      id="ssl-swav-multicrop"
      title="Multi-crop：哪些 view 产生目标，哪些 view 做预测？"
      description="同一鸟图产生两个 global crops，以及聚焦头部和身体的两个 local crops。目标 q1 来自 global 1，监督 global 2、local 1、local 2；目标 q2 来自 global 2，监督 global 1、local 1、local 2。跳过自己预测自己的两格。Local crops 不生成 assignment。"
      caption="上方框线标出两个 local crops 在原场景中的位置；下方矩阵逐格列出监督关系。每个有圆点的格子是一项 cross-entropy：该列的预测学习该行的 global target。"
      height={417}
    >
      <svg x="22" y="17" width="180" height="135" viewBox="0 0 240 180" aria-hidden="true">
        <BirdScene />
        {crops.slice(2).map((crop, i) => (
          <g key={crop.name} className="ssl-clay">
            <rect
              x={crop.x}
              y={crop.y}
              width={crop.size}
              height={crop.size}
              className={`ssl-swav-crop${i ? ' ssl-swav-dashed' : ''}`}
            />
            <text
              x={crop.x + 5}
              y={crop.y + 17}
              className="ssl-swav-crop-number"
            >{`L${i + 1}`}</text>
          </g>
        ))}
      </svg>
      <Label x={420} y={48}>
        同一图像 → 2 global + 多个 local
      </Label>
      <Label x={420} y={79} note>
        Global：产生目标，也参与预测
      </Label>
      <Label x={420} y={103} note>
        Local：分辨率更低，只参与预测
      </Label>
      {crops.map((crop, i) => (
        <g key={crop.name}>
          <Crop
            index={i}
            x={190 + i * 116 + (i > 1 ? 15 : 0)}
            y={168 + (i > 1 ? 15 : 0)}
            size={i > 1 ? 54 : 84}
          />
          <Label x={232 + i * 116} y={276} note>
            {crop.name}
          </Label>
        </g>
      ))}
      {[0, 1].map((target) => (
        <g key={target}>
          <MathLabel x={12} y={296 + target * 56} width={55} tex={`q^{(${target + 1})}`} />
          <Label x={114} y={321 + target * 56} note>{`← Global ${target + 1}`}</Label>
          {crops.map((crop, view) => {
            const included = view !== target;
            return (
              <g key={crop.name}>
                <rect
                  x={190 + view * 116}
                  y={296 + target * 56}
                  width="84"
                  height="42"
                  rx="4"
                  className={included ? 'ssl-visible' : 'ssl-excluded'}
                />
                {included ? (
                  <>
                    <circle
                      cx={207 + view * 116}
                      cy={317 + target * 56}
                      r="3"
                      className="ssl-swav-dot"
                    />
                    <Label x={240 + view * 116} y={322 + target * 56} note>
                      预测
                    </Label>
                  </>
                ) : (
                  <Label x={232 + view * 116} y={322 + target * 56} note>
                    跳过自身
                  </Label>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </Figure>
  );
}

export const POST_COMPONENTS = { SwAVViews, SwappedAssignments, SwAVBalance, SwAVMultiCrop };
