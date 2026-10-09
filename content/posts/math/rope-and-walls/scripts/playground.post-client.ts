import {
  initialRope,
  playground,
  type RopeState,
  ropeFrame,
  ropeMetrics,
  ropeViewport,
} from './playground-model';

function bindPlayground(root: HTMLElement) {
  const view = root.ownerDocument.defaultView;
  if (!view) return () => undefined;
  const abort = new view.AbortController();
  const signal = abort.signal;
  const svg = root.querySelector<SVGSVGElement>('[data-rope-svg]')!;
  const controls = root.querySelector<HTMLElement>('[data-rope-controls]')!;
  const status = root.querySelector<HTMLElement>('[data-rope-status]')!;
  const metrics = root.querySelector<HTMLElement>('[data-rope-metrics]')!;
  const arc = root.querySelector<SVGPathElement>('[data-rope-arc]')!;
  const region = root.querySelector<SVGPathElement>('[data-rope-region]')!;
  const chord = root.querySelector<SVGPathElement>('[data-rope-chord]')!;
  const inputs = Object.fromEntries(
    (['a', 'b', 's', 'angle'] as const).map((key) => [
      key,
      root.querySelector<HTMLInputElement>(`[data-rope-input="${key}"]`)!,
    ]),
  ) as Record<keyof RopeState, HTMLInputElement>;
  const outputs = Object.fromEntries(
    (['a', 'b', 's', 'angle'] as const).map((key) => [
      key,
      root.querySelector<HTMLOutputElement>(`[data-rope-value="${key}"]`)!,
    ]),
  ) as Record<keyof RopeState, HTMLOutputElement>;
  const handles = {
    a: root.querySelector<SVGGElement>('[data-rope-handle="a"]')!,
    b: root.querySelector<SVGGElement>('[data-rope-handle="b"]')!,
  };
  let state = { ...initialRope };
  let drag: { key: 'a' | 'b'; id: number; offset: number } | null = null;
  const render = () => {
    const frame = ropeFrame(state);
    arc.setAttribute('d', frame.rope);
    region.setAttribute('d', frame.region);
    chord.setAttribute('d', frame.chord);
    root.querySelector('[data-rope-walls]')!.setAttribute('d', frame.walls);
    root.dataset['ropeKind'] = frame.kind;
    if (!drag) {
      const viewport = ropeViewport(state);
      const ui = viewport.uiScale;
      svg.setAttribute('viewBox', viewport.box);
      const origin = root.querySelector<SVGTextElement>('[data-rope-origin]')!;
      origin.setAttribute('x', String(playground.ox - 24 * ui));
      origin.setAttribute('y', String(playground.oy + 26 * ui));
      origin.style.fontSize = `${22 * ui}px`;
      for (const key of ['a', 'b'] as const) {
        handles[key].querySelector('.rope-playground-hit')!.setAttribute('r', String(34 * ui));
        handles[key].querySelector('.rope-playground-knob')!.setAttribute('r', String(11 * ui));
        const label = handles[key].querySelector('text')!;
        label.setAttribute('x', String((key === 'a' ? 17 : -29) * ui));
        label.setAttribute('y', String((key === 'a' ? 24 : -18) * ui));
        label.style.fontSize = `${22 * ui}px`;
      }
    }
    metrics.textContent = ropeMetrics(frame);
    const straighten = root.querySelector<HTMLButtonElement>('[data-rope-preset="straight"]')!;
    straighten.disabled = frame.d < Number(inputs.s.min);
    straighten.title = straighten.disabled ? '请先将两端距离增大到 0.01，再拉直绳子。' : '';
    if (status.textContent !== frame.status) status.textContent = frame.status;
    for (const key of ['a', 'b', 's', 'angle'] as const) {
      inputs[key].value = String(state[key]);
      outputs[key].value = key === 'angle' ? `${state[key]}°` : state[key].toFixed(2);
    }
    for (const key of ['a', 'b'] as const) {
      handles[key].setAttribute('transform', `translate(${frame[key].x} ${frame[key].y})`);
      handles[key].setAttribute('aria-valuenow', state[key].toFixed(2));
    }
  };
  const update = (key: keyof RopeState, value: number) => {
    state[key] = Math.max(Number(inputs[key].min), Math.min(Number(inputs[key].max), value));
    render();
  };
  const alongWall = (event: PointerEvent, key: 'a' | 'b') => {
    const matrix = svg.getScreenCTM();
    if (!matrix) return state[key];
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    const x = (local.x - playground.ox) / playground.scale;
    const y = (playground.oy - local.y) / playground.scale;
    const theta = (state.angle * Math.PI) / 180;
    return key === 'a' ? x : x * Math.cos(theta) + y * Math.sin(theta);
  };
  const finishDrag = () => {
    if (drag && handles[drag.key].hasPointerCapture(drag.id))
      handles[drag.key].releasePointerCapture(drag.id);
    drag = null;
    status.setAttribute('aria-live', 'polite');
  };
  for (const key of ['a', 'b', 's', 'angle'] as const)
    inputs[key].addEventListener('input', () => update(key, Number(inputs[key].value)), { signal });
  for (const key of ['a', 'b'] as const) {
    const handle = handles[key];
    handle.setAttribute('role', 'slider');
    handle.setAttribute('tabindex', '0');
    handle.setAttribute(
      'aria-label',
      key === 'a' ? '拖动 A，沿第一面墙移动' : '拖动 B，沿第二面墙移动',
    );
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', inputs[key].max);
    handle.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        finishDrag();
        drag = { key, id: event.pointerId, offset: alongWall(event, key) - state[key] };
        handle.setPointerCapture(event.pointerId);
        handle.focus();
        status.setAttribute('aria-live', 'off');
      },
      { signal },
    );
    handle.addEventListener(
      'pointermove',
      (event) => {
        if (drag?.key !== key || drag.id !== event.pointerId) return;
        update(key, alongWall(event, key) - drag.offset);
      },
      { signal },
    );
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
      handle.addEventListener(name, finishDrag, { signal });
    handle.addEventListener(
      'keydown',
      (event) => {
        let value: number;
        if (event.key === 'Home') value = 0;
        else if (event.key === 'End') value = Number(inputs[key].max);
        else if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'].includes(event.key))
          value =
            state[key] +
            (['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 1) *
              (event.shiftKey ? 0.1 : 0.01);
        else return;
        event.preventDefault();
        update(key, value);
      },
      { signal },
    );
  }
  controls.addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof view.Element)) return;
      const preset = event.target.closest<HTMLElement>('[data-rope-preset]')?.dataset['ropePreset'];
      if (!preset) return;
      finishDrag();
      if (preset === 'sector') state = { ...state, a: 1, b: 1, s: (state.angle * Math.PI) / 180 };
      if (preset === 'major') {
        state = { ...state, a: 1, b: 2, s: 4 };
        state.s = Math.max(4, (Math.PI * ropeFrame(state).d) / 2 + 0.5);
      }
      if (preset === 'reset') state = { ...initialRope };
      if (preset === 'straight' && ropeFrame(state).d >= Number(inputs.s.min))
        state.s = ropeFrame(state).d;
      render();
    },
    { signal },
  );
  controls.hidden = false;
  render();
  root.dataset['ropeReady'] = 'true';
  return () => {
    finishDrag();
    abort.abort();
    controls.hidden = true;
    for (const handle of Object.values(handles)) {
      handle.removeAttribute('tabindex');
      handle.removeAttribute('role');
    }
    delete root.dataset['ropeReady'];
  };
}
export function enhancePost(container: HTMLElement): () => void {
  const cleanups = Array.from(
    container.querySelectorAll<HTMLElement>('[data-rope-playground]'),
    bindPlayground,
  );
  return () => cleanups.forEach((cleanup) => cleanup());
}
