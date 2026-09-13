import type { ReactNode } from 'react';
import { IMAGE_PIXELS, IMAGE_SIZE } from './model';

export function MathLabel({
  x,
  y,
  tex,
  width = 120,
  height = 36,
}: {
  x: number;
  y: number;
  tex: string;
  width?: number;
  height?: number;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div className="df-math">{`\\(${tex}\\)`}</div>
    </foreignObject>
  );
}

export function Figure({
  id,
  title,
  description,
  caption,
  height,
  children,
}: {
  id: string;
  title: string;
  description: string;
  caption: string;
  height: number;
  children: ReactNode;
}) {
  return (
    <figure id={id} className="df-figure">
      <div className="df-scroll" role="region" tabIndex={0} aria-label={`${title}，窄屏可横向滚动`}>
        <svg
          className="df-diagram"
          xmlns="http://www.w3.org/2000/svg"
          width="660"
          height={height}
          viewBox={`0 0 660 ${height}`}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <defs>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 8 4 L 0 8 Z" className="df-arrow" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
      <div className="df-scroll-hint">左右滑动查看完整图示</div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function Edge({ id, d, dashed = false }: { id: string; d: string; dashed?: boolean }) {
  return (
    <path
      d={d}
      className={`df-edge${dashed ? ' df-dashed' : ''}`}
      markerEnd={`url(#${id}-arrow)`}
    />
  );
}
export function Box({
  x,
  y,
  width,
  height = 54,
  label,
  tex,
  tone = 'blue',
}: {
  x: number;
  y: number;
  width: number;
  height?: number;
  label: string;
  tex?: string;
  tone?: string;
}) {
  return (
    <g className={`df-${tone}`}>
      <rect x={x} y={y} width={width} height={height} rx="5" className="df-box" />
      <text x={x + width / 2} y={y + (tex ? 21 : height / 2 + 5)} className="df-label">
        {label}
      </text>
      {tex && <MathLabel x={x} y={y + 24} width={width} height={height - 25} tex={tex} />}
    </g>
  );
}
export function Tile({ x, y, size = 90, t }: { x: number; y: number; size?: number; t: number }) {
  const cell = size / IMAGE_SIZE;
  return (
    <g>
      {IMAGE_PIXELS.map((pixel) => {
        const value = t * pixel.data + (1 - t) * pixel.noise;
        const amount = Math.max(0, Math.min(100, ((value + 2) / 4) * 100));
        return (
          <rect
            key={`${pixel.x}-${pixel.y}`}
            x={x + pixel.x * cell}
            y={y + pixel.y * cell}
            width={cell + 0.08}
            height={cell + 0.08}
            fill={`color-mix(in srgb, var(--text-color) ${amount.toFixed(2)}%, var(--paper-bg))`}
          />
        );
      })}
      <rect x={x} y={y} width={size} height={size} className="df-frame" />
    </g>
  );
}
