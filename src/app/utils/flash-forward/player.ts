import { buildFrames, EXAMPLE, formatNumber as f, PHASES } from './model';

function bindPlayer(root: HTMLElement): () => void {
  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view) return () => undefined;
  const abort = new view.AbortController();
  const get = <T extends HTMLElement>(selector: string) => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing FlashAttention player element: ${selector}`);
    return element;
  };
  const field = (name: string, value: string) => { get(`[data-field="${name}"]`).textContent = value; };
  const play = get<HTMLButtonElement>('[data-action="play"]');
  const previous = get<HTMLButtonElement>('[data-action="previous"]');
  const next = get<HTMLButtonElement>('[data-action="next"]');
  const progress = get<HTMLInputElement>('[data-progress]');
  const order = get<HTMLInputElement>('[data-order]');
  const stage = get('[data-stage]');
  let frames = buildFrames(order.checked);
  let index = 0;
  let timer: number | undefined;
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const algorithm = document.getElementById('flash-forward-algorithm');

  const clearHighlight = () => {
    algorithm?.querySelectorAll('[data-playing-line]').forEach(line => line.removeAttribute('data-playing-line'));
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
    const info = PHASES[frame.phase];
    const hasTile = frame.tile !== null && frame.phase !== 'release';
    const showWeights = frame.phase === 'rescale' || frame.phase === 'accumulate';
    const showMerge = showWeights;
    root.dataset['phase'] = frame.phase;
    root.dataset['step'] = String(index);
    field('progress', `${index + 1} / ${frames.length}`);
    field('round', frame.tile === null ? (index === 0 ? '准备' : '完成') : `KV 块 ${frame.tile + 1} / 2`);
    field('title', info.title);
    field('lines', info.lineLabel);
    field('explanation', frame.explanation);
    get<HTMLAnchorElement>('[data-line-link]').href = `#flash-forward-${info.lines[0]}`;
    progress.value = String(index);
    progress.max = String(frames.length - 1);
    progress.setAttribute('aria-valuetext', `第 ${index + 1} 步，共 ${frames.length} 步：${info.title}`);
    previous.disabled = index === 0;
    next.disabled = index === frames.length - 1;
    for (const formula of root.querySelectorAll<HTMLElement>('[data-formula]')) {
      formula.hidden = formula.dataset['formula'] !== frame.phase;
    }
    for (const tile of [0, 1]) {
      const active = frame.tile === tile && hasTile;
      get(`[data-tile="${tile}"]`).dataset['status'] = active ? 'active' : frame.completed.includes(tile) ? 'done' : 'waiting';
      get(`[data-tile-status="${tile}"]`).textContent = active ? '当前块 · 已读入' : frame.completed.includes(tile) ? '已合并' : '待读取';
    }
    field('transfer', frame.phase === 'normalize' ? '↑ 仅将输出与 log-sum-exp 写回 HBM'
      : frame.phase === 'load' ? `↓ 读取 KV 块 ${(frame.tile ?? 0) + 1}`
      : frame.phase === 'initialize' ? '↓ 加载 query；KV 尚未读取'
      : '片上计算 · 无需将中间矩阵写回 HBM');
    field('scratch', frame.phase === 'scores' ? 'S' : showWeights ? 'W' : frame.phase === 'load' ? 'KV 已就绪' : '空闲');
    field('scratch-note', showWeights ? 'W 尚未归一化，不能当作最终概率'
      : frame.phase === 'scores' ? '仅当前 2 × 2 块；不保存完整 S'
      : frame.phase === 'release' ? 'S 与 W 已丢弃，空间可复用' : '只为当前块使用临时空间');
    for (let cell = 0; cell < 4; cell++) {
      const row = frame.merge[Math.floor(cell / EXAMPLE.tileSize)];
      get(`[data-cell="${cell}"]`).textContent = row && (showWeights || frame.phase === 'scores')
        ? f((showWeights ? row.weights : row.scores)[cell % EXAMPLE.tileSize]) : '—';
    }
    frame.rows.forEach((row, rowIndex) => {
      for (const key of ['m', 'ell', 'u'] as const) {
        get(`[data-state-row="${rowIndex}"] [data-state="${key}"]`).textContent = f(row[key]);
      }
      if (frame.phase === 'normalize') {
        get(`[data-output-row="${rowIndex}"]`).textContent = `${f(row.u)} / ${f(row.ell)} ≈ ${f(row.u / row.ell)}`;
        get(`[data-normalizer-row="${rowIndex}"]`).textContent = f(row.m + Math.log(row.ell));
      }
    });
    get('[data-merge]').hidden = !showMerge;
    get('[data-output]').hidden = frame.phase !== 'normalize';
    if (showMerge) frame.merge.forEach((row, rowIndex) => {
      const set = (key: string, value: string) => {
        get(`[data-merge-row="${rowIndex}"] [data-merge-value="${key}"]`).textContent = value;
      };
      set('maximum', f(row.after.m));
      set('alpha', f(row.alpha));
      const committed = frame.phase === 'accumulate';
      for (const key of ['ell', 'u'] as const) {
        const added = key === 'ell' ? row.addedEll : row.addedU;
        set(key, `${f(row.alpha)} × ${f(row.before[key])} + ${f(added)}${committed ? ` = ${f(row.after[key])}` : '（待合并）'}`);
      }
      const oldShare = row.alpha * row.before.ell / row.after.ell;
      get(`[data-merge-row="${rowIndex}"] [data-old-bar]`).style.width = `${oldShare * 100}%`;
      get(`[data-merge-row="${rowIndex}"] [data-new-bar]`).style.width = `${(1 - oldShare) * 100}%`;
    });
    clearHighlight();
    for (const line of info.lines) document.getElementById(`flash-forward-${line}`)?.setAttribute('data-playing-line', '');
    if (timer === undefined) pause();
  };
  const seek = (position: number) => {
    pause();
    index = Math.max(0, Math.min(frames.length - 1, position));
    render();
  };
  const schedule = () => {
    timer = view.setTimeout(() => {
      index++;
      render();
      if (index === frames.length - 1) pause();
      else schedule();
    }, reducedMotion.matches ? 4500 : 3000);
  };
  root.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof view.Element)) return;
    const action = target.closest<HTMLElement>('[data-action]')?.dataset['action'];
    if (action === 'next') seek(index + 1);
    if (action === 'previous') seek(index - 1);
    if (action === 'reset') seek(0);
    if (action === 'play') {
      if (timer !== undefined) { pause(); return; }
      if (index === frames.length - 1) seek(0);
      stage.setAttribute('aria-live', 'off');
      play.textContent = '暂停';
      play.setAttribute('aria-pressed', 'true');
      schedule();
    }
  }, { signal: abort.signal });
  progress.addEventListener('input', () => seek(Number(progress.value)), { signal: abort.signal });
  order.addEventListener('change', () => { frames = buildFrames(order.checked); seek(0); }, { signal: abort.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, { signal: abort.signal });
  const observer = new view.IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) pause();
  });
  observer.observe(root);
  get('[data-controls]').hidden = false;
  render();
  root.dataset['ready'] = 'true';
  return () => {
    pause();
    abort.abort();
    observer.disconnect();
    clearHighlight();
    get('[data-controls]').hidden = true;
    delete root.dataset['ready'];
  };
}

export function initFlashForward(container: HTMLElement): () => void {
  const cleanups = Array.from(container.querySelectorAll<HTMLElement>('[data-flash-forward]'), bindPlayer);
  return () => cleanups.forEach(cleanup => cleanup());
}
