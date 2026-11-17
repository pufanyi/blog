import { initialLine } from './bresenham-model';

export function enhancePost(container: HTMLElement): () => void {
  const events = new AbortController();
  for (const root of container.querySelectorAll<HTMLElement>('[data-bresenham]')) {
    const controls = root.querySelector<HTMLElement>('.bres-controls');
    const next = root.querySelector<HTMLButtonElement>('[data-next]');
    const reset = root.querySelector<HTMLButtonElement>('[data-reset]');
    const status = root.querySelector<HTMLElement>('[data-status]');
    if (!controls || !next || !reset || !status) continue;
    let step = 0;
    const render = () => {
      const points = initialLine.points;
      const selected = new Set(points.slice(0, step + 1).map((p) => `${p.x},${p.y}`));
      for (const cell of root.querySelectorAll<SVGRectElement>('[data-cell]')) {
        cell.classList.toggle('bres-selected', selected.has(cell.dataset['cell'] ?? ''));
      }
      const point = points[step];
      if (!point) return;
      next.disabled = step === points.length - 1;
      status.textContent = `像素 ${step + 1}/${points.length} · (${point.x}, ${point.y})${next.disabled ? ' · 完成' : ''}`;
    };
    next.addEventListener(
      'click',
      () => {
        step = Math.min(step + 1, initialLine.points.length - 1);
        render();
      },
      { signal: events.signal },
    );
    reset.addEventListener(
      'click',
      () => {
        step = 0;
        render();
      },
      { signal: events.signal },
    );
    controls.hidden = false;
    render();
  }
  return () => events.abort();
}
