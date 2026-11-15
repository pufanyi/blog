type Vec3 = readonly [number, number, number];

interface Part {
  id: string;
  parent?: string;
  label: readonly string[];
  tree: readonly [number, number];
  joint: Vec3;
  size: Vec3;
  offset?: Vec3;
  angle?: number;
  accent?: 'body' | 'upper' | 'lower';
}
// The world frame sits beside the figure, so A0 is a real placement, not the identity.
const worldOrigin: Vec3 = [-96, 168, 0];
const world = { label: 'World', tree: [370, 46] as const };
const parts: readonly Part[] = [
  {
    id: 'body',
    label: ['Body'],
    tree: [230, 46],
    joint: [96, -168, 0],
    size: [56, 68, 30],
    accent: 'body',
  },
  {
    id: 'left-arm',
    parent: 'body',
    label: ['Left', 'arm'],
    tree: [50, 140],
    joint: [31, 14, 0],
    size: [65, 21, 24],
    offset: [34, -10.5, 0],
    angle: 8,
  },
  {
    id: 'right-arm',
    parent: 'body',
    label: ['Right', 'arm'],
    tree: [140, 140],
    joint: [-31, 14, 0],
    size: [65, 21, 24],
    offset: [-34, -10.5, 0],
    angle: -8,
  },
  {
    id: 'head',
    parent: 'body',
    label: ['Head'],
    tree: [230, 140],
    joint: [0, -5, 0],
    size: [32, 39, 28],
    offset: [0, -39, 0],
  },
  {
    id: 'right-upper',
    parent: 'body',
    label: ['Right', 'upper leg'],
    tree: [320, 140],
    joint: [-16, 71, 0],
    size: [23, 55, 26],
    angle: 13,
  },
  {
    id: 'left-upper',
    parent: 'body',
    label: ['Left', 'upper leg'],
    tree: [410, 140],
    joint: [16, 71, 0],
    size: [23, 55, 26],
    angle: -10,
    accent: 'upper',
  },
  {
    id: 'right-lower',
    parent: 'right-upper',
    label: ['Right', 'lower leg'],
    tree: [320, 248],
    joint: [0, 55, 0],
    size: [22, 55, 24],
    angle: -22,
  },
  {
    id: 'left-lower',
    parent: 'left-upper',
    label: ['Left', 'lower leg'],
    tree: [410, 248],
    joint: [0, 55, 0],
    size: [22, 55, 24],
    angle: 10,
    accent: 'lower',
  },
];
const byId = new Map(parts.map((part) => [part.id, part]));
const tone = (part: Part) => `cg-scene-part${part.accent ? ` cg-scene-${part.accent}` : ''}`;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const rotate = ([x, y, z]: Vec3, angle: number): Vec3 => [
  x * Math.cos(angle) - y * Math.sin(angle),
  x * Math.sin(angle) + y * Math.cos(angle),
  z,
];
const dot = (a: Vec3, b: Vec3) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const yaw = (-25 * Math.PI) / 180;
const elevation = (18 * Math.PI) / 180;
const horizontal: Vec3 = [Math.cos(yaw), 0, Math.sin(yaw)];
const vertical: Vec3 = [
  -Math.sin(yaw) * Math.sin(elevation),
  Math.cos(elevation),
  Math.cos(yaw) * Math.sin(elevation),
];
const towardCamera: Vec3 = [
  -Math.sin(yaw) * Math.cos(elevation),
  -Math.sin(elevation),
  Math.cos(yaw) * Math.cos(elevation),
];
const project = (p: Vec3) => [630 + dot(p, horizontal), 94 + dot(p, vertical)];
interface Pose {
  position: Vec3;
  angle: number;
}
const poses = new Map<string, Pose>();
function place(part: Part, parent: Pose = { position: [0, 0, 0], angle: 0 }) {
  const pose = {
    position: add(parent.position, rotate(part.joint, parent.angle)),
    angle: parent.angle + ((part.angle ?? 0) * Math.PI) / 180,
  };
  poses.set(part.id, pose);
  parts.filter((child) => child.parent === part.id).forEach((child) => place(child, pose));
}
place(parts[0], { position: worldOrigin, angle: 0 });
const faces = [
  { indices: [0, 1, 2, 3], normal: [0, 0, -1] as Vec3, shade: 'side' },
  { indices: [4, 5, 6, 7], normal: [0, 0, 1] as Vec3, shade: 'front' },
  { indices: [0, 1, 5, 4], normal: [0, -1, 0] as Vec3, shade: 'top' },
  { indices: [3, 2, 6, 7], normal: [0, 1, 0] as Vec3, shade: 'side' },
  { indices: [0, 3, 7, 4], normal: [-1, 0, 0] as Vec3, shade: 'side' },
  { indices: [1, 2, 6, 5], normal: [1, 0, 0] as Vec3, shade: 'side' },
];
// Resolve the actual hierarchy in 3D, then project and depth-sort visible cuboid faces.
const surfaces = parts
  .flatMap((part) => {
    const pose = poses.get(part.id)!;
    const [w, h, d] = part.size;
    const corners: Vec3[] = [
      [-w / 2, 0, -d / 2],
      [w / 2, 0, -d / 2],
      [w / 2, h, -d / 2],
      [-w / 2, h, -d / 2],
      [-w / 2, 0, d / 2],
      [w / 2, 0, d / 2],
      [w / 2, h, d / 2],
      [-w / 2, h, d / 2],
    ];
    const vertices = corners.map((p) =>
      add(pose.position, rotate(add(p, part.offset ?? [0, 0, 0]), pose.angle)),
    );
    return faces
      .filter((face) => dot(rotate(face.normal, pose.angle), towardCamera) > 0)
      .map((face) => ({
        key: `${part.id}-${face.indices.join('-')}`,
        part,
        shade: face.shade,
        points: face.indices.map((i) => project(vertices[i]).join(',')).join(' '),
        depth: face.indices.reduce((sum, i) => sum + dot(vertices[i], towardCamera), 0) / 4,
      }));
  })
  .sort((a, b) => a.depth - b.depth);

