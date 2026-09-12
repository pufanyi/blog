import {
  buildFrames,
  DEFAULT_QUERY,
  GRID_UNIT,
  type KvTileSize,
  partition,
  QUERY_TILES,
  SEQUENCE_LENGTH,
  tokenRange,
} from './model';

function bindPlayer(root: HTMLElement): () => void {
  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view) return () => undefined;
  const abort = new view.AbortController();
  const get = <T extends Element = HTMLElement>(selector: string, parent: Element = root) => {
    const element = parent.querySelector<T>(selector);
    if (!element) throw new Error(`Missing FlashAttention player element: ${selector}`);
    return element;
  };
  const field = (name: string, value: string) => {
    for (const element of root.querySelectorAll(`[data-field="${name}"]`))
      element.textContent = value;
  };
  const play = get<HTMLButtonElement>('[data-action="play"]');
  const previous = get<HTMLButtonElement>('[data-action="previous"]');
  const next = get<HTMLButtonElement>('[data-action="next"]');
  const progress = get<HTMLInputElement>('[data-progress]');
  const sizeInput = get<HTMLSelectElement>('[data-tile-size]');
  const stage = get('[data-stage]');
  let size = Number(sizeInput.value) as KvTileSize;
  let query = DEFAULT_QUERY;
  let frames = buildFrames(size, query);
  let index = 0;
  let timer: number | undefined;
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const algorithm = document.getElementById('flash-forward-algorithm');
  const clearHighlight = () => {
    algorithm
      ?.querySelectorAll('[data-playing-line]')
      .forEach((line) => line.removeAttribute('data-playing-line'));
  };
  const pause = () => {
    view.clearTimeout(timer);
    timer = undefined;
    play.textContent = index === frames.length - 1 ? '重播' : '播放';
    play.setAttribute('aria-pressed', 'false');
    stage.setAttribute('aria-live', 'polite');
  };
  const render = () => {
    const frame = frames[index];
    const started = frame.phase !== 'sequence' && frame.phase !== 'partition';
    const tiles = partition(SEQUENCE_LENGTH, size);
    root.dataset['phase'] = frame.phase;
    root.dataset['step'] = String(index);
    field('progress', `${index + 1} / ${frames.length}`);
    field('title', frame.title);
    field('lines', frame.lineLabel);
    field('explanation', frame.explanation);
    get<HTMLAnchorElement>('[data-line-link]').href = `#flash-forward-${frame.lines[0]}`;
    progress.max = String(frames.length - 1);
    progress.value = String(index);
    progress.setAttribute(
      'aria-valuetext',
      `第 ${index + 1} 步，共 ${frames.length} 步：${frame.title}`,
    );
    previous.disabled = index === 0;
    next.disabled = index === frames.length - 1;
    for (const layout of root.querySelectorAll<HTMLElement>('[data-layout]')) {
      layout.hidden = Number(layout.dataset['layout']) !== size;
      if (layout.hidden) continue;
      for (const row of QUERY_TILES) {
        const active = started && row.index === query;
        get(`[data-query="${row.index}"]`, layout).setAttribute('aria-pressed', String(active));
        get(`[data-map-row="${row.index}"]`, layout).setAttribute('data-active', String(active));
        const output = get(`[data-output="${row.index}"]`, layout);
        const written = active && frame.phase === 'output';
        output.dataset['status'] = written ? 'written' : active ? 'pending' : 'idle';
        output.setAttribute(
          'aria-label',
          `输出块 O ${row.index + 1}，${written ? '已写回' : active ? '等待扫描完成' : '尚未演示'}`,
        );
        get('[data-output-mark]', output).textContent = written ? '✓' : '·';
        for (const tile of tiles) {
          get(`[data-map-cell="${row.index}-${tile.index}"]`, layout).setAttribute(
            'data-status',
            active && tile.end <= frame.processed
              ? 'merged'
              : active && frame.phase === 'tile' && frame.kv === tile.index
                ? 'current'
                : 'waiting',
          );
        }
      }
      for (const tile of tiles) {
        get(`[data-kv="${tile.index}"]`, layout).dataset['status'] =
          frame.kv === tile.index ? 'current' : tile.end <= frame.processed ? 'merged' : 'waiting';
        get(`[data-coverage="${tile.index}"]`, layout).dataset['status'] =
          tile.end <= frame.processed ? 'merged' : 'waiting';
      }
      const scan = get<SVGRectElement>('[data-scan-window]', layout);
      scan.setAttribute('visibility', frame.phase === 'tile' ? 'visible' : 'hidden');
      scan.setAttribute('x', String((frame.kv === null ? 0 : tiles[frame.kv].start) * GRID_UNIT));
      scan.setAttribute('y', String(QUERY_TILES[query].start * GRID_UNIT));
    }
    field('covered', `${frame.processed} / ${SEQUENCE_LENGTH}`);
    field(
      'buffer',
      frame.phase === 'tile'
        ? `KV 块 ${(frame.kv ?? 0) + 1} 已读入`
        : frame.phase === 'merge' || frame.phase === 'output'
          ? '临时空间已释放'
          : '尚未读取',
    );
    field(
      'result',
      frame.phase === 'output'
        ? `token ${tokenRange(QUERY_TILES[query])} 已写回`
        : '扫描完才能归一化',
    );
    clearHighlight();
    for (const line of frame.lines)
      document.getElementById(`flash-forward-${line}`)?.setAttribute('data-playing-line', '');
    if (timer === undefined) pause();
  };
  const seek = (position: number) => {
    pause();
    index = Math.max(0, Math.min(frames.length - 1, position));
    render();
  };
  const schedule = () => {
    timer = view.setTimeout(
      () => {
        index++;
        render();
        if (index === frames.length - 1) pause();
        else schedule();
      },
      reducedMotion.matches ? 3500 : 2200,
    );
  };
  root.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof view.Element)) return;
      const queryButton = target.closest<HTMLElement>('[data-query]');
      if (queryButton) {
        query = Number(queryButton.dataset['query']);
        frames = buildFrames(size, query);
        seek(2);
        return;
      }
      const action = target.closest<HTMLElement>('[data-action]')?.dataset['action'];
      if (action === 'next') seek(index + 1);
      if (action === 'previous') seek(index - 1);
      if (action === 'reset') seek(0);
      if (action === 'play') {
        if (timer !== undefined) {
          pause();
          return;
        }
        if (index === frames.length - 1) seek(0);
        stage.setAttribute('aria-live', 'off');
        play.textContent = '暂停';
        play.setAttribute('aria-pressed', 'true');
        schedule();
      }
    },
    { signal: abort.signal },
  );
  progress.addEventListener('input', () => seek(Number(progress.value)), { signal: abort.signal });
  sizeInput.addEventListener(
    'change',
    () => {
      size = Number(sizeInput.value) as KvTileSize;
      frames = buildFrames(size, query);
      seek(1);
    },
    { signal: abort.signal },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) pause();
    },
    { signal: abort.signal },
  );
  const observer = new view.IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) pause();
  });
  observer.observe(root);
  get('[data-controls]').hidden = false;
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-query]'))
    button.disabled = false;
  render();
  root.dataset['ready'] = 'true';
  return () => {
    pause();
    abort.abort();
    observer.disconnect();
    clearHighlight();
    get('[data-controls]').hidden = true;
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-query]'))
      button.disabled = true;
    delete root.dataset['ready'];
  };
}

export function initFlashForward(container: HTMLElement): () => void {
  const cleanups = Array.from(
    container.querySelectorAll<HTMLElement>('[data-flash-forward]'),
    bindPlayer,
  );
  return () => cleanups.forEach((cleanup) => cleanup());
}
