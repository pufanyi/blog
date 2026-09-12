interface SequenceNode {
  index: number;
  value: number;
  fa: number;
  ffa: number;
}

const sequence = [2, 1, 3, 3, 3, 3, 1, 3, 1, 1];
const nodes: SequenceNode[] = [];
const lastOccurrence = new Map<number, SequenceNode>();

// Derive both pointers from the original example using the recurrence in the post.
for (const [offset, value] of sequence.entries()) {
  const index = offset + 1;
  const previous = lastOccurrence.get(value);
  const fa = previous?.index ?? 0;
  const beforePrevious = previous?.fa ?? 0;
  const ffa = index - fa === fa - beforePrevious ? (previous?.ffa ?? 0) : beforePrevious;
  const node = { index, value, fa, ffa };
  nodes.push(node);
  lastOccurrence.set(value, node);
}

type Pointer = 'fa' | 'ffa';

const columnX = (index: number): number => 104 + (index - 1) * 72;
const describePointers = (pointer: Pointer): string =>
  nodes
    .filter((node) => node[pointer] !== 0)
    .map((node) => `${node.index} 指向 ${node[pointer]}`)
    .join('，');

function PointerArrows({ pointer }: { pointer: Pointer }) {
  const baseline = pointer === 'fa' ? 142 : 214;
  const direction = pointer === 'fa' ? -1 : 1;

  return (
    <g className={`cf351d-pointers-${pointer}`}>
      {nodes
        .filter((node) => node[pointer] !== 0)
        .map((node) => {
          const target = node[pointer];
          // Separate incoming and outgoing ports so adjacent arrowheads remain distinct.
          const fromX = columnX(node.index) - 8;
          const toX = columnX(target) + 8;
          const rise = 18 + (node.index - target) * 15;
          const controlY = baseline + (direction * rise * 4) / 3;
          const path = `M ${fromX} ${baseline} C ${fromX} ${controlY}, ${toX} ${controlY}, ${toX} ${baseline}`;

          return (
            <g key={node.index}>
              <path d={path} className="cf351d-pointers-halo" />
              <path
                d={path}
                className="cf351d-pointers-edge"
                markerEnd={`url(#cf351d-pointers-${pointer}-arrow)`}
              />
              <circle cx={fromX} cy={baseline} r="2.5" className="cf351d-pointers-origin" />
            </g>
          );
        })}
    </g>
  );
}

function FaFfaDiagram() {
  return (
    <figure className="cf351d-pointers-shell">
      <div
        className="cf351d-pointers-scroll"
        role="region"
        aria-label="fa 与 ffa 的关系图，可横向滚动"
        tabIndex={0}
      >
        <svg
          className="cf351d-pointers-diagram"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 360"
          width="800"
          height="360"
          role="img"
          aria-labelledby="cf351d-pointers-title cf351d-pointers-desc"
        >
          <title id="cf351d-pointers-title">fa 与 ffa 的指向关系</title>
          <desc id="cf351d-pointers-desc">
            {`序列为 ${sequence.join('、')}。每列上方是数值 a[i]，下方是从 1 开始的位置 i。上方实线由 i 指向 fa[i]：${describePointers('fa')}。下方红色虚线由 i 指向 ffa[i]：${describePointers('ffa')}。指向 0 的边不绘制。`}
          </desc>
          <defs>
            {(['fa', 'ffa'] as const).map((pointer) => (
              <marker
                key={pointer}
                id={`cf351d-pointers-${pointer}-arrow`}
                className={`cf351d-pointers-${pointer}`}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="8"
                markerHeight="8"
                markerUnits="userSpaceOnUse"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 L 2 4 Z" className="cf351d-pointers-arrowhead" />
              </marker>
            ))}
          </defs>
          <g className="cf351d-pointers-fa">
            <text x="24" y="38" className="cf351d-pointers-label">
              fa[i]
            </text>
            <text x="24" y="59" className="cf351d-pointers-note">
              上一次出现
            </text>
          </g>
          <g className="cf351d-pointers-ffa">
            <text x="24" y="266" className="cf351d-pointers-label">
              ffa[i]
            </text>
            <text x="24" y="287" className="cf351d-pointers-note">
              非等距边界
            </text>
          </g>
          <PointerArrows pointer="fa" />
          <PointerArrows pointer="ffa" />
          <text x="24" y="170" className="cf351d-pointers-row-label">
            a[i]
          </text>
          <text x="24" y="198" className="cf351d-pointers-row-label">
            i
          </text>
          {nodes.map((node) => {
            const x = columnX(node.index);
            return (
              <g key={node.index}>
                <rect
                  x={x - 26}
                  y="146"
                  width="52"
                  height="64"
                  rx="5"
                  className="cf351d-pointers-cell"
                />
                <line
                  x1={x - 26}
                  y1="182"
                  x2={x + 26}
                  y2="182"
                  className="cf351d-pointers-divider"
                />
                <text x={x} y="170" className="cf351d-pointers-value">
                  {node.value}
                </text>
                <text x={x} y="201" className="cf351d-pointers-index">
                  {node.index}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption>
        fa 与 ffa 的指向关系
        <span className="cf351d-pointers-scroll-hint">（左右滑动查看完整图示）</span>
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { FaFfaDiagram };
