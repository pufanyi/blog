interface DiagramNode {
  degree: number;
  label?: string;
  x: number;
}

const inputNodes = [
  { x: 70, degree: 3, label: 'x₁' },
  { x: 150, degree: 1, label: 'x₂' },
  { x: 230, degree: 2, label: 'x₃' },
] as const satisfies ReadonlyArray<DiagramNode>;

const firstHiddenNodes = [
  { x: 45, degree: 2 },
  { x: 115, degree: 1 },
  { x: 185, degree: 2 },
  { x: 255, degree: 2 },
] as const satisfies ReadonlyArray<DiagramNode>;

const secondHiddenNodes = [
  { x: 45, degree: 1 },
  { x: 115, degree: 2 },
  { x: 185, degree: 2 },
  { x: 255, degree: 1 },
] as const satisfies ReadonlyArray<DiagramNode>;

const outputNodes = [
  { x: 70, degree: 3, label: 'x̂₁' },
  { x: 150, degree: 1, label: 'x̂₂' },
  { x: 230, degree: 2, label: 'x̂₃' },
] as const satisfies ReadonlyArray<DiagramNode>;

interface NodeProps {
  degree?: number;
  label?: string;
  labelOffset?: number;
  x: number;
  y: number;
}

function NetworkNode({ degree, label, labelOffset = 38, x, y }: NodeProps) {
  return (
    <g>
      <circle cx={x} cy={y} r="20" className="made-diagram-node" />
      {degree !== undefined && (
        <text x={x} y={y + 1} className="made-diagram-degree">
          {degree}
        </text>
      )}
      {label && (
        <text x={x} y={y + labelOffset} className="made-diagram-variable">
          {label}
        </text>
      )}
    </g>
  );
}

