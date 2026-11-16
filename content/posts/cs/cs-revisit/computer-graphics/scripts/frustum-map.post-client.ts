import { outline, position, segment } from './frustum-model';

export function enhancePost(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  for (const root of container.querySelectorAll<HTMLElement>('[data-frustum-map]')) {
    const controls = root.querySelector<HTMLElement>('.fm-controls');
    const progress = root.querySelector<HTMLInputElement>('[data-fm-progress]');
    const play = root.querySelector<HTMLButtonElement>('[data-fm-play]');
    const valueOutput = root.querySelector<HTMLOutputElement>('[data-fm-value]');
    const resultPanel = root.querySelector<SVGSVGElement>('[data-fm-panel="result"]');
    const resultCaption = root.querySelector<SVGTextElement>('[data-fm-caption]');
    if (!controls || !progress || !play || !valueOutput || !resultPanel) continue;

    const events = new AbortController();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let running = false;

    function stop() {
      cancelAnimationFrame(frame);
      running = false;
      if (play) play.textContent = '播放';
    }

    function render() {
      if (!progress || !valueOutput || !resultPanel) return;
      const t = Number(progress.value);
      const p = (x: number, depth: number) => position(x, depth, t, false);

      resultPanel.querySelector('[data-fm-outline]')?.setAttribute('points', outline(t, false));
      for (const slice of resultPanel.querySelectorAll<SVGPathElement>('[data-fm-depth]')) {
        const depth = Number(slice.dataset['fmDepth']);
        slice.setAttribute('d', segment(p(-depth / 2, depth), p(depth / 2, depth)));
      }
      resultPanel
        .querySelector('[data-fm-ray]')
        ?.setAttribute('d', segment(p(0.25, 1), p(2.5, 10)));
      for (const point of resultPanel.querySelectorAll<SVGGElement>('[data-fm-point]')) {
        const depth = Number(point.dataset['fmPoint']);
        point.setAttribute('transform', `translate(${p(depth / 4, depth).join(' ')})`);
      }

      const pct = Math.round(t * 100);
      progress.style.setProperty('--fm-progress', `${pct}%`);
      valueOutput.textContent =
        t === 0 ? '0% · 原始梯形' : t === 1 ? '100% · NDC 正方形' : `${pct}%`;
      if (resultCaption) {
        resultCaption.textContent =
          t === 0 ? 'near: d = 1 → far: d = 10' : t === 1 ? 'near: −1 → far: +1' : '透视映射过渡中';
      }
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

    play.addEventListener(
      'click',
      () => {
        if (running) {
          stop();
          return;
        }
        if (motion.matches) {
          progress.value = Number(progress.value) >= 1 ? '0' : '1';
          render();
          return;
        }
        running = true;
        play.textContent = '暂停';
        const initial = Number(progress.value) >= 1 ? 0 : Number(progress.value);
        const start = performance.now();
        function tick(now: number) {
          if (!progress || !running) return;
          progress.value = String(Math.min(1, initial + (now - start) / 2400));
          render();
          if (Number(progress.value) >= 1) stop();
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
          progress.value = '1';
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
