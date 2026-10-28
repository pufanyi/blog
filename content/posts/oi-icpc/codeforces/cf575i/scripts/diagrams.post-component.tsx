type DiagramVariant = 'strip' | 'excluded';

const geometry = {
  plot: { left: 90, top: 76, right: 586, bottom: 342 },
  corner: { x: 270, y: 270 },
  right: { x: 430, y: 270 },
  upper: { x: 270, y: 110 },
};

function GeometryDiagram({ variant }: { variant: DiagramVariant }) {
  const excluded = variant === 'excluded';
  const prefix = `cf575i-${variant}`;
  const { plot, corner, right, upper } = geometry;
  // In SVG coordinates y increases downwards. Both x' + y' boundaries
  // therefore have slope +1; the target triangle is between them.
  const strip = `M 76 ${plot.top} H 236 L 502 ${plot.bottom} H 342 Z`;
  const triangle = `M ${corner.x} ${corner.y} H ${right.x} L ${upper.x} ${upper.y} Z`;

  return (
    <figure className="cf575i-figure">
      <svg
        viewBox="0 0 660 386"
        className="cf575i-diagram"
        role="img"
        aria-labelledby={`${prefix}-title ${prefix}-desc`}
      >
        <title id={`${prefix}-title`}>
          {excluded ? '从斜向带状区域中扣除三角形之外的部分' : '包含目标三角形的斜向带状区域'}
        </title>
        <desc id={`${prefix}-desc`}>
          {excluded
            ? "青绿色三角形为实际需要覆盖的部分。浅红色区域满足 x' < x 或 y' < y，必须从带状区域减去。"
            : "两条斜线分别为 x' + y' = x + y 与 x' + y' = x + y + l；目标三角形位于两条线之间。"}
        </desc>
        <defs>
          <clipPath id={`${prefix}-clip`}>
            <path d={strip} />
          </clipPath>
          <marker
            id={`${prefix}-arrow`}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="8"
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 L 2 4 Z" className="cf575i-arrowhead" />
          </marker>
        </defs>
        <path d={strip} className="cf575i-strip" />
        {excluded && (
          <g clipPath={`url(#${prefix}-clip)`} className="cf575i-excluded">
            <rect
              x={plot.left}
              y={plot.top}
              width={corner.x - plot.left}
              height={plot.bottom - plot.top}
            />
            <rect
              x={plot.left}
              y={corner.y}
              width={plot.right - plot.left}
              height={plot.bottom - corner.y}
            />
          </g>
        )}
        <path d={triangle} className="cf575i-target" />
        <path d={`M 76 ${plot.top} L 342 ${plot.bottom}`} className="cf575i-boundary" />
        <path d={`M 236 ${plot.top} L 502 ${plot.bottom}`} className="cf575i-boundary" />
        <path
          d={`M ${plot.left - 14} ${plot.bottom} H ${plot.right + 20}`}
          className="cf575i-axis"
          markerEnd={`url(#${prefix}-arrow)`}
        />
        <path
          d={`M ${plot.left} ${plot.bottom + 12} V ${plot.top - 18}`}
          className="cf575i-axis"
          markerEnd={`url(#${prefix}-arrow)`}
        />
        <text x="615" y="350" className="cf575i-axis-label">
          x′
        </text>
        <text x="73" y="50" className="cf575i-axis-label">
          y′
        </text>
        <circle cx={corner.x} cy={corner.y} r="3.5" className="cf575i-point" />
        <circle cx={right.x} cy={right.y} r="3.5" className="cf575i-point" />
        <circle cx={upper.x} cy={upper.y} r="3.5" className="cf575i-point" />
        <text x={corner.x + 10} y={corner.y + 23} className="cf575i-label">
          (x, y)
        </text>
        <text x={right.x + 9} y={right.y + 5} className="cf575i-label">
          (x+l, y)
        </text>
        <text x={upper.x + 9} y={upper.y - 11} className="cf575i-label">
          (x, y+l)
        </text>
        <text x="115" y="103" className="cf575i-line-label" transform="rotate(45 115 103)">
          x′+y′=x+y
        </text>
        <text x="354" y="149" className="cf575i-line-label" transform="rotate(45 354 149)">
          x′+y′=x+y+l
        </text>
        {excluded && (
          <>
            <text x="187" y="212" className="cf575i-subtract-label">
              x′ &lt; x
            </text>
            <text x="435" y="320" className="cf575i-subtract-label">
              y′ &lt; y
            </text>
          </>
        )}
      </svg>
      <figcaption>
        {excluded
          ? '带状区域减去 x′ < x 与 y′ < y 的两块区域，剩下目标三角形。'
          : '先用 x′+y′ ∈ [x+y, x+y+l] 覆盖整个斜向带状区域。'}
      </figcaption>
    </figure>
  );
}

function DiagonalStripDiagram() {
  return <GeometryDiagram variant="strip" />;
}

function ExcludedRegionsDiagram() {
  return <GeometryDiagram variant="excluded" />;
}

export const POST_COMPONENTS = { DiagonalStripDiagram, ExcludedRegionsDiagram };
