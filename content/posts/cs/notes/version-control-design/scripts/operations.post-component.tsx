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
          title="沿旧提交找回文章"
          height={390}
          description="HEAD~1 选中上一次提交，从它的 tree 中查找 article.md，得到 blob 156b3ea，再读取旧正文。无需修改工作目录。"
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
            article.md → 156b3ea
          </text>
          <text x="40" y="197" className="vcs-filename">
            style.css → 7338e12
          </text>
          <path d="M180 214V257" className="vcs-object-edge" markerEnd="url(#vcs-read-arrow)" />
          <text x="194" y="242">
            读取选中的 blob
          </text>
          <path d="M45 265H290L315 290V374H45Z" className="vcs-page" />
          <path d="M290 265V290H315" className="vcs-object-edge" />
          <text x="65" y="295" className="vcs-filename">
            156b3ea
          </text>
          <text x="65" y="327" className="vcs-filename">
            # Version Control
          </text>
          <text x="65" y="355">
            修改文章后，提交保存。
          </text>
        </Diagram>
      </div>
      <figcaption>
        选定版本 → 按文件名找到内容 ID → 读出旧正文。绿色条目是这次查找走过的路径。
      </figcaption>
    </figure>
  );
}

const selections = [
  {
    title: '① 工作目录',
    subtitle: '正文改好，样式仍在试验',
    article: '新正文',
    style: '试验中的样式',
    pending: true,
  },
  {
    title: '② 暂存区',
    subtitle: 'git add article.md',
    article: '新正文',
    style: '原样式',
    pending: false,
  },
  {
    title: '③ 新提交的文件状态',
    subtitle: 'git commit',
    article: '新正文',
    style: '原样式',
    pending: false,
  },
] as const;

function StagingSelectionFigure() {
  return (
    <figure className="vcs-figure">
      <div className="vcs-operation vcs-staging">
        {selections.map(({ title, subtitle, article, style, pending }, index) => (
          <Diagram
            key={title}
            id={`vcs-selection-${index}`}
            title={title}
            height={240}
            description={`${subtitle}：article.md 是${article}，style.css 是${style}。`}
          >
            <text x="180" y="27" textAnchor="middle" className="vcs-heading">
              {title}
            </text>
            <text x="180" y="54" textAnchor="middle" className="vcs-filename">
              {subtitle}
            </text>
            <rect
              x="18"
              y="72"
              width="324"
              height="64"
              rx="6"
              className="vcs-opening vcs-changed"
            />
            <text x="35" y="97" className="vcs-filename">
              article.md
            </text>
            <text x="35" y="121">
              {article}
            </text>
            <rect
              x="18"
              y="150"
              width="324"
              height="64"
              rx="6"
              className={pending ? 'vcs-pending' : 'vcs-opening'}
            />
            <text x="35" y="175" className="vcs-filename">
              style.css
            </text>
            <text x="35" y="199">
              {style}
            </text>
          </Diagram>
        ))}
      </div>
      <figcaption>
        只暂存正文：新提交采用“新正文 + 原样式”。虚线框里的样式试验仍留在工作目录中。
      </figcaption>
    </figure>
  );
}

const pieces = [
  { label: '标题', changed: false },
  { label: '开头', changed: true },
  { label: '其余正文', changed: false },
] as const;

function DeltaStorageFigure() {
  return (
    <figure className="vcs-figure">
      <div className="vcs-operation vcs-delta">
        <Diagram
          id="vcs-delta"
          title="从基准和重建指令还原完整内容"
          height={430}
          description="示意：以旧正文为基准，复制标题，写入新开头，复制其余正文，重建新正文。此图说明 delta 的作用，不代表本例 Git 实际选择的编码或基准方向。"
        >
          <text x="20" y="25" className="vcs-heading">
            基准：旧正文
          </text>
          {pieces.map(({ label, changed }, i) => (
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
                {changed ? '旧开头' : label}
              </text>
            </g>
          ))}
          <path d="M180 92V133" className="vcs-object-edge" markerEnd="url(#vcs-delta-arrow)" />
          <rect x="20" y="140" width="320" height="140" rx="8" className="vcs-page" />
          <text x="40" y="168" className="vcs-heading">
            重建指令（示意）
          </text>
          <text x="40" y="198">
            ① 从基准复制标题
          </text>
          <text x="40" y="228" className="vcs-emphasis">
            ② 写入新开头
          </text>
          <text x="40" y="258">
            ③ 从基准复制其余正文
          </text>
          <path d="M180 280V321" className="vcs-object-edge" markerEnd="url(#vcs-delta-arrow)" />
          <text x="20" y="345" className="vcs-heading">
            重建结果：完整的新正文
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
                {changed ? '新开头' : label}
              </text>
            </g>
          ))}
        </Diagram>
      </div>
      <figcaption>
        delta
        可以复用相似内容中的一部分。这里按段落画出重建思路；实际编码处理字节，基准选择也不受提交先后顺序限制。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { ReadVersionFigure, StagingSelectionFigure, DeltaStorageFigure };
