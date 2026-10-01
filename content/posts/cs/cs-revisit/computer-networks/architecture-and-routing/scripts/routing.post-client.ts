import {
  costLabel,
  dijkstraFrames,
  distanceVectorFrames,
  failureFrames,
  prefixLookup,
} from './routing-model';

function bindPlayer(root: HTMLElement): () => void {
  const view = root.ownerDocument.defaultView;
  if (!view) return () => undefined;
  const abort = new view.AbortController();
  const get = <T extends Element = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!;
  const kind = root.dataset['routingPlayer'];
  const mode = root.querySelector<HTMLSelectElement>('[data-poison-mode]');
  const buildFrames = () =>
    kind === 'dv'
      ? distanceVectorFrames()
      : kind === 'failure'
        ? failureFrames(mode?.value === 'poison')
        : dijkstraFrames();
  let frames = buildFrames();
  let index = 0;
  let timer: number | undefined;
  let visible = true;
  const play = get<HTMLButtonElement>('[data-action="play"]');
  const progress = get<HTMLInputElement>('[data-progress]');
  const stage = get('[data-player-stage]');
  const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const pause = () => {
    view.clearTimeout(timer);
    timer = undefined;
    play.textContent = index === frames.length - 1 ? '重播' : '播放';
    play.setAttribute('aria-pressed', 'false');
    stage.setAttribute('aria-live', 'polite');
  };
  const render = () => {
    const frame = frames[index];
    get('[data-frame-title]').textContent = frame.title;
    get('[data-frame-explanation]').textContent = frame.explanation;
    get('[data-frame-description]').textContent = frame.explanation;
    get('[data-frame-progress]').textContent = `${index + 1} / ${frames.length}`;
    for (const element of root.querySelectorAll('[data-node-cost]')) {
      const id = element.getAttribute('data-node-cost')!;
      element.textContent = costLabel(frame.routes[id].cost);
    }
    for (const element of root.querySelectorAll('[data-route-edge]')) {
      const edge = element.getAttribute('data-route-edge');
      element.setAttribute(
        'visibility',
        frame.arrows.some(([from, to]) => `${from}-${to}` === edge) ? 'visible' : 'hidden',
      );
    }
    for (const element of root.querySelectorAll('[data-settled-node]')) {
      element.classList.toggle(
        'csnet-settled',
        frame.settled.includes(element.getAttribute('data-settled-node')!),
      );
    }
    root
      .querySelector('[data-failed-link]')
      ?.setAttribute('visibility', frame.failed ? 'visible' : 'hidden');
    progress.max = String(frames.length - 1);
    progress.value = String(index);
    progress.setAttribute('aria-valuetext', `${index + 1} / ${frames.length}：${frame.title}`);
    get<HTMLButtonElement>('[data-action="previous"]').disabled = index === 0;
    get<HTMLButtonElement>('[data-action="next"]').disabled = index === frames.length - 1;
    root.dataset['step'] = String(index);
  };
  const seek = (value: number) => {
    pause();
    index = Math.max(0, Math.min(frames.length - 1, value));
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
        if (index === frames.length - 1) pause();
        else schedule();
      },
      motion.matches ? 3500 : 1800,
    );
  };
  root.addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof view.Element)) return;
      const action = event.target.closest<HTMLElement>('[data-action]')?.dataset['action'];
      if (action === 'previous') seek(index - 1);
      if (action === 'next') seek(index + 1);
      if (action === 'reset') seek(0);
      if (action === 'play') {
        if (timer !== undefined) {
          pause();
          return;
        }
        if (!visible || root.ownerDocument.hidden) return;
        if (index === frames.length - 1) seek(0);
        play.textContent = '暂停';
        play.setAttribute('aria-pressed', 'true');
        stage.setAttribute('aria-live', 'off');
        schedule();
      }
    },
    { signal: abort.signal },
  );
  progress.addEventListener('input', () => seek(Number(progress.value)), { signal: abort.signal });
  mode?.addEventListener(
    'change',
    () => {
      frames = buildFrames();
      seek(0);
    },
    { signal: abort.signal },
  );
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
  get<HTMLElement>('[data-player-controls]').hidden = false;
  render();
  root.dataset['ready'] = 'true';
  return () => {
    pause();
    abort.abort();
    observer.disconnect();
    get<HTMLElement>('[data-player-controls]').hidden = true;
    delete root.dataset['ready'];
  };
}
function bindPrefix(root: HTMLElement): () => void {
  const view = root.ownerDocument.defaultView;
  if (!view) return () => undefined;
  const abort = new view.AbortController();
  const address = root.querySelector<HTMLInputElement>('[data-address]')!;
  const withdraw = root.querySelector<HTMLInputElement>('[data-withdraw]')!;
  const output = root.querySelector<HTMLElement>('[data-prefix-result]')!;
  const controls = root.querySelector<HTMLElement>('[data-prefix-controls]')!;
  const render = () => {
    const result = prefixLookup(address.value.trim(), withdraw.checked);
    address.setAttribute('aria-invalid', String(result === null));
    root.querySelector('[data-prefix-region-label]')!.textContent = withdraw.checked
      ? '192.0.3.0/24：已撤回'
      : '192.0.3.0/24 → Q';
    output.textContent = result
      ? `${address.value.trim()} → ${result.action}（最长匹配；${withdraw.checked ? '/24 已撤回' : '/24 有效'}）`
      : '请输入四段 0–255 的十进制 IPv4 地址。';
    for (const row of root.querySelectorAll<HTMLElement>('[data-prefix-row]')) {
      const index = Number(row.dataset['prefixRow']);
      const withdrawn = index === 2 && withdraw.checked;
      row.dataset['winner'] = String(result?.winner === index);
      row.querySelector('[data-prefix-status]')!.textContent = withdrawn
        ? '已撤回'
        : result
          ? result.winner === index
            ? '选中'
            : result.matches[index]
              ? '匹配'
              : '不匹配'
          : '等待有效地址';
    }
  };
  root.addEventListener('input', render, { signal: abort.signal });
  root.addEventListener('change', render, { signal: abort.signal });
  controls.hidden = false;
  render();
  root.dataset['ready'] = 'true';
  return () => {
    abort.abort();
    controls.hidden = true;
    delete root.dataset['ready'];
  };
}
export function enhancePost(container: HTMLElement): () => void {
  const cleanups = [
    ...Array.from(container.querySelectorAll<HTMLElement>('[data-routing-player]'), bindPlayer),
    ...Array.from(container.querySelectorAll<HTMLElement>('[data-prefix-explorer]'), bindPrefix),
  ];
  return () => cleanups.forEach((cleanup) => cleanup());
}
