type Pt = readonly [number, number];

interface AffineTransform {
  tx: number;
  ty: number;
  angleDeg: number;
  scale: number;
}

// 2D affine matrix stored as [a, b, c, d, tx, ty] mapping [x, y] -> [a*x + c*y + tx, b*x + d*y + ty].
type Mat2D = readonly [number, number, number, number, number, number];

function toMatrix({ tx, ty, angleDeg, scale }: AffineTransform): Mat2D {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad) * scale;
  const sin = Math.sin(rad) * scale;
  return [cos, sin, -sin, cos, tx, ty];
}

function compose(m1: Mat2D, m2: Mat2D): Mat2D {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function apply(m: Mat2D, [x, y]: Pt): Pt {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

const fmt = ([x, y]: Pt) => `${x.toFixed(1)} ${y.toFixed(1)}`;

interface DagNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  role: 'world' | 'neutral' | 'path2' | 'shared' | 'shared-part';
}

const nodes: readonly DagNode[] = [
  { id: 'world', label: 'World', x: 222, y: 42, width: 84, height: 38, role: 'world' },
  { id: 'tree', label: 'Tree', x: 76, y: 124, width: 76, height: 38, role: 'neutral' },
  { id: 'hill', label: 'Hill', x: 368, y: 124, width: 76, height: 38, role: 'path2' },
  { id: 'dandelion', label: 'Dandelion', x: 222, y: 202, width: 108, height: 40, role: 'shared' },
  { id: 'stem', label: 'Stem', x: 164, y: 276, width: 76, height: 34, role: 'shared-part' },
  { id: 'head', label: 'Head', x: 280, y: 276, width: 76, height: 34, role: 'shared-part' },
];

const byId = new Map(nodes.map((node) => [node.id, node]));

interface DagEdge {
  id: string;
  d: string;
  role: 'neutral' | 'path1' | 'path2' | 'shared';
  marker: string;
}

const worldNode = byId.get('world')!;
const treeNode = byId.get('tree')!;
const hillNode = byId.get('hill')!;
const dandelionNode = byId.get('dandelion')!;
const stemNode = byId.get('stem')!;
const headNode = byId.get('head')!;

const edges: readonly DagEdge[] = [
  {
    id: 'world-tree',
    d: `M${worldNode.x - 30} ${worldNode.y + worldNode.height / 2}L${treeNode.x + 16} ${treeNode.y - treeNode.height / 2 - 2}`,
    role: 'neutral',
    marker: 'cg-instancing-arrow-neutral',
  },
  {
    id: 'world-dandelion',
    d: `M${worldNode.x - 16} ${worldNode.y + worldNode.height / 2}L${dandelionNode.x - 16} ${dandelionNode.y - dandelionNode.height / 2 - 2}`,
    role: 'path1',
    marker: 'cg-instancing-arrow-path1',
  },
  {
    id: 'world-hill',
    d: `M${worldNode.x + 30} ${worldNode.y + worldNode.height / 2}L${hillNode.x - 16} ${hillNode.y - hillNode.height / 2 - 2}`,
    role: 'path2',
    marker: 'cg-instancing-arrow-path2',
  },
  {
    id: 'hill-dandelion',
    d: `M${hillNode.x - 20} ${hillNode.y + hillNode.height / 2}Q310 164 ${dandelionNode.x + 24} ${dandelionNode.y - dandelionNode.height / 2 - 2}`,
    role: 'path2',
    marker: 'cg-instancing-arrow-path2',
  },
  {
    id: 'dandelion-stem',
    d: `M${dandelionNode.x - 22} ${dandelionNode.y + dandelionNode.height / 2}L${stemNode.x + 10} ${stemNode.y - stemNode.height / 2 - 2}`,
    role: 'shared',
    marker: 'cg-instancing-arrow-shared',
  },
  {
    id: 'dandelion-head',
    d: `M${dandelionNode.x + 22} ${dandelionNode.y + dandelionNode.height / 2}L${headNode.x - 10} ${headNode.y - headNode.height / 2 - 2}`,
    role: 'shared',
    marker: 'cg-instancing-arrow-shared',
  },
];

// Single local dandelion prototype transformed by A1 and A0 * A2 for the two scene instances.
const prototype = {
  stem: [
    [0, 0],
    [3, -44],
    [0, -80],
  ] as const,
  leftLeaf: [
    [0, -10],
    [-12, -18],
    [-16, -30],
    [-5, -22],
    [0, -14],
  ] as const,
  rightLeaf: [
    [0, -7],
    [12, -15],
    [15, -26],
    [5, -19],
    [0, -11],
  ] as const,
  headCenter: [0, -96] as Pt,
  headRadius: 20,
  coreRadius: 4.5,
  spokeCount: 12,
};

const a1Transform: AffineTransform = { tx: 610, ty: 264, angleDeg: 0, scale: 1.0 };
const a0Transform: AffineTransform = { tx: 704, ty: 244, angleDeg: -19, scale: 1.0 };
const a2Transform: AffineTransform = { tx: 8, ty: 0, angleDeg: 5, scale: 0.72 };

const matA0 = toMatrix(a0Transform);
const matA1 = toMatrix(a1Transform);
const matA0A2 = compose(matA0, toMatrix(a2Transform));

const hillLeft = apply(matA0, [-60, 0]);
const hillRight = apply(matA0, [56, 0]);
const groundY = hillLeft[1];
const groundLeft: Pt = [492, groundY];

function renderDandelion(matrix: Mat2D, scale: number, idPrefix: string) {
  const stemPts = prototype.stem.map((pt) => apply(matrix, pt));
  const leftLeaf = prototype.leftLeaf.map((pt) => apply(matrix, pt));
  const rightLeaf = prototype.rightLeaf.map((pt) => apply(matrix, pt));
  const headCenter = apply(matrix, prototype.headCenter);
  const headRadius = prototype.headRadius * scale;
  const coreRadius = prototype.coreRadius * scale;

  const spokes = Array.from({ length: prototype.spokeCount }, (_, i) => {
    const angle = (i * 2 * Math.PI) / prototype.spokeCount;
    const innerLocal: Pt = [
      prototype.headCenter[0] + Math.cos(angle) * 5,
      prototype.headCenter[1] + Math.sin(angle) * 5,
    ];
    const outerLocal: Pt = [
      prototype.headCenter[0] + Math.cos(angle) * 18.2,
      prototype.headCenter[1] + Math.sin(angle) * 18.2,
    ];
    return {
      key: `${idPrefix}-spoke-${i}`,
      inner: apply(matrix, innerLocal),
      outer: apply(matrix, outerLocal),
    };
  });

  return (
    <g>
      <path
        d={`M${fmt(leftLeaf[0])}Q${fmt(leftLeaf[1])} ${fmt(leftLeaf[2])}Q${fmt(leftLeaf[3])} ${fmt(leftLeaf[4])}Z`}
        className="cg-instancing-dandelion-leaf"
      />
      <path
        d={`M${fmt(rightLeaf[0])}Q${fmt(rightLeaf[1])} ${fmt(rightLeaf[2])}Q${fmt(rightLeaf[3])} ${fmt(rightLeaf[4])}Z`}
        className="cg-instancing-dandelion-leaf"
      />
      <path
        d={`M${fmt(stemPts[0])}Q${fmt(stemPts[1])} ${fmt(stemPts[2])}`}
        className="cg-instancing-dandelion-stem"
      />
      <circle
        cx={headCenter[0]}
        cy={headCenter[1]}
        r={headRadius}
        className="cg-instancing-dandelion-puff"
      />
      {spokes.map((spoke) => (
        <g key={spoke.key}>
          <path
            d={`M${fmt(spoke.inner)}L${fmt(spoke.outer)}`}
            className="cg-instancing-dandelion-spoke"
          />
          <circle
            cx={spoke.outer[0]}
            cy={spoke.outer[1]}
            r={1.15 * scale}
            className="cg-instancing-dandelion-tip"
          />
        </g>
      ))}
      <circle
        cx={headCenter[0]}
        cy={headCenter[1]}
        r={coreRadius}
        className="cg-instancing-dandelion-core"
      />
    </g>
  );
}

function LocalFrame({
  matrix,
  accent,
  length = 22,
}: {
  matrix: Mat2D;
  accent: 'world' | 'path1' | 'path2';
  length?: number;
}) {
  const origin = apply(matrix, [0, 0]);
  const xEnd = apply(matrix, [length, 0]);
  const yEnd = apply(matrix, [0, -length]);
  return (
    <g className={`cg-instancing-frame cg-instancing-frame-${accent}`}>
      <path d={`M${fmt(origin)}L${fmt(xEnd)}`} className="cg-instancing-frame-halo" />
      <path d={`M${fmt(origin)}L${fmt(yEnd)}`} className="cg-instancing-frame-halo" />
      <path
        d={`M${fmt(origin)}L${fmt(xEnd)}`}
        markerEnd={`url(#cg-instancing-frame-arrow-${accent})`}
      />
      <path
        d={`M${fmt(origin)}L${fmt(yEnd)}`}
        markerEnd={`url(#cg-instancing-frame-arrow-${accent})`}
      />
      <circle cx={origin[0]} cy={origin[1]} r="2.4" />
    </g>
  );
}

const canvas = { width: 780, height: 344 };

const texLabels = [
  { tex: String.raw`\(A_1\)`, x: 189, y: 121, tone: 'path1' },
  { tex: String.raw`\(A_0\)`, x: 316, y: 72, tone: 'path2' },
  { tex: String.raw`\(A_2\)`, x: 294, y: 146, tone: 'path2' },
  { tex: String.raw`\(A_1\)`, x: a1Transform.tx, y: groundY + 21, tone: 'path1' },
  { tex: String.raw`\(A_0 A_2\)`, x: 716, y: 268, tone: 'path2' },
] as const;

const worldFrameMatrix = toMatrix({ tx: 498, ty: groundY, angleDeg: 0, scale: 1 });

function InstancingDagFigure() {
  return (
    <figure className="cg-instancing">
      <div
        className="cg-instancing-scroll"
        tabIndex={0}
        role="region"
        aria-label="Instancing scene DAG and matching world instances; scroll horizontally"
      >
        <div className="cg-instancing-canvas">
          <svg
            viewBox={`0 0 ${canvas.width} ${canvas.height}`}
            width={canvas.width}
            height={canvas.height}
            role="img"
            aria-labelledby="cg-instancing-title cg-instancing-desc"
          >
            <title id="cg-instancing-title">Instancing turns a scene tree into a DAG</title>
            <desc id="cg-instancing-desc">
              On the left, World points directly to Tree, to Dandelion with transform A1, and to
              Hill with transform A0. Hill also points to the same Dandelion node with transform A2,
              giving Dandelion two parents and turning the tree into a directed acyclic graph.
              Dandelion owns one shared Stem and Head subgraph. On the right, the single Dandelion
              prototype is instantiated twice in world space: upright on flat ground via A1, and
              smaller and tilted on the slope via A0 A2.
            </desc>
            <defs>
              {(
                [
                  ['neutral', 'cg-instancing-arrow-neutral-head'],
                  ['path1', 'cg-instancing-arrow-path1-head'],
                  ['path2', 'cg-instancing-arrow-path2-head'],
                  ['shared', 'cg-instancing-arrow-shared-head'],
                ] as const
              ).map(([role, headClass]) => (
                <marker
                  key={role}
                  id={`cg-instancing-arrow-${role}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="4.5"
                  markerHeight="4.5"
                  orient="auto"
                >
                  <path d="M0 0L10 5L0 10Z" className={headClass} />
                </marker>
              ))}
              {(['world', 'path1', 'path2'] as const).map((accent) => (
                <marker
                  key={accent}
                  id={`cg-instancing-frame-arrow-${accent}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto"
                >
                  <path d="M0 0L10 5L0 10Z" className={`cg-instancing-frame-head-${accent}`} />
                </marker>
              ))}
            </defs>

            <rect
              x="112"
              y="166"
              width="220"
              height="150"
              rx="14"
              className="cg-instancing-shared-box"
            />
            <text x="222" y="308" textAnchor="middle" className="cg-instancing-shared-caption">
              Shared geometry (stored once)
            </text>

            {edges.map((edge) => (
              <path
                key={edge.id}
                d={edge.d}
                className={`cg-instancing-edge cg-instancing-edge-${edge.role}`}
                markerEnd={`url(#${edge.marker})`}
              />
            ))}

            {nodes.map((node) => (
              <g key={node.id}>
                <rect
                  x={node.x - node.width / 2}
                  y={node.y - node.height / 2}
                  width={node.width}
                  height={node.height}
                  rx="12"
                  className={`cg-instancing-node cg-instancing-node-${node.role}`}
                />
                <text x={node.x} y={node.y + 5} textAnchor="middle">
                  {node.label}
                </text>
              </g>
            ))}

            <path d="M474 22V308" className="cg-instancing-divider" />

            <polygon
              points={`${fmt(groundLeft)} ${fmt(hillLeft)} ${fmt(hillRight)} ${hillRight[0].toFixed(1)} 284 492 284`}
              className="cg-instancing-terrain-fill"
            />
            <path
              d={`M${fmt(groundLeft)}L${fmt(hillLeft)}L${fmt(hillRight)}`}
              className="cg-instancing-terrain-line"
            />

            {/* Non-instanced Tree node rendered once in the scene. */}
            <g>
              <rect
                x="534"
                y={groundY - 30}
                width="8"
                height="30"
                className="cg-instancing-tree-trunk"
              />
              <polygon
                points={`538,${groundY - 76} 517,${groundY - 40} 559,${groundY - 40}`}
                className="cg-instancing-tree-canopy"
              />
              <polygon
                points={`538,${groundY - 58} 514,${groundY - 26} 562,${groundY - 26}`}
                className="cg-instancing-tree-canopy"
              />
            </g>

            {renderDandelion(matA1, a1Transform.scale, 'inst1')}
            {renderDandelion(matA0A2, a2Transform.scale, 'inst2')}

            <LocalFrame matrix={worldFrameMatrix} accent="world" length={20} />
            <text
              x={worldFrameMatrix[4] - 2}
              y={groundY + 18}
              textAnchor="start"
              className="cg-instancing-world-label"
            >
              World
            </text>
            <LocalFrame matrix={matA1} accent="path1" length={22} />
            <LocalFrame matrix={matA0A2} accent="path2" length={20} />

            <text x="222" y="334" textAnchor="middle" className="cg-instancing-label">
              Scene DAG (in-degree 2 at Dandelion)
            </text>
            <text x="630" y="334" textAnchor="middle" className="cg-instancing-label">
              Same DAG, two world instances
            </text>
          </svg>

          {texLabels.map(({ tex, x, y, tone }, i) => (
            <span
              key={`${tone}-${i}`}
              className={`cg-instancing-tex cg-instancing-tex-${tone}`}
              style={{ left: `${(x / canvas.width) * 100}%`, top: `${(y / canvas.height) * 100}%` }}
            >
              {tex}
            </span>
          ))}
        </div>
      </div>
      <figcaption>
        Two paths in the scene graph ({String.raw`\(A_1\)`} from World and {String.raw`\(A_0 A_2\)`}{' '}
        through Hill) reference the same Dandelion subgraph, turning the tree into a DAG. Each
        reference applies its own transform, while editing the shared geometry updates every
        instance.
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { InstancingDagFigure };
