const snapshots = [
  { commit: '上一次 commit', tree: '旧 tree', article: '旧正文 blob', y: 35 },
  { commit: '这一次 commit', tree: '新 tree', article: '新正文 blob', y: 265 },
] as const;

function SnapshotObjectsFigure() {
  return (
    <figure className="vcs-figure">
      <div className="vcs-object-scroll">
        <svg
          viewBox="0 0 720 420"
          width="720"
          height="420"
          role="img"
          aria-labelledby="vcs-objects-title vcs-objects-desc"
        >
          <title id="vcs-objects-title">两次提交共享未变化的样式内容</title>
          <desc id="vcs-objects-desc">
            每个 commit 指向自己的根 tree。旧 tree 的 article.md 指向旧正文 blob，新 tree 的
            article.md 指向新正文 blob；两棵 tree 的 style.css 都指向同一个样式 blob。新 commit
            另有一条 parent 引用指向旧 commit。实线表示查找文件状态，虚线表示历史关系。
          </desc>
          <defs>
            <marker
              id="vcs-object-arrow"
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
          {snapshots.map(({ commit, tree, article, y }) => (
            <g key={commit}>
              <rect x="15" y={y + 30} width="160" height="62" rx="8" className="vcs-page" />
              <text x="95" y={y + 66} textAnchor="middle" className="vcs-heading">
                {commit}
              </text>
              <path
                d={`M175 ${y + 61}H265`}
                className="vcs-object-edge"
                markerEnd="url(#vcs-object-arrow)"
              />
              <text x="220" y={y + 49} textAnchor="middle">
                tree
              </text>
              <rect x="270" y={y} width="190" height="126" rx="8" className="vcs-page" />
              <text x="290" y={y + 27} className="vcs-heading">
                {tree}
              </text>
              <text x="290" y={y + 66} className="vcs-filename">
                article.md
              </text>
              <text x="290" y={y + 104} className="vcs-filename">
                style.css
              </text>
              <path
                d={`M460 ${y + 61}H535`}
                className="vcs-object-edge"
                markerEnd="url(#vcs-object-arrow)"
              />
              <rect x="540" y={y + 30} width="165" height="62" rx="8" className="vcs-opening" />
              <text x="622" y={y + 66} textAnchor="middle">
                {article}
              </text>
            </g>
          ))}
          <path d="M95 295V132" className="vcs-object-parent" markerEnd="url(#vcs-object-arrow)" />
          <text x="108" y="218">
            parent
          </text>
          <path
            d="M460 134H490V200H535M460 364H510V228H535"
            className="vcs-object-edge"
            markerEnd="url(#vcs-object-arrow)"
          />
          <rect
            x="540"
            y="179"
            width="165"
            height="70"
            rx="8"
            className="vcs-opening vcs-changed"
          />
          <text x="622" y="207" textAnchor="middle">
            同一份样式 blob
          </text>
          <text x="622" y="231" textAnchor="middle" className="vcs-filename">
            7338e12
          </text>
        </svg>
      </div>
      <figcaption>
        每条实线都表示对象引用：正文变了，新 tree 改为引用新正文；样式没变，两棵 tree 共用同一个
        blob。虚线 parent 连接提交历史，与查找文件的路径分开。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { SnapshotObjectsFigure };
