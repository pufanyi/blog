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

const MAX_BOX_INTERSECTIONS = 6;

export function enhancePost(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  for (const root of container.querySelectorAll<HTMLElement>('[data-block-coverage]')) {
    const doc = root.ownerDocument;
    const view = doc.defaultView;
    if (!view) continue;

    const controls = root.querySelector<HTMLElement>('.cg-tri-controls');
    if (!controls) continue;

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

      // 1. Global active block selection frame
      setAttr('[data-tri-active-frame]', 'x', toGlobalSvgX(block.x0) + 1);
      setAttr('[data-tri-active-frame]', 'y', toGlobalSvgY(block.y0 + BLOCK_SIZE) + 1);

      // 2. Preset toggle buttons
      for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-tri-preset]')) {
        const isCurrent = btn.dataset['triPreset'] === block.key;
        btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      }

      // 3. Zoom panel root role, title, and heading
      setAttr('[data-tri-zoom-root]', 'data-role', block.classification);
      setText(
        '#cg-tri-zoom-title',
        `局部放大：区块 (${block.bx}, ${block.by}) 的采样包围盒 [x_l, x_r] × [y_l, y_r] 与 ${decision.badgeText} 判定`,
      );
      setText(
        '[data-tri-zoom-heading]',
        `局部放大：区块 (${block.bx}, ${block.by}) · ${decision.badgeText}`,
      );

      // 4. Zoom 4x4 cells and 16 sample dots
      for (const sample of block.samples) {
        const cellKey = `${sample.localCol},${sample.localRow}`;
        const covered = sample.inside ? 'true' : 'false';
        setAttr(`[data-tri-zcell="${cellKey}"]`, 'data-covered', covered);
        setAttr(`[data-tri-zpt="${cellKey}"]`, 'data-covered', covered);
      }

      // 5. Clipped triangle inside zoom window
      const zoomTriPoints = TRIANGLE_VERTICES.map(
        (v) => `${fmt(toZoomSvgX(v.x, block.x0))},${fmt(toZoomSvgY(v.y, block.y0))}`,
      ).join(' ');
      setAttr('[data-tri-ztriangle-fill]', 'points', zoomTriPoints);
      setAttr('[data-tri-ztriangle-stroke]', 'points', zoomTriPoints);

      // 6. Sample bounding box role & edge-box intersection markers
      setAttr('[data-tri-zsample-box]', 'data-role', block.classification);
      for (let idx = 0; idx < MAX_BOX_INTERSECTIONS; idx++) {
        const hit = block.sampleBoxIntersections[idx];
        const selector = `[data-tri-zhit="${idx}"]`;
        if (hit) {
          const hx = toZoomSvgX(hit.x, block.x0);
          const hy = toZoomSvgY(hit.y, block.y0);
          setAttr(selector, 'transform', `translate(${fmt(hx)} ${fmt(hy)})`);
          setAttr(selector, 'visibility', 'visible');
        } else {
          setAttr(selector, 'visibility', 'hidden');
        }
      }

      // 7. Coordinate ticks and sample box bounds
      for (let i = 0; i <= BLOCK_SIZE; i++) {
        setText(`[data-tri-zx-tick="${i}"]`, String(block.x0 + i));
        setText(`[data-tri-zy-tick="${i}"]`, String(block.y0 + i));
      }
      setText('[data-tri-zx-min]', `xₗ = ${fmt(block.sampleBox.xMin)}`);
      setText('[data-tri-zx-max]', `xᵣ = ${fmt(block.sampleBox.xMax)}`);
      setText('[data-tri-zy-min]', `yₗ = ${fmt(block.sampleBox.yMin)}`);
      setText('[data-tri-zy-max]', `yᵣ = ${fmt(block.sampleBox.yMax)}`);

      // 8. Decision card and live readout
      setAttr('[data-tri-card-bg]', 'data-role', block.classification);
      setText('[data-tri-step1]', decision.step1);
      setText('[data-tri-step2]', decision.step2);
      setAttr('[data-tri-verdict]', 'data-role', block.classification);
      setText('[data-tri-verdict]', decision.verdict);
      setText('[data-tri-readout-title]', decision.readoutTitle);
      setText('[data-tri-readout-note]', decision.boxDiffNote);
    };

    const options = { signal: events.signal };

    for (const hitRect of root.querySelectorAll<SVGRectElement>('[data-tri-block]')) {
      hitRect.addEventListener(
        'click',
        () => {
          const [bxStr, byStr] = (hitRect.dataset['triBlock'] ?? '2,3').split(',');
          activeBx = Number(bxStr);
          activeBy = Number(byStr);
          render();
        },
        options,
      );
    }

    for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-tri-preset]')) {
      btn.addEventListener(
        'click',
        () => {
          const [bxStr, byStr] = (btn.dataset['triPreset'] ?? '2,3').split(',');
          activeBx = Number(bxStr);
          activeBy = Number(byStr);
          render();
        },
        options,
      );
    }

    controls.hidden = false;
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
