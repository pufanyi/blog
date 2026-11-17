import {
  BRESENHAM_STEPS,
  computeZoomGeometry,
  DEFAULT_STEP,
  fmt,
  GRID_COLS,
  getGlobalCellRole,
  toGlobalX,
  toGlobalY,
} from './bresenham-model';

const STEP_INTERVAL_MS = 700;

export function enhancePost(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  for (const root of container.querySelectorAll<HTMLElement>('[data-bresenham]')) {
    const doc = root.ownerDocument;
    const view = doc.defaultView;
    if (!view) continue;

    const controls = root.querySelector<HTMLElement>('.cg-bres-controls');
    const playBtn = root.querySelector<HTMLButtonElement>('[data-bres-play]');
    const prevBtn = root.querySelector<HTMLButtonElement>('[data-bres-prev]');
    const nextBtn = root.querySelector<HTMLButtonElement>('[data-bres-next]');
    const slider = root.querySelector<HTMLInputElement>('[data-bres-slider]');
    const output = root.querySelector<HTMLOutputElement>('[data-bres-output]');
    if (!controls || !playBtn || !prevBtn || !nextBtn || !slider || !output) continue;

    const events = new view.AbortController();
    const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
    let currentStep = DEFAULT_STEP;
    let timer: number | undefined;

    const setAttr = (selector: string, name: string, value: string | number) => {
      root.querySelector(selector)?.setAttribute(name, String(value));
    };
    const setText = (selector: string, value: string) => {
      const el = root.querySelector(selector);
      if (el) el.textContent = value;
    };

    const stop = () => {
      if (timer !== undefined) {
        view.clearInterval(timer);
        timer = undefined;
      }
      playBtn.setAttribute('aria-pressed', 'false');
      playBtn.textContent = currentStep === GRID_COLS - 1 ? '重播' : '播放';
    };

    const render = () => {
      const zoom = computeZoomGeometry(currentStep);
      const { step, winX0, winY0 } = zoom;

      // 1. Global grid cells
      for (const group of root.querySelectorAll<SVGGElement>('[data-bres-cell]')) {
        const [colStr, rowStr] = (group.dataset['bresCell'] ?? '0,0').split(',');
        const role = getGlobalCellRole(Number(colStr), Number(rowStr), currentStep);
        group.dataset['role'] = role;
        const rect = group.querySelector<SVGRectElement>('rect');
        if (rect) rect.dataset['role'] = role;
        const dot = group.querySelector<SVGCircleElement>('circle');
        if (dot) dot.setAttribute('r', role === 'empty' ? '1.15' : '2.1');
      }

      // 2. Global scan line, window, badge, and intersection
      const scanX = toGlobalX(step.sampleX);
      const hitY = toGlobalY(step.exactY);
      setAttr('[data-bres-window]', 'x', toGlobalX(winX0));
      setAttr('[data-bres-window]', 'y', toGlobalY(winY0 + 2));
      setAttr('[data-bres-scan]', 'x1', scanX);
      setAttr('[data-bres-scan]', 'x2', scanX);
      setAttr('[data-bres-scan-badge]', 'transform', `translate(${scanX} ${toGlobalY(0) + 36})`);
      setText('[data-bres-scan-text]', `x = ${fmt(step.sampleX)}`);
      setAttr('[data-bres-hit]', 'cx', scanX);
      setAttr('[data-bres-hit]', 'cy', hitY);

      // 3. Zoom panel cells & geometry
      setText('[data-bres-zoom-heading]', `局部放大：列中心 x = ${fmt(step.sampleX)}`);
      for (const zgroup of root.querySelectorAll<SVGGElement>('[data-bres-zcell]')) {
        const [cOff, rOff] = (zgroup.dataset['bresZcell'] ?? '0,0').split(',').map(Number);
        const role = zoom.cellRoles[cOff]?.[rOff] ?? 'empty';
        zgroup.dataset['role'] = role;
        const rect = zgroup.querySelector<SVGRectElement>('rect');
        if (rect) rect.dataset['role'] = role;
      }

      setAttr('[data-bres-zscan]', 'x1', zoom.activeCenterX);
      setAttr('[data-bres-zscan]', 'x2', zoom.activeCenterX);
      setAttr('[data-bres-zrise]', 'visibility', step.index === 0 ? 'hidden' : 'visible');
      setAttr('[data-bres-zrise-base]', 'x1', zoom.prevCenterX);
      setAttr('[data-bres-zrise-base]', 'y1', zoom.prevExactSvgY);
      setAttr('[data-bres-zrise-base]', 'x2', zoom.riseX);
      setAttr('[data-bres-zrise-base]', 'y2', zoom.prevExactSvgY);
      setAttr('[data-bres-zrise-vec]', 'x1', zoom.riseX);
      setAttr('[data-bres-zrise-vec]', 'y1', zoom.prevExactSvgY);
      setAttr('[data-bres-zrise-vec]', 'x2', zoom.riseX);
      setAttr('[data-bres-zrise-vec]', 'y2', zoom.exactSvgY);
      setAttr('[data-bres-zrise-cap]', 'x1', zoom.riseX);
      setAttr('[data-bres-zrise-cap]', 'y1', zoom.exactSvgY);
      setAttr('[data-bres-zrise-cap]', 'x2', zoom.activeCenterX);
      setAttr('[data-bres-zrise-cap]', 'y2', zoom.exactSvgY);
      setAttr('[data-bres-zprev-hit]', 'cx', zoom.prevCenterX);
      setAttr('[data-bres-zprev-hit]', 'cy', zoom.prevExactSvgY);
      setAttr('[data-bres-zrise-label]', 'x', zoom.riseX - 5);
      setAttr('[data-bres-zrise-label]', 'y', (zoom.prevExactSvgY + zoom.exactSvgY) / 2 + 4);

      setAttr('[data-bres-zline]', 'x1', zoom.idealLine.x1);
      setAttr('[data-bres-zline]', 'y1', zoom.idealLine.y1);
      setAttr('[data-bres-zline]', 'x2', zoom.idealLine.x2);
      setAttr('[data-bres-zline]', 'y2', zoom.idealLine.y2);

      const snapHidden = Math.abs(zoom.exactSvgY - zoom.chosenCenterSvgY) < 4;
      setAttr('[data-bres-zsnap]', 'visibility', snapHidden ? 'hidden' : 'visible');
      setAttr('[data-bres-zsnap]', 'x1', zoom.activeCenterX);
      setAttr('[data-bres-zsnap]', 'y1', zoom.exactSvgY);
      setAttr('[data-bres-zsnap]', 'x2', zoom.activeCenterX);
      setAttr(
        '[data-bres-zsnap]',
        'y2',
        zoom.chosenCenterSvgY + (zoom.chosenCenterSvgY > zoom.exactSvgY ? -5 : 5),
      );

      setAttr('[data-bres-zchosen]', 'cx', zoom.activeCenterX);
      setAttr('[data-bres-zchosen]', 'cy', zoom.chosenCenterSvgY);
      setAttr('[data-bres-zhit]', 'cx', zoom.activeCenterX);
      setAttr('[data-bres-zhit]', 'cy', zoom.exactSvgY);
      setAttr('[data-bres-zexact]', 'x', zoom.exactLabelX);
      setAttr('[data-bres-zexact]', 'y', zoom.exactLabelY);
      setAttr('[data-bres-zexact]', 'text-anchor', zoom.exactLabelAnchor);
      setText('[data-bres-zexact]', `y = ${fmt(step.exactY)}`);

      // 4. Zoom axis ticks and callouts
      setText('[data-bres-zy-top]', String(winY0 + 2));
      setText('[data-bres-zy-mid]', String(winY0 + 1));
      setText('[data-bres-zy-bot]', String(winY0));
      setText('[data-bres-zx0]', String(winX0));
      setText('[data-bres-zx1]', String(winX0 + 1));
      setText('[data-bres-zx2]', String(winX0 + 2));

      const zc0 = root.querySelector<SVGTextElement>('[data-bres-zc0]');
      const zc1 = root.querySelector<SVGTextElement>('[data-bres-zc1]');
      if (zc0) {
        zc0.textContent = zoom.activeColIndex === 0 ? `x = ${fmt(winX0 + 0.5)}` : fmt(winX0 + 0.5);
        zc0.classList.toggle('is-active', zoom.activeColIndex === 0);
      }
      if (zc1) {
        zc1.textContent = zoom.activeColIndex === 1 ? `x = ${fmt(winX0 + 1.5)}` : fmt(winX0 + 1.5);
        zc1.classList.toggle('is-active', zoom.activeColIndex === 1);
      }

      setText('[data-bres-upper-center]', `中心 ${fmt(winY0 + 1.5)}`);
      const upperStatus = root.querySelector<SVGTextElement>('[data-bres-upper-status]');
      if (upperStatus) {
        upperStatus.textContent = zoom.upperStatus;
        upperStatus.classList.toggle('is-selected', step.steppedUp);
      }
      setText('[data-bres-boundary-title]', `分界 y = ${winY0 + 1}`);
      setText('[data-bres-lower-center]', `中心 ${fmt(winY0 + 0.5)}`);
      const lowerStatus = root.querySelector<SVGTextElement>('[data-bres-lower-status]');
      if (lowerStatus) {
        lowerStatus.textContent = zoom.lowerStatus;
        lowerStatus.classList.toggle('is-selected', !step.steppedUp);
      }

      // 5. Formula readout & controls
      setText('[data-bres-formula-x]', `采样中心 x = ${fmt(step.sampleX)}（第 ${step.x} 列）`);
      setText(
        '[data-bres-formula-y]',
        `直线高度 ${fmt(step.exactY)} → ⌊${fmt(step.exactY)}⌋ + 0.5 = ${fmt(step.centerY)}`,
      );
      setText('[data-bres-formula-decision]', zoom.decisionSummary);

      slider.value = String(currentStep);
      const pct = Math.round((currentStep / (GRID_COLS - 1)) * 100);
      slider.style.setProperty('--bres-progress', `${pct}%`);
      slider.setAttribute(
        'aria-valuetext',
        `第 ${currentStep + 1} 列（共 ${GRID_COLS} 列）：x = ${fmt(step.sampleX)}，选像素 (${step.x}, ${step.y})`,
      );
      output.textContent = `第 ${step.x + 1} / ${GRID_COLS} 列 · (${step.x}, ${step.y})`;
      prevBtn.disabled = currentStep === 0;
      nextBtn.disabled = currentStep === GRID_COLS - 1;
      if (timer === undefined) {
        playBtn.textContent = currentStep === GRID_COLS - 1 ? '重播' : '播放';
      }
    };

    const options = { signal: events.signal };

    prevBtn.addEventListener(
      'click',
      () => {
        stop();
        currentStep = Math.max(0, currentStep - 1);
        render();
      },
      options,
    );

    nextBtn.addEventListener(
      'click',
      () => {
        stop();
        currentStep = Math.min(BRESENHAM_STEPS.length - 1, currentStep + 1);
        render();
      },
      options,
    );

    slider.addEventListener(
      'input',
      () => {
        stop();
        currentStep = Number(slider.value);
        render();
      },
      options,
    );

    for (const colHit of root.querySelectorAll<SVGRectElement>('[data-bres-col]')) {
      colHit.addEventListener(
        'click',
        () => {
          const col = Number(colHit.dataset['bresCol']);
          if (Number.isInteger(col) && col >= 0 && col < BRESENHAM_STEPS.length) {
            stop();
            currentStep = col;
            render();
          }
        },
        options,
      );
    }

    playBtn.addEventListener(
      'click',
      () => {
        if (timer !== undefined) {
          stop();
          return;
        }
        if (motion.matches) {
          currentStep = currentStep >= BRESENHAM_STEPS.length - 1 ? 0 : BRESENHAM_STEPS.length - 1;
          render();
          return;
        }
        if (currentStep >= BRESENHAM_STEPS.length - 1) {
          currentStep = 0;
          render();
        }
        playBtn.setAttribute('aria-pressed', 'true');
        playBtn.textContent = '暂停';
        timer = view.setInterval(() => {
          if (currentStep >= BRESENHAM_STEPS.length - 1) {
            stop();
            return;
          }
          currentStep += 1;
          render();
          if (currentStep >= BRESENHAM_STEPS.length - 1) {
            stop();
          }
        }, STEP_INTERVAL_MS);
      },
      options,
    );

    doc.addEventListener(
      'visibilitychange',
      () => {
        if (doc.hidden) stop();
      },
      options,
    );

    motion.addEventListener(
      'change',
      () => {
        if (motion.matches) stop();
      },
      options,
    );

    const observer = new view.IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) stop();
    });
    observer.observe(root);

    controls.hidden = false;
    root.dataset['bresReady'] = 'true';
    render();

    cleanups.push(() => {
      stop();
      events.abort();
      observer.disconnect();
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
