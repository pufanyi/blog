interface Part {
  id: string;
  parent?: string;
  label: readonly string[];
  tree: readonly [number, number];
  joint: readonly [number, number];
  size: readonly [number, number];
  angle?: number;
  accent?: 'body' | 'upper' | 'lower';
}
const parts: readonly Part[] = [
  { id: 'body', label: ['Body'], tree: [230, 46], joint: [0, 0], size: [60, 70], accent: 'body' },
  {
    id: 'left-arm',
    parent: 'body',
    label: ['Left', 'arm'],
    tree: [50, 140],
    joint: [67, 12],
    size: [74, 24],
  },
  {
    id: 'right-arm',
    parent: 'body',
    label: ['Right', 'arm'],
    tree: [140, 140],
    joint: [-67, 12],
    size: [74, 24],
  },
  {
    id: 'head',
    parent: 'body',
    label: ['Head'],
    tree: [230, 140],
    joint: [0, -51],
    size: [34, 44],
  },
  {
    id: 'right-upper',
    parent: 'body',
    label: ['Right', 'upper leg'],
    tree: [320, 140],
    joint: [-19, 70],
    size: [25, 61],
    angle: 18,
  },
  {
    id: 'left-upper',
    parent: 'body',
    label: ['Left', 'upper leg'],
    tree: [410, 140],
    joint: [19, 70],
    size: [25, 61],
    angle: -12,
    accent: 'upper',
  },
  {
    id: 'right-lower',
    parent: 'right-upper',
    label: ['Right', 'lower leg'],
    tree: [320, 248],
    joint: [0, 61],
    size: [25, 61],
    angle: -32,
  },
  {
    id: 'left-lower',
    parent: 'left-upper',
    label: ['Left', 'lower leg'],
    tree: [410, 248],
    joint: [0, 61],
    size: [25, 61],
    angle: 12,
    accent: 'lower',
  },
];
const byId = new Map(parts.map((part) => [part.id, part]));
const tone = (part: Part) => `cg-scene-part${part.accent ? ` cg-scene-${part.accent}` : ''}`;

function BodyPart({ part }: { part: Part }) {
  const [w, h] = part.size;
  const x = -w / 2;
  return (
    <g transform={`translate(${part.joint.join(' ')}) rotate(${part.angle ?? 0})`}>
      <title>{part.label.join(' ')}</title>
      <path
        d={`M${x} 0l9 -7h${w}l-9 7Z M${x + w} 0l9 -7v${h}l-9 7Z`}
        className={`${tone(part)} cg-scene-side`}
      />
      <rect x={x} width={w} height={h} className={tone(part)} />
      {parts
        .filter((child) => child.parent === part.id)
        .map((child) => (
          <BodyPart key={child.id} part={child} />
        ))}
    </g>
  );
}

function SceneGraphFigure() {
  return (
    <figure className="cg-scene">
      <div
        className="cg-scene-scroll"
        tabIndex={0}
        role="region"
        aria-label="Scene graph and matching block figure; scroll horizontally"
      >
        <svg
          viewBox="0 0 780 320"
          width="780"
          height="320"
          role="img"
          aria-labelledby="cg-scene-title cg-scene-desc"
        >
          <title id="cg-scene-title">A scene graph and its articulated block figure</title>
          <desc id="cg-scene-desc">
            The body is the parent of the head, both arms and both upper legs. Each upper leg is the
            parent of its lower leg. Matching colors highlight the body, left upper leg and left
            lower leg in the tree and the block figure. Moving a parent carries its descendants.
          </desc>
          <defs>
            <marker
              id="cg-scene-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0 0L10 5L0 10Z" className="cg-scene-arrow" />
            </marker>
          </defs>
          {parts
            .filter((part) => part.parent)
            .map((part) => {
              const parent = byId.get(part.parent!)!;
              return (
                <path
                  key={part.id}
                  d={`M${parent.tree[0]} ${parent.tree[1] + 23}L${part.tree[0]} ${part.tree[1] - 26}`}
                  className={part.accent ? 'cg-scene-edge cg-scene-chain' : 'cg-scene-edge'}
                  markerEnd="url(#cg-scene-arrow)"
                />
              );
            })}
          {parts.map((part) => (
            <g key={part.id}>
              <rect
                x={part.tree[0] - 40}
                y={part.tree[1] - 23}
                width="80"
                height="46"
                rx="13"
                className={tone(part)}
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
          <g transform="translate(626 95)">
            <BodyPart part={parts[0]} />
          </g>
          <text x="230" y="307" textAnchor="middle" className="cg-scene-label">
            Parent → child
          </text>
          <text x="630" y="307" textAnchor="middle" className="cg-scene-label">
            Same hierarchy, assembled
          </text>
        </svg>
      </div>
      <figcaption>Body → left upper leg → left lower leg.</figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { SceneGraphFigure };