// Local frames for the highlighted chain: x along the part's width, y down the limb.
const frameLength = 30;
const frames = [
  { id: 'world', accent: 'world', pose: { position: worldOrigin, angle: 0 }, depth: 0 },
  ...parts
    .filter((part) => part.accent)
    .map((part) => ({
      id: part.id,
      accent: part.accent!,
      pose: poses.get(part.id)!,
      depth: part.size[2] / 2 + 1,
    })),
].map(({ id, accent, pose, depth }) => {
  const at = (v: Vec3) => project(add(add(pose.position, [0, 0, depth]), rotate(v, pose.angle)));
  return {
    id,
    accent,
    origin: at([0, 0, 0]),
    x: at([frameLength, 0, 0]),
    y: at([0, frameLength, 0]),
  };
});

function Frames() {
  return (
    <g>
      {frames.map(({ id, accent, origin, x, y }) => (
        <g key={id} className={`cg-scene-frame cg-scene-frame-${accent}`}>
          {/* A paper halo separates each axis from the box edge it runs along. */}
          {[x, y].map((end, i) => (
            <path
              key={`halo-${i}`}
              d={`M${origin.join(' ')}L${end.join(' ')}`}
              className="cg-scene-frame-halo"
            />
          ))}
          {[x, y].map((end, i) => (
            <path
              key={i}
              d={`M${origin.join(' ')}L${end.join(' ')}`}
              markerEnd={`url(#cg-scene-frame-arrow-${accent})`}
            />
          ))}
          <circle cx={origin[0]} cy={origin[1]} r="2.4" />
          {id === 'world' && (
            <text x={origin[0] - 6} y={origin[1] + 4} textAnchor="end" className="cg-scene-label">
              World
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

function AssembledFigure() {
  return (
    <g>
      {surfaces.map((face) => (
        <polygon
          key={face.key}
          points={face.points}
          className={`cg-scene-solid cg-scene-face-${face.shade}${face.part.accent ? ` cg-scene-solid-${face.part.accent}` : ''}`}
        >
          <title>{face.part.label.join(' ')}</title>
        </polygon>
      ))}
      {parts
        .filter((part) => part.parent && !part.accent)
        .map((part) => {
          const pose = poses.get(part.id)!;
          const [x, y] = project(add(pose.position, [0, -1.5, part.size[2] / 2 + 1]));
          return <circle key={part.id} cx={x} cy={y} r="2.2" className="cg-scene-joint" />;
        })}
      <Frames />
    </g>
  );
}

// The highlighted chain, from the lower leg up to the world: edge i carries A_(2 - i).
type Pt = readonly [number, number];
const node = { width: 80, height: 46 };
const chain: readonly { from: Pt; to: Pt }[] = [
  ...parts
    .filter((part) => part.accent && part.parent)
    .reverse()
    .map((part) => {
      const parent = byId.get(part.parent!)!;
      return {
        from: [part.tree[0], part.tree[1] - node.height / 2 - 3] as Pt,
        to: [parent.tree[0], parent.tree[1] + node.height / 2 + 3] as Pt,
      };
    }),
  {
    from: [parts[0].tree[0] + node.width / 2 + 3, parts[0].tree[1]],
    to: [world.tree[0] - node.width / 2 - 3, world.tree[1]],
  },
];
// Place each label beside its edge midpoint, on the side facing up and to the right.
const transformLabels = chain.map(({ from, to }, i) => {
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  const length = Math.hypot(dx, dy);
  const normals: Pt[] = [
    [dy / length, -dx / length],
    [-dy / length, dx / length],
  ];
  const [nx, ny] = normals.reduce((a, b) => (b[0] - b[1] > a[0] - a[1] ? b : a));
  return {
    tex: String.raw`\(A_${chain.length - 1 - i}\)`,
    x: (from[0] + to[0]) / 2 + nx * 14,
    y: (from[1] + to[1]) / 2 + ny * 14,
  };
});
const canvas = { width: 780, height: 320 };
const accents = ['world', 'body', 'upper', 'lower'] as const;

function SceneGraphFigure() {
  return (
    <figure className="cg-scene">
      <div
        className="cg-scene-scroll"
        tabIndex={0}
        role="region"
        aria-label="Scene graph and matching block figure; scroll horizontally"
      >
        <div className="cg-scene-canvas">
          <svg
            viewBox={`0 0 ${canvas.width} ${canvas.height}`}
            width={canvas.width}
            height={canvas.height}
            role="img"
            aria-labelledby="cg-scene-title cg-scene-desc"
          >
            <title id="cg-scene-title">A scene graph and its articulated block figure</title>
            <desc id="cg-scene-desc">
              The body is the parent of the head, both arms and both upper legs. Each upper leg is
              the parent of its lower leg. Matching colors highlight the body, left upper leg and
              left lower leg in the tree and the block figure, where each draws its local x and y
              axes at its joint; the world frame sits beside the figure. Highlighted arrows map
              local coordinates to the parent: A2 from left lower leg to left upper leg, A1 from
              left upper leg to body, and A0 from body to world. Moving a parent carries its
              descendants and their frames.
            </desc>
            <defs>
              <marker
                id="cg-scene-chain-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto"
              >
                <path d="M0 0L10 5L0 10Z" className="cg-scene-chain-head" />
              </marker>
              {accents.map((accent) => (
                <marker
                  key={accent}
                  id={`cg-scene-frame-arrow-${accent}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto"
                >
                  <path d="M0 0L10 5L0 10Z" className={`cg-scene-frame-head-${accent}`} />
                </marker>
              ))}
            </defs>
            {parts
              .filter((part) => part.parent && !part.accent)
              .map((part) => {
                const parent = byId.get(part.parent!)!;
                return (
                  <path
                    key={part.id}
                    d={`M${parent.tree[0]} ${parent.tree[1] + node.height / 2}L${part.tree[0]} ${part.tree[1] - node.height / 2}`}
                    className="cg-scene-edge"
                  />
                );
              })}
            {chain.map(({ from, to }, i) => (
              <path
                key={i}
                d={`M${from.join(' ')}L${to.join(' ')}`}
                className="cg-scene-edge cg-scene-chain"
                markerEnd="url(#cg-scene-chain-arrow)"
              />
            ))}
            {[...parts, { id: 'world', label: [world.label], tree: world.tree }].map((part) => (
              <g key={part.id}>
                <rect
                  x={part.tree[0] - node.width / 2}
                  y={part.tree[1] - node.height / 2}
                  width={node.width}
                  height={node.height}
                  rx="13"
                  className={
                    part.id === 'world' ? 'cg-scene-part cg-scene-world' : tone(part as Part)
                  }
                />
                {part.label.map((label, i) => (
                  <text
                    key={label}
                    x={part.tree[0]}
                    y={part.tree[1] + 5 + (i - (part.label.length - 1) / 2) * 17}
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                ))}
              </g>
            ))}
            <path d="M480 24V284" className="cg-scene-divider" />
            <AssembledFigure />
            <text x="230" y="307" textAnchor="middle" className="cg-scene-label">
              Local → parent
            </text>
            <text x="630" y="307" textAnchor="middle" className="cg-scene-label">
              Same hierarchy, assembled
            </text>
          </svg>
          {transformLabels.map(({ tex, x, y }) => (
            <span
              key={tex}
              className="cg-scene-transform"
              style={{ left: `${(x / canvas.width) * 100}%`, top: `${(y / canvas.height) * 100}%` }}
            >
              {tex}
            </span>
          ))}
        </div>
      </div>
      <figcaption>
        Local coordinates → world coordinates. Each colored axis pair is a part's local frame;{' '}
        {String.raw`\(A_i\)`} maps it into its parent's frame.
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { SceneGraphFigure };
