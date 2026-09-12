import type { ReactNode } from 'react';

export function MathLabel({
  x,
  y,
  width = 80,
  height = 34,
  tex,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  tex: string;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div className="muon-math">{`\\(${tex}\\)`}</div>
    </foreignObject>
  );
}

export function Diagram({
  id,
  title,
  description,
  height,
  caption,
  children,
}: {
  id: string;
  title: string;
  description: string;
  height: number;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure id={id} className="muon-figure">
      <div
        className="muon-scroll"
        role="region"
        aria-label={`${title}，窄屏可横向滚动`}
        tabIndex={0}
      >
        <svg
          className="muon-diagram"
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 660 ${height}`}
          width="660"
          height={height}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          {children}
        </svg>
      </div>
      <div className="muon-scroll-hint">左右滑动查看完整示意图</div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
