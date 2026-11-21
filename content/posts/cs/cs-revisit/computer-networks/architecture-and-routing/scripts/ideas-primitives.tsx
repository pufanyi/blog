import type { ReactNode } from 'react';

export function Diagram({
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
  caption: ReactNode;
}) {
  return (
    <figure className="csnet-figure">
      <div className="csnet-scroll" role="region" aria-label={title} tabIndex={0}>
        <svg
          className="csnet-idea"
          viewBox={`0 0 680 ${height}`}
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
              <path d="M 1 1 L 9 5 L 1 9" className="csnet-flow" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
export const label = (x: number, y: number, text: string, className = 'csnet-packet-label') => (
  <text x={x} y={y} className={className}>
    {text}
  </text>
);
export const arrow = (
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  className = 'csnet-flow',
) => <line x1={x1} y1={y1} x2={x2} y2={y2} className={className} markerEnd={`url(#${id}-arrow)`} />;
