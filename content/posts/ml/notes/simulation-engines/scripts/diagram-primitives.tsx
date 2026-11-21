import type { ReactNode } from 'react';

export const diagramWidth = 900;

export function MathLabel({
  x,
  y,
  width,
  height = 30,
  className = '',
  tex,
}: {
  x: number;
  y: number;
  width: number;
  height?: number;
  className?: string;
  tex: string;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div className={`sim-math-label ${className}`}>{`\\(${tex}\\)`}</div>
    </foreignObject>
  );
}

export function Figure({
  id,
  title,
  description,
  caption,
  width = diagramWidth,
  height,
  children,
}: {
  id: string;
  title: string;
  description: string;
  caption: string;
  width?: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <figure className="sim-figure">
      <div className="sim-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <defs>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 10 8"
              refX="9"
              refY="4"
              markerWidth="7"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0 0 10 4 0 8Z" className="sim-arrowhead" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
