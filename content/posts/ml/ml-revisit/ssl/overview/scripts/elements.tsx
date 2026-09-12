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

export function Arrow({ id, d, update = false }: { id: string; d: string; update?: boolean }) {
  return <path d={d} className={`ssl-edge${update ? ' ssl-update' : ''}`} markerEnd={`url(#${id}-arrow)`} />;
}

export function MathLabel({ x, y, width, tex }: { x: number; y: number; width: number; tex: string }) {
  return (
    <foreignObject x={x} y={y} width={width} height="40">
      <div className="ssl-math">{`\\(${tex}\\)`}</div>
    </foreignObject>
  );
}
