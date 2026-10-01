import { journeySteps } from './journey-model';

function bindJourney(root: HTMLElement): () => void {
  const view = root.ownerDocument.defaultView;
  if (!view) return () => undefined;
  const abort = new view.AbortController();
  const controls = root.querySelector<HTMLElement>('[data-journey-controls]')!;
  const status = root.querySelector<HTMLElement>('[data-journey-status]')!;
  const focus = root.querySelector<SVGRectElement>('[data-journey-focus]')!;
  const bits = root.querySelector<SVGGElement>('[data-journey-bits]')!;
  const scroll = root.querySelector<HTMLElement>('.csnet-scroll')!;
  const progress = root.querySelector<HTMLInputElement>('[data-journey-progress]')!;
  const button = (action: string) =>
    root.querySelector<HTMLButtonElement>(`[data-journey-action="${action}"]`)!;
  const play = button('play');
  let index = 0;
  let timer: number | undefined;
  let visible = true;
  const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const pause = () => {
    view.clearTimeout(timer);
    timer = undefined;
    delete root.dataset['journeyPlaying'];
    play.textContent = index === journeySteps.length - 1 ? '重播' : '播放';
    play.setAttribute('aria-pressed', 'false');
    status.setAttribute('aria-live', 'polite');
  };
  const render = () => {
    const step = journeySteps[index];
    status.textContent = `${index + 1} / ${journeySteps.length} · ${step.title}。${step.text}`;
    ['x', 'y', 'width', 'height'].forEach((key, i) =>
      focus.setAttribute(key, String(step.focus[i])),
    );
    const link = [1, 5, 7].includes(index);
    bits.setAttribute('visibility', link ? 'visible' : 'hidden');
    bits.setAttribute('transform', `translate(${step.focus[0] + 8} 300)`);
    if (scroll.scrollWidth > scroll.clientWidth) {
      const scale = focus.ownerSVGElement!.getBoundingClientRect().width / 760;
      scroll.scrollLeft = (step.focus[0] + step.focus[2] / 2) * scale - scroll.clientWidth / 2;
    }
    progress.value = String(index);
    progress.setAttribute('aria-valuetext', `${index + 1} / ${journeySteps.length}：${step.title}`);
    if (timer === undefined) play.textContent = index === journeySteps.length - 1 ? '重播' : '播放';
    button('previous').disabled = index === 0;
    button('next').disabled = index === journeySteps.length - 1;
    root.dataset['journeyStep'] = String(index);
  };
  const seek = (value: number) => {
    pause();
    index = Math.max(0, Math.min(journeySteps.length - 1, value));
    render();
  };
  const schedule = () => {
    timer = view.setTimeout(
      () => {
        if (!visible || root.ownerDocument.hidden) {
          pause();
          return;
        }
        index++;
        render();
        if (index === journeySteps.length - 1) pause();
        else schedule();
      },
      motion.matches ? 6500 : 4500,
    );
  };
  controls.addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof view.Element)) return;
      const action =
        event.target.closest<HTMLElement>('[data-journey-action]')?.dataset['journeyAction'];
      if (action === 'previous') seek(index - 1);
      if (action === 'next') seek(index + 1);
      if (action === 'reset') seek(0);
      if (action === 'play') {
        if (timer !== undefined) {
          pause();
          return;
        }
        if (!visible || root.ownerDocument.hidden) return;
        if (index === journeySteps.length - 1) seek(0);
        root.dataset['journeyPlaying'] = 'true';
        play.textContent = '暂停';
        play.setAttribute('aria-pressed', 'true');
        status.setAttribute('aria-live', 'off');
        schedule();
      }
    },
    { signal: abort.signal },
  );
  progress.addEventListener('input', () => seek(Number(progress.value)), { signal: abort.signal });
  root.ownerDocument.addEventListener(
    'visibilitychange',
    () => {
      if (root.ownerDocument.hidden) pause();
    },
    { signal: abort.signal },
  );
  motion.addEventListener('change', pause, { signal: abort.signal });
  const observer = new view.IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (!visible) pause();
  });
  observer.observe(root);
  controls.hidden = false;
  status.hidden = false;
  focus.setAttribute('visibility', 'visible');
  render();
  return () => {
    pause();
    abort.abort();
    observer.disconnect();
    controls.hidden = true;
    status.hidden = true;
    focus.setAttribute('visibility', 'hidden');
    bits.setAttribute('visibility', 'hidden');
    delete root.dataset['journeyStep'];
  };
}

export function enhancePost(container: HTMLElement): () => void {
  const cleanups = Array.from(
    container.querySelectorAll<HTMLElement>('[data-journey]'),
    bindJourney,
  );
  return () => cleanups.forEach((cleanup) => cleanup());
}
