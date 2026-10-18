import type { ReactNode } from 'react';

function Graph({
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
    <figure className="vcs-figure">
      <div className="vcs-graph">
        <svg
          viewBox={`0 0 520 ${height}`}
          width="520"
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
      </div>
      <figcaption>{description}</figcaption>
    </figure>
  );
}

function Commit({
  name,
  x,
  y,
  merge = false,
}: {
  name: string;
  x: number;
  y: number;
  merge?: boolean;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r="22" className={merge ? 'vcs-changed' : 'vcs-page'} />
      <text x={x} y={y} dy="0.35em" textAnchor="middle" className="vcs-graph-id">
        {name}
      </text>
    </g>
  );
}

function CommitHistoryFigure() {
  return (
    <Graph
      id="vcs-history"
      title="分叉与合并的提交图"
      height={200}
      description="箭头从提交指向父提交。C、D 共享父提交 B；M 有两个父提交 C 和 D。"
    >
      <g className="vcs-object-edge" markerEnd="url(#vcs-history-arrow)">
        <path d="M158 100H82" />
        <path d="M278 50H240Q220 50 207 72L194 81" />
        <path d="M278 150H240Q220 150 207 128L194 119" />
        <path d="M441 81L418 58Q410 50 395 50H322" />
        <path d="M441 119L418 142Q410 150 395 150H322" />
      </g>
      <Commit name="A" x={60} y={100} />
      <Commit name="B" x={180} y={100} />
      <Commit name="C" x={300} y={50} />
      <Commit name="D" x={300} y={150} />
      <Commit name="M" x={460} y={100} merge />
    </Graph>
  );
}

function LinearHistoryFigure() {
  return (
    <Graph
      id="vcs-linear"
      title="顺序提交"
      height={90}
      description="C 的父提交是 B，B 的父提交是 A；A 没有父提交。"
    >
      <g className="vcs-object-edge" markerEnd="url(#vcs-linear-arrow)">
        <path d="M238 45H142" />
        <path d="M378 45H282" />
      </g>
      <Commit name="A" x={120} y={45} />
      <Commit name="B" x={260} y={45} />
      <Commit name="C" x={400} y={45} />
    </Graph>
  );
}

function DirectoryTreeFigure() {
  return (
    <Graph
      id="vcs-directory"
      title="目录条目引用文件内容"
      height={180}
      description="文件名 article.md、style.css 属于 tree 的条目，分别引用保存正文和样式内容的 blob。"
    >
      <rect x="20" y="20" width="210" height="140" rx="8" className="vcs-page" />
      <text x="40" y="48" className="vcs-heading">
        根 tree
      </text>
      <text x="40" y="89" className="vcs-graph-id">
        article.md
      </text>
      <text x="40" y="139" className="vcs-graph-id">
        style.css
      </text>
      <g className="vcs-object-edge" markerEnd="url(#vcs-directory-arrow)">
        <path d="M190 84H320" />
        <path d="M190 134H320" />
      </g>
      <rect x="325" y="64" width="175" height="40" rx="6" className="vcs-opening" />
      <rect x="325" y="114" width="175" height="40" rx="6" className="vcs-opening" />
      <text x="412" y="89" textAnchor="middle">
        正文 blob
      </text>
      <text x="412" y="139" textAnchor="middle">
        样式 blob
      </text>
    </Graph>
  );
}

function BranchReferenceFigure() {
  return (
    <Graph
      id="vcs-refs"
      title="HEAD、分支引用与提交"
      height={165}
      description="HEAD 指向分支 main，main 指向提交 C。虚线是可更新的引用，实线是 commit 中记录的 parent。"
    >
      <rect x="20" y="55" width="100" height="50" rx="6" className="vcs-opening" />
      <rect x="180" y="55" width="100" height="50" rx="6" className="vcs-opening" />
      <text x="70" y="85" textAnchor="middle" className="vcs-graph-id">
        HEAD
      </text>
      <text x="230" y="85" textAnchor="middle" className="vcs-graph-id">
        main
      </text>
      <g className="vcs-object-parent" markerEnd="url(#vcs-refs-arrow)">
        <path d="M120 80H180" />
        <path d="M280 80H338" />
      </g>
      <path d="M382 80H448" className="vcs-object-edge" markerEnd="url(#vcs-refs-arrow)" />
      <text x="415" y="55" textAnchor="middle">
        parent
      </text>
      <Commit name="C" x={360} y={80} />
      <Commit name="B" x={470} y={80} />
      <text x="230" y="135" textAnchor="middle">
        分支引用
      </text>
      <text x="415" y="135" textAnchor="middle">
        commit 对象
      </text>
    </Graph>
  );
}

export const POST_COMPONENTS = {
  DirectoryTreeFigure,
  LinearHistoryFigure,
  CommitHistoryFigure,
  BranchReferenceFigure,
};
