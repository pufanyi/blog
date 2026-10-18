import type { ReactNode } from 'react';

function Diagram({
  id,
  title,
  description,
  height,
  children,
}: {
  id: string;
  title: string;
  description: string;
  height: number;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 360 ${height}`}
      width="360"
      height={height}
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
    >
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{description}</desc>
      <defs>
        <marker
          id={`${id}-arrow`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10Z" className="vcs-object-arrow" />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

function ReadVersionFigure() {
  return (
    <figure className="vcs-figure">
      <div className="vcs-operation vcs-read">
        <Diagram
          id="vcs-read"
          title="沿旧提交读取 baz.txt"
          height={390}
          description="HEAD~1 选中上一次提交，从它的 tree 中查找 baz.txt，得到 blob 4448adb，再读取旧内容。无需修改工作目录。"
        >
          <rect x="45" y="10" width="270" height="58" rx="8" className="vcs-page" />
          <text x="180" y="34" textAnchor="middle" className="vcs-filename">
            HEAD~1
          </text>
          <text x="180" y="55" textAnchor="middle">
            上一次 commit
          </text>
          <path d="M180 68V108" className="vcs-object-edge" markerEnd="url(#vcs-read-arrow)" />
          <text x="194" y="94" className="vcs-filename">
            tree
          </text>
          <rect x="20" y="114" width="320" height="100" rx="8" className="vcs-page" />
          <text x="40" y="140" className="vcs-heading">
            旧目录清单
          </text>
          <rect x="30" y="151" width="300" height="26" rx="3" className="vcs-opening vcs-changed" />
          <text x="40" y="170" className="vcs-filename">
            baz.txt → 4448adb
          </text>
          <text x="40" y="197" className="vcs-filename">
            foo → c68d233
          </text>
          <path d="M180 214V257" className="vcs-object-edge" markerEnd="url(#vcs-read-arrow)" />
          <text x="194" y="242">
            读取选中的 blob
          </text>
          <path d="M45 265H290L315 290V374H45Z" className="vcs-page" />
          <path d="M290 265V290H315" className="vcs-object-edge" />
          <text x="65" y="295" className="vcs-filename">
            4448adb
          </text>
          <text x="65" y="327" className="vcs-filename">
            git is wonderful
          </text>
          <text x="65" y="355">
            末尾有一个换行符
          </text>
        </Diagram>
      </div>
      <figcaption>
        选定版本 → 按文件名找到内容 ID → 读出旧内容。绿色条目是这次查找走过的路径。
      </figcaption>
    </figure>
  );
}

const selections = [
  { title: '工作目录', subtitle: '修复 + 调试输出', debug: true },
  { title: '暂存区', subtitle: '只选入修复', debug: false },
  { title: '新提交', subtitle: '保存暂存区的内容', debug: false },
] as const;

function StagingSelectionFigure() {
  return (
    <figure className="vcs-figure">
      <div className="vcs-operation vcs-staging">
        {selections.map(({ title, subtitle, debug }, index) => (
          <Diagram
            key={title}
            id={`vcs-selection-${index}`}
            title={title}
            height={230}
            description={`${subtitle}：add.py 返回 a + b${debug ? '，并打印 a、b' : '，没有调试输出'}。`}
          >
            <text x="180" y="27" textAnchor="middle" className="vcs-heading">
              {title}
            </text>
            <text x="180" y="54" textAnchor="middle">
              {subtitle}
            </text>
            <rect x="15" y="75" width="330" height="140" rx="8" className="vcs-page" />
            <text x="30" y="100" className="vcs-heading">
              add.py
            </text>
            <text x="30" y="132" className="vcs-filename">
              def add(a, b):
            </text>
            {debug && (
              <g>
                <rect x="45" y="142" width="275" height="27" rx="3" className="vcs-pending" />
                <text x="55" y="161" className="vcs-filename">
                  print(a, b)
                </text>
              </g>
            )}
            <rect
              x="45"
              y={debug ? 176 : 142}
              width="275"
              height="27"
              rx="3"
              className="vcs-opening vcs-changed"
            />
            <text x="55" y={debug ? 195 : 161} className="vcs-filename">
              return a + b
            </text>
          </Diagram>
        ))}
      </div>
      <figcaption>
        原提交中是 return a - b。新提交保存加法修复；虚线框中的 print(a, b) 只留在工作目录里。
      </figcaption>
    </figure>
  );
}

const pieces = [
  { label: 'git is␣', changed: false },
  { label: 'wonderful', changed: true },
  { label: '换行', changed: false },
] as const;

function DeltaStorageFigure() {
  return (
    <figure className="vcs-figure">
      <div className="vcs-operation vcs-delta">
        <Diagram
          id="vcs-delta"
          title="从基准和重建指令还原完整内容"
          height={430}
          description="示意：以旧内容为基准，复制前缀，写入 great，复制换行，重建新内容。此图说明 delta 的作用，不代表本例 Git 实际选择的编码或基准方向。"
        >
          <text x="20" y="25" className="vcs-heading">
            基准：旧内容
          </text>
          {pieces.map(({ label }, i) => (
            <g key={label}>
              <rect
                x={20 + i * 108}
                y="40"
                width="104"
                height="52"
                rx="4"
                className="vcs-opening"
              />
              <text x={72 + i * 108} y="72" textAnchor="middle">
                {label}
              </text>
            </g>
          ))}
          <path d="M180 92V133" className="vcs-object-edge" markerEnd="url(#vcs-delta-arrow)" />
          <rect x="20" y="140" width="320" height="140" rx="8" className="vcs-page" />
          <text x="40" y="168" className="vcs-heading">
            重建指令（示意）
          </text>
          <text x="40" y="198">
            ① 复制前 7 bytes：git is + 空格
          </text>
          <text x="40" y="228" className="vcs-emphasis">
            ② 写入 5 bytes：great
          </text>
          <text x="40" y="258">
            ③ 复制末尾的换行符
          </text>
          <path d="M180 280V321" className="vcs-object-edge" markerEnd="url(#vcs-delta-arrow)" />
          <text x="20" y="345" className="vcs-heading">
            重建结果：完整的新内容
          </text>
          {pieces.map(({ label, changed }, i) => (
            <g key={label}>
              <rect
                x={20 + i * 108}
                y="360"
                width="104"
                height="52"
                rx="4"
                className={changed ? 'vcs-opening vcs-changed' : 'vcs-opening'}
              />
              <text x={72 + i * 108} y="392" textAnchor="middle">
                {changed ? 'great' : label}
              </text>
            </g>
          ))}
        </Diagram>
      </div>
      <figcaption>
        delta 可以复用相似内容中的一部分。这里仅示意字节复用，不表示 Git 会对这个短文件采用 delta。␣
        表示空格；基准选择不受提交先后顺序限制。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { ReadVersionFigure, StagingSelectionFigure, DeltaStorageFigure };
