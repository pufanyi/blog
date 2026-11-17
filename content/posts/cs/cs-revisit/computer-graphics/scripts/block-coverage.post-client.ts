import {
  BLOCK_SIZE,
  DEFAULT_BLOCK,
  describeBlockDecision,
  fmt,
  getBlockInfo,
  TRIANGLE_VERTICES,
  toGlobalSvgX,
  toGlobalSvgY,
  toZoomSvgX,
  toZoomSvgY,
} from './block-coverage-model';

export function enhancePost(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  for (const root of container.querySelectorAll<HTMLElement>('[data-block-coverage]')) {
    const doc = root.ownerDocument;
    const view = doc.defaultView;
    if (!view) continue;

    const events = new view.AbortController();
    let activeBx: number = DEFAULT_BLOCK.bx;
    let activeBy: number = DEFAULT_BLOCK.by;

    const setAttr = (selector: string, name: string, value: string | number) => {
      root.querySelector(selector)?.setAttribute(name, String(value));
    };
    const setText = (selector: string, value: string) => {
      const el = root.querySelector(selector);
      if (el) el.textContent = value;
    };

    const render = () => {
      const block = getBlockInfo(activeBx, activeBy);
      const decision = describeBlockDecision(block);

      // 1. Global active block selection frame and button pressed states
      setAttr('[data-tri-active-frame]', 'x', toGlobalSvgX(block.x0) + 1);
      setAttr('[data-tri-active-frame]', 'y', toGlobalSvgY(block.y0 + BLOCK_SIZE) + 1);
      for (const hitRect of root.querySelectorAll<SVGRectElement>('[data-tri-block]')) {
        const isCurrent = hitRect.dataset['triBlock'] === block.key;
        hitRect.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      }

      // 2. Zoom panel root role, title, and heading
      setAttr('[data-tri-zoom-root]', 'data-role', block.classification);
      setText(
        '#cg-tri-zoom-title',
        `局部放大：区块 (${block.bx}, ${block.by}) 的采样包围盒与 ${decision.badgeText} 判定`,
      );
      setText('[data-tri-zoom-heading]', `区块 (${block.bx}, ${block.by}) · ${decision.badgeText}`);

      // 3. Zoom 4x4 cells and 16 sample dots
      for (const sample of block.samples) {
        const cellKey = `${sample.localCol},${sample.localRow}`;
        const covered = sample.inside ? 'true' : 'false';
        setAttr(`[data-tri-zcell="${cellKey}"]`, 'data-covered', covered);
        setAttr(`[data-tri-zpt="${cellKey}"]`, 'data-covered', covered);
      }

      // 4. Clipped triangle inside zoom window
      const zoomTriPoints = TRIANGLE_VERTICES.map(
        (v) => `${fmt(toZoomSvgX(v.x, block.x0))},${fmt(toZoomSvgY(v.y, block.y0))}`,
      ).join(' ');
      setAttr('[data-tri-ztriangle-fill]', 'points', zoomTriPoints);
      setAttr('[data-tri-ztriangle-stroke]', 'points', zoomTriPoints);

      // 5. Sample bounding box role
      setAttr('[data-tri-zsample-box]', 'data-role', block.classification);

      // 6. Coordinate ticks
      for (let i = 0; i <= BLOCK_SIZE; i++) {
        setText(`[data-tri-zx-tick="${i}"]`, String(block.x0 + i));
        setText(`[data-tri-zy-tick="${i}"]`, String(block.y0 + i));
      }

      // 7. Live readout
      setText('[data-tri-readout-title]', decision.readoutTitle);
      setText('[data-tri-readout-note]', decision.boxDiffNote);
    };

    const selectBlock = (key: string | undefined) => {
      const [bxStr, byStr] = (key ?? '2,3').split(',');
      activeBx = Number(bxStr);
      activeBy = Number(byStr);
      render();
    };

    const options = { signal: events.signal };

    for (const hitRect of root.querySelectorAll<SVGRectElement>('[data-tri-block]')) {
      hitRect.addEventListener('click', () => selectBlock(hitRect.dataset['triBlock']), options);
      hitRect.addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'Enter') {
            selectBlock(hitRect.dataset['triBlock']);
          } else if (event.key === ' ') {
            event.preventDefault();
          }
        },
        options,
      );
      hitRect.addEventListener(
        'keyup',
        (event) => {
          if (event.key === ' ') {
            selectBlock(hitRect.dataset['triBlock']);
          }
        },
        options,
      );
    }

    root.dataset['triReady'] = 'true';
    render();

    cleanups.push(() => {
      events.abort();
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
