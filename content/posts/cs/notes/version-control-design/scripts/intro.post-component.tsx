import type { ReactNode } from 'react';

function Figure({
  id,
  title,
  description,
  height,
  children,
  caption,
}: {
  id: string;
  title: string;
  description: string;
  height: number;
  children: ReactNode;
  caption: string;
}) {
  return (
    <figure className="vcs-figure">
      <div className="vcs-scroll">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 720 ${height}`}
          width="720"
          height={height}
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

const photos = [
  { name: 'mountain.avif', date: '2026-09-01', type: 'mountain' },
  { name: 'sea.avif', date: '2026-10-01', type: 'sea' },
] as const;

function Photo({ index, x, y }: { index: number; x: number; y: number }) {
  const photo = photos[index];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="146" height="100" rx="8" className="vcs-photo" />
      {photo.type === 'mountain' ? (
        <path d="M12 62L48 18L76 52L100 30L134 62Z" className="vcs-land" />
      ) : (
        <>
          <circle cx="108" cy="24" r="10" className="vcs-sun" />
          <path
            d="M12 44Q28 32 44 44T76 44T108 44T134 44M12 60Q28 48 44 60T76 60T108 60T134 60"
            className="vcs-water"
          />
        </>
      )}
      <text x="73" y="86" textAnchor="middle" className="vcs-small">
        {photo.date}
      </text>
      <text x="73" y="122" textAnchor="middle" className="vcs-code">
        {photo.name}
      </text>
    </g>
  );
}

function GalleryOrderFigure() {
  return (
    <Figure
      id="vcs-order"
      title="同两张照片，展示顺序改变"
      height={250}
      description="修改前按拍摄时间升序，先山景后海景；修改后按拍摄时间降序，先海景后山景。图片文件及其拍摄时间没有改变。"
      caption="改动的是展示顺序：同两张照片，修改前山景在前，修改后海景在前。图片与拍摄时间数据保持不变。"
    >
      {[
        { x: 20, title: '修改前 · 最早在前', order: [0, 1] },
        { x: 380, title: '修改后 · 最近在前', order: [1, 0] },
      ].map((panel) => (
        <g key={panel.title}>
          <text x={panel.x} y="32" className="vcs-heading">
            {panel.title}
          </text>
          {panel.order.map((index, position) => (
            <Photo key={index} index={index} x={panel.x + position * 164} y={56} />
          ))}
          <text x={panel.x + 155} y="218" textAnchor="middle" className="vcs-small">
            {panel.order.map((index) => photos[index].date).join(' → ')}
          </text>
        </g>
      ))}
      <path d="M358 20V230" className="vcs-divider" />
    </Figure>
  );
}

const versions = [
  { label: '最早在前', detail: '原排序', tone: 'base' },
  { label: '最近在前', detail: '改了排序', tone: 'sort' },
  { label: '最近在前 ＋ 注释', detail: '改了排序并补注释', tone: 'note' },
] as const;
const stages = [
  { label: '① 修改排序', values: [1, 0, 0] },
  { label: '② git add', values: [1, 1, 0] },
  { label: '③ 再补注释', values: [2, 1, 0] },
  { label: '④ add 后 commit', values: [2, 2, 2] },
] as const;

function IndexStatesFigure() {
  const description = stages
    .map(
      (stage) =>
        `${stage.label}：${['工作目录', '暂存区', '当前提交'].map((place, i) => `${place}为${versions[stage.values[i]].detail}`).join('，')}。`,
    )
    .join('');
  return (
    <Figure
      id="vcs-index"
      title="修改、暂存与提交分别更新哪些状态"
      height={418}
      description={description}
      caption="只追踪 src/gallery.ts。第③步，git diff 比较暂存区与工作目录，只显示注释；git diff --cached 比较当前提交与暂存区，只显示排序修改。第④步先再次暂存，再提交，三处内容一致。"
    >
      <text x="20" y="30" className="vcs-code">
        src/gallery.ts
      </text>
      {['工作目录', '暂存区 · index', '当前提交 · HEAD'].map((label, i) => (
        <text key={label} x={264 + i * 174} y="65" textAnchor="middle" className="vcs-heading">
          {label}
        </text>
      ))}
      {stages.map((stage, row) => (
        <g key={stage.label}>
          {row === 2 ? (
            <rect x="10" y={row * 66 + 76} width="700" height="62" rx="8" className="vcs-focus" />
          ) : null}
          <text x="20" y={row * 66 + 113} className="vcs-small">
            {stage.label}
          </text>
          {stage.values.map((value, column) => (
            <g key={`${stage.label}-${column}`}>
              <rect
                x={184 + column * 174}
                y={row * 66 + 86}
                width="160"
                height="42"
                rx="6"
                className={`vcs-state vcs-${versions[value].tone}`}
              />
              <text
                x={264 + column * 174}
                y={row * 66 + 112}
                textAnchor="middle"
                className="vcs-small"
              >
                {versions[value].label}
              </text>
            </g>
          ))}
        </g>
      ))}
      <path d="M264 352V365H438V352M438 365V385H612V352" className="vcs-bracket" />
      <text x="351" y="349" textAnchor="middle" className="vcs-code">
        git diff
      </text>
      <text x="525" y="408" textAnchor="middle" className="vcs-code">
        git diff --cached
      </text>
    </Figure>
  );
}

function Commit({
  x,
  y,
  label,
  changed = false,
}: {
  x: number;
  y: number;
  label: string;
  changed?: boolean;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r="22" className={`vcs-state ${changed ? 'vcs-note' : 'vcs-base'}`} />
      <text x={x} y={y + 5} textAnchor="middle" className="vcs-code">
        {label}
      </text>
    </g>
  );
}

function PublishFigure() {
  return (
    <Figure
      id="vcs-publish"
      title="推送共享了提交，PR 尚未合并分支"
      height={352}
      description="推送成功后，本地与 GitHub 仓库都有 C0 和新提交 C1，C1 的父提交是 C0。两边 main 都仍指向 C0，newest-first 指向 C1。GitHub 上的 PR 以 main 为 base、newest-first 为 head，评审与检查之后才决定是否合入。"
      caption="这是 push 成功、PR 尚未合并时的状态；假设期间 main 没有其他更新。C0、C1 是示意名称，连线表示 C1 的父提交是 C0。push 不会把 newest-first 合入 main。"
    >
      <defs>
        <marker
          id="vcs-push-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10Z" className="vcs-arrow-head" />
        </marker>
      </defs>
      {[
        { x: 16, name: '本地 Git 仓库' },
        { x: 410, name: 'GitHub 上的 Git 仓库' },
      ].map(({ x, name }) => (
        <g key={name}>
          <rect x={x} y="16" width="294" height="180" rx="10" className="vcs-panel" />
          <text x={x + 16} y="46" className="vcs-heading">
            {name}
          </text>
          <text x={x + 60} y="85" textAnchor="middle" className="vcs-code">
            main
          </text>
          <text x={x + 210} y="85" textAnchor="middle" className="vcs-code">
            newest-first
          </text>
          <path
            d={`M${x + 60} 92V110M${x + 210} 92V110M${x + 82} 136H${x + 188}`}
            className="vcs-edge"
          />
          <Commit x={x + 60} y={136} label="C0" />
          <Commit x={x + 210} y={136} label="C1" changed />
          <text x={x + 135} y="178" textAnchor="middle" className="vcs-small">
            C1 的 parent 是 C0
          </text>
        </g>
      ))}
      <path d="M318 130H401" className="vcs-edge" markerEnd="url(#vcs-push-arrow)" />
      <text x="360" y="112" textAnchor="middle" className="vcs-code">
        push
      </text>
      <text x="360" y="157" textAnchor="middle" className="vcs-small">
        共享版本
      </text>
      <path d="M470 196V224M620 196V224" className="vcs-comparison" />
      <rect x="410" y="224" width="294" height="106" rx="10" className="vcs-review" />
      <text x="426" y="251" className="vcs-heading">
        GitHub PR · 协作记录
      </text>
      <text x="426" y="279" className="vcs-code">
        base: main / head: newest-first
      </text>
      <text x="426" y="308" className="vcs-small">
        查看差异 → 讨论与检查 → 决定是否合入
      </text>
      <text x="20" y="255" className="vcs-small">
        创建 C1：本地保存版本
      </text>
      <text x="20" y="284" className="vcs-small">
        推送 C1：让远端也能访问
      </text>
      <text x="20" y="313" className="vcs-small">
        创建 PR：组织评审，不产生合并
      </text>
    </Figure>
  );
}

export const POST_COMPONENTS = { GalleryOrderFigure, IndexStatesFigure, PublishFigure };