function Connections({
  classForEdge,
  from,
  fromY,
  isAllowed,
  to,
  toY,
}: {
  classForEdge?: (source: DiagramNode, target: DiagramNode) => string;
  from: ReadonlyArray<DiagramNode>;
  fromY: number;
  isAllowed?: (sourceDegree: number, targetDegree: number) => boolean;
  to: ReadonlyArray<DiagramNode>;
  toY: number;
}) {
  return from.flatMap((source, sourceIndex) =>
    to.map((target, targetIndex) => {
      if (isAllowed && !isAllowed(source.degree, target.degree)) return null;

      return (
        <line
          key={`${sourceIndex}-${targetIndex}`}
          x1={source.x}
          y1={fromY - 20}
          x2={target.x}
          y2={toY + 22}
          className={classForEdge?.(source, target) ?? 'made-diagram-edge-dense'}
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

function MaskLabel({ layer, x, y }: { layer: string; x: number; y: number }) {
  return (
    <text x={x} y={y} className="made-diagram-mask-label">
      M
      <tspan baselineShift="super" className="made-diagram-superscript">
        {layer}
      </tspan>
    </text>
  );
}

function MadeDiagram() {
  const madeOffset = 650;
  const shift = (nodes: ReadonlyArray<DiagramNode>) =>
    nodes.map((node) => ({ ...node, x: node.x + madeOffset }));
  const madeInputs = shift(inputNodes);
  const madeFirstHidden = shift(firstHiddenNodes);
  const madeSecondHidden = shift(secondHiddenNodes);
  const madeOutputs = shift(outputNodes);
  const dependencyClass = (degree: number) =>
    degree === 1 ? 'made-diagram-edge-one' : 'made-diagram-edge-two';

  return (
    <figure className="made-diagram-shell">
      <svg
        className="made-diagram"
        viewBox="0 0 1000 600"
        role="img"
        aria-labelledby="made-diagram-title made-diagram-description"
      >
        <title id="made-diagram-title">MADE masking example</title>
        <desc id="made-diagram-description">
          A three-variable example with node degrees three, one, two at the input. Binary masks
          remove connections so the outputs model p of x2, p of x3 given x2, and p of x1 given x2
          and x3.
        </desc>
        <defs>
          <marker
            id="made-arrow-dense"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="made-diagram-arrow-dense" />
          </marker>
          <marker
            id="made-arrow-one"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="made-diagram-arrow-one" />
          </marker>
          <marker
            id="made-arrow-two"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="made-diagram-arrow-two" />
          </marker>
          <marker
            id="made-transform-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="made-diagram-transform-arrowhead" />
          </marker>
        </defs>

        <text x="150" y="38" className="made-diagram-heading">
          Autoencoder
        </text>
        <Connections from={inputNodes} fromY={490} to={firstHiddenNodes} toY={380} />
        <Connections from={firstHiddenNodes} fromY={380} to={secondHiddenNodes} toY={270} />
        <Connections from={secondHiddenNodes} fromY={270} to={outputNodes} toY={160} />
        {inputNodes.map((node) => (
          <NetworkNode key={`dense-input-${node.label}`} x={node.x} y={490} label={node.label} />
        ))}
        {firstHiddenNodes.map((node, index) => (
          <NetworkNode key={`dense-hidden-one-${index}`} x={node.x} y={380} />
        ))}
        {secondHiddenNodes.map((node, index) => (
          <NetworkNode key={`dense-hidden-two-${index}`} x={node.x} y={270} />
        ))}
        {outputNodes.map((node) => (
          <NetworkNode
            key={`dense-output-${node.label}`}
            x={node.x}
            y={160}
            label={node.label}
            labelOffset={-34}
          />
        ))}
        <text x="445" y="38" className="made-diagram-heading">
          Binary masks
        </text>
        <MaskGrid
          x={409}
          y={128}
          rows={3}
          columns={4}
          values={[
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [1, 0, 0, 1],
          ]}
        />
        <MaskLabel layer="3" x={505} y={160} />

        <MaskGrid
          x={409}
          y={255}
          rows={4}
          columns={4}
          values={[
            [0, 1, 0, 0],
            [1, 1, 1, 1],
            [1, 1, 1, 1],
            [0, 1, 0, 0],
          ]}
        />
        <MaskLabel layer="2" x={505} y={296} />

        <MaskGrid
          x={418}
          y={395}
          rows={4}
          columns={3}
          values={[
            [0, 1, 1],
            [0, 1, 0],
            [0, 1, 1],
            [0, 1, 1],
          ]}
        />
        <MaskLabel layer="1" x={505} y={436} />
        <g className="made-diagram-mask-key">
          <rect x="405" y="510" width="14" height="14" className="made-mask-cell-active" />
          <text x="427" y="522">1: keep</text>
          <rect x="476" y="510" width="14" height="14" className="made-mask-cell" />
          <text x="498" y="522">0: remove</text>
        </g>
        <text x="595" y="280" className="made-diagram-operation">
          weights ⊙ masks
        </text>
        <path d="M 560 305 L 625 305" className="made-diagram-transform-arrow" />

        <text x="800" y="38" className="made-diagram-heading">
          MADE
        </text>
        <Connections
          from={madeInputs}
          fromY={490}
          to={madeFirstHidden}
          toY={380}
          isAllowed={(source, target) => source <= target}
          classForEdge={(_, target) => dependencyClass(target.degree)}
        />
        <Connections
          from={madeFirstHidden}
          fromY={380}
          to={madeSecondHidden}
          toY={270}
          isAllowed={(source, target) => source <= target}
          classForEdge={(_, target) => dependencyClass(target.degree)}
        />
        <Connections
          from={madeSecondHidden}
          fromY={270}
          to={madeOutputs}
          toY={160}
          isAllowed={(source, target) => source < target}
          classForEdge={(source) => dependencyClass(source.degree)}
        />
        {madeInputs.map((node) => (
          <NetworkNode
            key={`made-input-${node.label}`}
            x={node.x}
            y={490}
            degree={node.degree}
            label={node.label}
          />
        ))}
        {madeFirstHidden.map((node, index) => (
          <NetworkNode
            key={`made-hidden-one-${index}`}
            x={node.x}
            y={380}
            degree={node.degree}
          />
        ))}
        {madeSecondHidden.map((node, index) => (
          <NetworkNode
            key={`made-hidden-two-${index}`}
            x={node.x}
            y={270}
            degree={node.degree}
          />
        ))}
        {madeOutputs.map((node) => (
          <NetworkNode
            key={`made-output-${node.label}`}
            x={node.x}
            y={160}
            degree={node.degree}
          />
        ))}
        <text x="720" y="95" className="made-diagram-probability">
          p(x₁ | x₂,x₃)
        </text>
        <text x="800" y="95" className="made-diagram-probability">
          p(x₂)
        </text>
        <text x="880" y="95" className="made-diagram-probability">
          p(x₃ | x₂)
        </text>

        <g className="made-diagram-legend">
          <line x1="690" y1="565" x2="726" y2="565" className="made-diagram-edge-one" />
          <text x="736" y="570">depends on 1 input</text>
          <line x1="840" y1="565" x2="876" y2="565" className="made-diagram-edge-two" />
          <text x="886" y="570">depends on 2</text>
        </g>
      </svg>
      <figcaption className="made-diagram-caption">
        Example order: x₂ → x₃ → x₁, giving p(x) = p(x₂) p(x₃ | x₂) p(x₁ | x₂,x₃).
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = {
  MadeDiagram,
};
