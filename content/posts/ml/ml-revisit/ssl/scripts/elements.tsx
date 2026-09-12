import type { ReactNode } from 'react';

export function Figure({
  id, title, description, caption, height, children,
}: {
  id: string;
  title: string;
  description: string;
  caption: string;
  height: number;
  children: ReactNode;
}) {
  return (
    <figure className="ssl-figure">
      <div className="ssl-scroll" tabIndex={0} role="region" aria-label={`${title}；窄屏可横向滚动`}>
        <svg className="ssl-diagram" width="660" height={height} viewBox={`0 0 660 ${height}`}
          role="img" aria-labelledby={`${id}-title ${id}-desc`}>
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <defs>
            <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 Z" className="ssl-arrowhead" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <p className="ssl-scroll-hint" data-agent-omit="true">窄屏可横向滚动查看完整示意图</p>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function Label({ x, y, children, note = false }: {
  x: number; y: number; children: ReactNode; note?: boolean;
}) {
  return <text x={x} y={y} className={note ? 'ssl-note' : 'ssl-label'}>{children}</text>;
}

export function Box({ x, y, width = 148, height = 52, label, sub, tone = 'blue' }: {
  x: number; y: number; width?: number; height?: number; label: string; sub?: string;
  tone?: 'blue' | 'teal' | 'clay' | 'neutral';
}) {
  return (
    <g className={`ssl-${tone}`}>
      <rect x={x} y={y} width={width} height={height} rx="5" className="ssl-box" />
      <Label x={x + width / 2} y={y + height / 2 + (sub ? -4 : 4)}>{label}</Label>
      {sub && <Label x={x + width / 2} y={y + height / 2 + 15} note>{sub}</Label>}
    </g>
  );
}

export function Arrow({ id, d, update = false, gradient = false }: {
  id: string; d: string; update?: boolean; gradient?: boolean;
}) {
  // SVG marker-end only marks the last subpath. Render disconnected flow
  // segments separately so every destination has its own arrowhead.
  return <g>{d.split(/(?=[Mm])/).filter(Boolean).map((segment, i) => (
    <path key={i} d={segment} className={`ssl-edge${update ? ' ssl-update' : ''}${gradient ? ' ssl-gradient' : ''}`} markerEnd={`url(#${id}-arrow)`} />
  ))}</g>;
}

export function MathLabel({ x, y, width, height = 40, tex }: { x: number; y: number; width: number; height?: number; tex: string }) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div className="ssl-math">{`\\(${tex}\\)`}</div>
    </foreignObject>
  );
}

export function Vector({ x, y, tone = 'blue', values = [12, 23, 17, 29] }: {
  x: number; y: number; tone?: 'blue' | 'teal' | 'clay'; values?: readonly number[];
}) {
  return <g className={`ssl-${tone}`} aria-hidden="true">
    {values.map((height, i) => (
      <rect key={i} x={x + i * 9} y={y + 30 - height} width="6" height={height} className="ssl-vector-bar" />
    ))}
  </g>;
}

export function ImageTile({ x, y, size = 56, local = false, masked = false }: {
  x: number; y: number; size?: number; local?: boolean; masked?: boolean;
}) {
  // The same simple scene identifies related views without using image assets.
  return <g transform={`translate(${x} ${y}) scale(${size / 56})`} aria-hidden="true">
    <rect width="56" height="56" rx="4" className="ssl-image-bg" />
    <circle cx={local ? 18 : 40} cy="15" r="6" className="ssl-image-sun" />
    <path d={local ? 'M 2 48 L 25 8 L 54 48 Z' : 'M 3 48 L 21 21 L 34 39 L 43 28 L 53 48 Z'} className="ssl-image-land" />
    {masked && [1, 4, 6].map(index => <rect key={index} x={2 + (index % 3) * 18} y={2 + Math.floor(index / 3) * 18} width="16" height="16" className="ssl-masked ssl-image-mask" />)}
  </g>;
}
