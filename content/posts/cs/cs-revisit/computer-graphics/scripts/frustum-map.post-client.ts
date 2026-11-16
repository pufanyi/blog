import { depthNdc, outline, position, segment, stages } from './frustum-model';

export function enhancePost(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  for (const root of container.querySelectorAll<HTMLElement>('[data-frustum-map]')) {
    const controls = root.querySelector<HTMLElement>('.fm-controls');
    const progress = root.querySelector<HTMLInputElement>('[data-fm-progress]');
    const slider = root.querySelector<HTMLInputElement>('[data-fm-slider]');
    const play = root.querySelector<HTMLButtonElement>('[data-fm-play]');
    const status = root.querySelector<HTMLElement>('[data-fm-status]');
    const values = root.querySelector<HTMLOutputElement>('[data-fm-values]');
    if (!controls || !progress || !slider || !play || !status || !values) continue;
    const events = new AbortController();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let running = false;
    let stage = -1;
    function stop() {
      cancelAnimationFrame(frame);
      running = false;
      if (play) play.textContent = '播放全过程';
    }
    function render() {
      if (!progress || !slider || !status || !values) return;
      const t = Number(progress.value);
      const d = Number(slider.value);
      for (const panel of root.querySelectorAll<SVGSVGElement>('[data-fm-panel]')) {
        const source = panel.dataset['fmPanel'] === 'source';
        const p = (x: number, depth: number) => position(x, depth, t, source);
        panel.querySelector('[data-fm-outline]')?.setAttribute('points', outline(t, source));
        for (const slice of panel.querySelectorAll<SVGPathElement>('[data-fm-depth]')) {
          const depth = Number(slice.dataset['fmDepth']);
          slice.setAttribute('d', segment(p(-depth / 2, depth), p(depth / 2, depth)));
        }
        panel.querySelector('[data-fm-ray]')?.setAttribute('d', segment(p(0.25, 1), p(2.5, 10)));
        panel
          .querySelector('[data-fm-selected]')
          ?.setAttribute('d', segment(p(-d / 2, d), p(d / 2, d)));
        for (const point of panel.querySelectorAll<SVGGElement>('[data-fm-point]')) {
          const depth = Number(point.dataset['fmPoint']);
          point.setAttribute('transform', `translate(${p(depth / 4, depth).join(' ')})`);
        }
      }
      const next = t === 0 ? 0 : t <= 1 ? 1 : 2;
      if (next !== stage) {
        status.textContent = stages[next];
        stage = next;
      }
      for (const button of root.querySelectorAll<HTMLButtonElement>('[data-fm-step]'))
        button.setAttribute('aria-pressed', String(Number(button.dataset['fmStep']) === t));
      values.textContent = `d = ${d.toFixed(1)}；半宽 = ${(d / 2).toFixed(2)} → 1；最终 NDC 深度 = ${depthNdc(d).toFixed(3)}；w = ${d.toFixed(1)}`;
    }
    const options = { signal: events.signal };
    progress.addEventListener(
      'input',
      () => {
        stop();
        render();
      },
      options,
    );
    slider.addEventListener('input', render, options);
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-fm-step]'))
      button.addEventListener(
        'click',
        () => {
          stop();
          progress.value = button.dataset['fmStep'] ?? '2';
          render();
        },
        options,
      );
    play.addEventListener(
      'click',
      () => {
        if (running) {
          stop();
          return;
        }
        if (motion.matches) {
          progress.value = '2';
          render();
          return;
        }
        running = true;
        play.textContent = '暂停';
        const initial = Number(progress.value) >= 2 ? 0 : Number(progress.value);
        const start = performance.now();
        function tick(now: number) {
          if (!progress || !running) return;
          progress.value = String(Math.min(2, initial + (now - start) / 3000));
          render();
          if (Number(progress.value) >= 2) stop();
          else frame = requestAnimationFrame(tick);
        }
        frame = requestAnimationFrame(tick);
      },
      options,
    );
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) stop();
      },
      options,
    );
    motion.addEventListener(
      'change',
      () => {
        if (motion.matches) {
          stop();
          progress.value = '2';
          render();
        }
      },
      options,
    );
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) stop();
    });
    observer.observe(root);
    controls.hidden = false;
    root.dataset['fmReady'] = 'true';
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
