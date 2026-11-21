import type { ReactNode } from 'react';

export function Formula({ children }: { children: string }) {
  return <span className="math-inline">{`\\(${children}\\)`}</span>;
}

export function Label({
  x,
  y,
  width,
  height = 28,
  kind = 'label',
  children,
}: {
  x: number;
  y: number;
  width: number;
  height?: number;
  kind?: 'label' | 'note' | 'heading';
  children: ReactNode;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div className={`flash-svg-label flash-svg-${kind}`}>
        <span className="flash-svg-content">{children}</span>
      </div>
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
  caption: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="flash-figure" id={id}>
      <div
        className="flash-scroll"
        role="region"
        aria-label={`${title}，窄屏可横向滚动`}
        tabIndex={0}
      >
        <svg
          className="flash-diagram"
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 680 ${height}`}
          width="680"
          height={height}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <defs>
            <marker
              id={`${id}-arrow`}
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 7 3.5 L 0 7 Z" className="flash-arrowhead" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <div className="flash-scroll-hint">左右滑动查看完整示意图</div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function Box({
  x,
  y,
  width,
  label,
  note,
  tone = 'neutral',
}: {
  x: number;
  y: number;
  width: number;
  label: ReactNode;
  note?: ReactNode;
  tone?: string;
}) {
  return (
    <g className={`flash-${tone}`}>
      <rect x={x} y={y} width={width} height={note ? 58 : 38} rx="5" className="flash-box" />
      <Label x={x + 4} y={y + 2} width={width - 8} height={34}>
        {label}
      </Label>
      {note && (
        <Label x={x + 4} y={y + 35} width={width - 8} height={20} kind="note">
          {note}
        </Label>
      )}
    </g>
  );
}

export function Arrow({
  id,
  path,
  dashed = false,
}: {
  id: string;
  path: string;
  dashed?: boolean;
}) {
  return (
    <path
      d={path}
      className={`flash-line${dashed ? ' flash-dashed' : ''}`}
      markerEnd={`url(#${id}-arrow)`}
    />
  );
}
