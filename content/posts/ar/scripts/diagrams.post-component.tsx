const inputNodes = [
  { x: 70, degree: 1, label: 'x₁' },
  { x: 150, degree: 2, label: 'x₂' },
  { x: 230, degree: 3, label: 'x₃' },
] as const;

const hiddenNodes = [
  { x: 45, degree: 1 },
  { x: 115, degree: 2 },
  { x: 185, degree: 1 },
  { x: 255, degree: 2 },
] as const;

const outputNodes = [
  { x: 70, degree: 1, label: 'x̂₁' },
  { x: 150, degree: 2, label: 'x̂₂' },
  { x: 230, degree: 3, label: 'x̂₃' },
] as const;

interface NodeProps {
  degree?: number;
  label?: string;
  x: number;
  y: number;
}

function NetworkNode({ degree, label, x, y }: NodeProps) {
  return (
    <g>
      <circle cx={x} cy={y} r="20" className="made-diagram-node" />
      {degree !== undefined && (
        <text x={x} y={y + 1} className="made-diagram-degree">
          {degree}
        </text>
      )}
      {label && (
        <text x={x} y={y + 38} className="made-diagram-variable">
          {label}
        </text>
      )}
    </g>
  );
}

function Connections({
  from,
  fromY,
  isAllowed,
  to,
  toY,
}: {
  from: ReadonlyArray<{ x: number; degree: number }>;
  fromY: number;
  isAllowed?: (sourceDegree: number, targetDegree: number) => boolean;
  to: ReadonlyArray<{ x: number; degree: number }>;
  toY: number;
}) {
  return from.flatMap((source, sourceIndex) =>
    to.map((target, targetIndex) => {
      const allowed = isAllowed?.(source.degree, target.degree) ?? true;
      return (
        <line
          key={`${sourceIndex}-${targetIndex}`}
          x1={source.x}
          y1={fromY - 20}
          x2={target.x}
          y2={toY + 20}
          className={allowed ? 'made-diagram-edge' : 'made-diagram-edge made-diagram-edge-masked'}
        />
      );
    }),
  );
}

function MaskGrid({
  columns,
  rows,
  values,
  x,
  y,
}: {
  columns: number;
  rows: number;
  values: ReadonlyArray<ReadonlyArray<number>>;
  x: number;
  y: number;
}) {
  const size = 18;
  return (
    <g>
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: columns }, (_, column) => (
          <rect
            key={`${row}-${column}`}
            x={x + column * size}
            y={y + row * size}
            width={size}
            height={size}
            className={values[row]?.[column] ? 'made-mask-cell-active' : 'made-mask-cell'}
          />
        )),
      )}
    </g>
  );
}

function MadeDiagram() {
  const madeX = 610;
  const shiftedInputs = inputNodes.map((node) => ({ ...node, x: node.x + madeX }));
  const shiftedHidden = hiddenNodes.map((node) => ({ ...node, x: node.x + madeX }));
  const shiftedOutputs = outputNodes.map((node) => ({ ...node, x: node.x + madeX }));

  return (
    <figure className="made-diagram-shell">
      <svg
        className="made-diagram"
        viewBox="0 0 920 500"
        role="img"
        aria-labelledby="made-diagram-title made-diagram-description"
      >
        <title id="made-diagram-title">MADE masking diagram</title>
        <desc id="made-diagram-description">
          A dense autoencoder is multiplied by binary masks. Degrees on the masked network ensure
          that each output depends only on earlier inputs in the autoregressive ordering.
        </desc>
        <defs>
          <marker
            id="made-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="made-diagram-arrowhead" />
          </marker>
        </defs>

        <text x="150" y="35" className="made-diagram-heading">
          Dense autoencoder
        </text>
        <Connections from={inputNodes} fromY={400} to={hiddenNodes} toY={270} />
        <Connections from={hiddenNodes} fromY={270} to={outputNodes} toY={140} />
        {inputNodes.map((node) => (
          <NetworkNode key={`dense-input-${node.degree}`} x={node.x} y={400} label={node.label} />
        ))}
        {hiddenNodes.map((node, index) => (
          <NetworkNode key={`dense-hidden-${index}`} x={node.x} y={270} />
        ))}
        {outputNodes.map((node) => (
          <NetworkNode key={`dense-output-${node.degree}`} x={node.x} y={140} label={node.label} />
        ))}

        <text x="445" y="35" className="made-diagram-heading">
          Binary masks
        </text>
        <MaskGrid
          x={409}
          y={112}
          rows={3}
          columns={4}
          values={[
            [0, 0, 0, 0],
            [1, 0, 1, 0],
            [1, 1, 1, 1],
          ]}
        />
        <text x="445" y="202" className="made-diagram-mask-label">
          M²
        </text>
        <MaskGrid
          x={418}
          y={283}
          rows={4}
          columns={3}
          values={[
            [1, 0, 0],
            [1, 1, 0],
            [1, 0, 0],
            [1, 1, 0],
          ]}
        />
        <text x="454" y="358" className="made-diagram-mask-label">
          M¹
        </text>
        <text x="445" y="409" className="made-diagram-rule">
          keep edges that respect degree
        </text>
        <path d="M 545 250 L 585 250" className="made-diagram-flow" />

        <text x="760" y="35" className="made-diagram-heading">
          MADE
        </text>
        <Connections
          from={shiftedInputs}
          fromY={400}
          to={shiftedHidden}
          toY={270}
          isAllowed={(source, target) => source <= target}
        />
        <Connections
          from={shiftedHidden}
          fromY={270}
          to={shiftedOutputs}
          toY={140}
          isAllowed={(source, target) => source < target}
        />
        {shiftedInputs.map((node) => (
          <NetworkNode
            key={`made-input-${node.degree}`}
            x={node.x}
            y={400}
            degree={node.degree}
            label={node.label}
          />
        ))}
        {shiftedHidden.map((node, index) => (
          <NetworkNode
            key={`made-hidden-${index}`}
            x={node.x}
            y={270}
            degree={node.degree}
          />
        ))}
        {shiftedOutputs.map((node) => (
          <NetworkNode
            key={`made-output-${node.degree}`}
            x={node.x}
            y={140}
            degree={node.degree}
          />
        ))}
        <text x="680" y="86" className="made-diagram-probability">
          p(x₁)
        </text>
        <text x="760" y="86" className="made-diagram-probability">
          p(x₂ | x₁)
        </text>
        <text x="840" y="86" className="made-diagram-probability">
          p(x₃ | x₁,x₂)
        </text>

        <g className="made-diagram-legend">
          <line x1="630" y1="460" x2="666" y2="460" className="made-diagram-edge" />
          <text x="675" y="464">kept</text>
          <line
            x1="747"
            y1="460"
            x2="783"
            y2="460"
            className="made-diagram-edge made-diagram-edge-masked"
          />
          <text x="792" y="464">masked</text>
        </g>
      </svg>
    </figure>
  );
}

export const POST_COMPONENTS = {
  MadeDiagram,
};
