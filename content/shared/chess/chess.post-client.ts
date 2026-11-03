// Browser controller for the shared chess kit. The generator loads it for every
// article that imports the kit; it upgrades `ChessDiagram` and `ChessGame`
// figures in place and restores their static HTML on navigation.
import { Chessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';
import type { DrawShape } from '@lichess-org/chessground/draw';
import type { Key } from '@lichess-org/chessground/types';
import {
  type Arrow,
  type Color,
  childrenOf,
  depthOf,
  fenAt,
  type GamePayload,
  LABELS,
  type Mark,
  moveName,
  parentOf,
  plyAt,
  turnOf,
} from './model';

const BRUSHES = {
  path: { key: 'path', color: 'var(--accent-sage)', opacity: 0.8, lineWidth: 10 },
  option: { key: 'option', color: 'var(--accent-blue)', opacity: 0.8, lineWidth: 8 },
  threat: { key: 'threat', color: 'var(--accent-red)', opacity: 0.8, lineWidth: 8 },
  idea: { key: 'idea', color: 'var(--accent-ochre)', opacity: 0.8, lineWidth: 8 },
};

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function autoShapes(arrows: readonly Arrow[] = []): DrawShape[] {
  return arrows.map((arrow) => ({
    orig: arrow.from as Key,
    dest: arrow.to as Key,
    brush: arrow.role,
    ...(arrow.label && { label: { text: arrow.label } }),
  }));
}

function highlights(marks: readonly Mark[] = []): Map<Key, string> {
  return new Map(marks.map((mark) => [mark.square as Key, `chess-mark-${mark.role}`]));
}

/** Replaces a figure's static SVG with a view-only Chessground board. */
function mountBoard(
  figure: HTMLElement,
  fen: string,
  orientation: Color,
  arrows?: readonly Arrow[],
  marks?: readonly Mark[],
): { board: Api; host: HTMLElement; restore: () => void } {
  const host = figure.querySelector<HTMLElement>('.chess-ground')!;
  const fallback = figure.querySelector<SVGElement>('.chess-board')!;
  host.hidden = false;
  const board = Chessground(host, {
    fen,
    orientation,
    turnColor: turnOf(fen),
    viewOnly: true,
    // Coordinates are colored per edge; the kit styles ranks on the left edge.
    ranksPosition: 'left',
    animation: { enabled: !reducedMotion(), duration: 200 },
    drawable: {
      enabled: false,
      // Kit styles recolor these by key for both themes; widths follow Lichess.
      // Chessground also requires its default color brushes, aliased to the roles.
      brushes: {
        ...BRUSHES,
        green: BRUSHES.path,
        blue: BRUSHES.option,
        red: BRUSHES.threat,
        yellow: BRUSHES.idea,
      },
      autoShapes: autoShapes(arrows),
    },
    highlight: { custom: highlights(marks) },
  });
  fallback.setAttribute('hidden', '');
  figure.dataset['ready'] = 'true';
  return {
    board,
    host,
    restore: () => {
      board.destroy();
      host.replaceChildren();
      host.hidden = true;
      fallback.removeAttribute('hidden');
      delete figure.dataset['ready'];
    },
  };
}

function enhanceDiagram(figure: HTMLElement): () => void {
  const { restore } = mountBoard(
    figure,
    figure.dataset['fen']!,
    figure.dataset['orientation'] as Color,
    JSON.parse(figure.dataset['arrows'] ?? '[]'),
    JSON.parse(figure.dataset['marks'] ?? '[]'),
  );
  return restore;
}

function enhanceGame(figure: HTMLElement): () => void {
  const game = JSON.parse(figure.dataset['chessGame']!) as GamePayload;
  const labels = LABELS[game.locale];
  // Node numbers: 0 is the start, then the main line, then the variations.
  const mainEnd = game.plies.length;
  const total = mainEnd + (game.variations?.length ?? 0);
  const children = Array.from({ length: total + 1 }, (_, node) => childrenOf(game, node));
  /** Steps back toward the start, or forward along the current line. */
  const back = (node: number, steps: number) => {
    for (let step = 0; step < steps && node > 0; step++) node = parentOf(game, node);
    return node;
  };
  const forward = (node: number, steps = Infinity) => {
    for (let step = 0; step < steps && children[node].length > 0; step++) node = children[node][0];
    return node;
  };
  /** Keys that move through the game, as on Lichess; ↑/↓ move by a full move. */
  const STEPS: Record<string, (node: number) => number> = {
    ArrowLeft: (node) => back(node, 1),
    ArrowRight: (node) => forward(node, 1),
    ArrowUp: (node) => back(node, 2),
    ArrowDown: (node) => forward(node, 2),
    Home: () => 0,
    End: (node) => forward(node),
  };
  const { board, host, restore } = mountBoard(figure, game.fen, game.orientation);
  const pane = figure.querySelector<HTMLElement>('.chess-game__moves')!;
  const moves = new Map(
    [...figure.querySelectorAll<HTMLElement>('.chess-move[data-ply]')].map((move) => [
      Number(move.dataset['ply']),
      move,
    ]),
  );
  const result = figure.querySelector<HTMLElement>('.chess-moves__result')!;
  const controls = figure.querySelector<HTMLElement>('[data-chess-controls]')!;
  const button = (action: string) =>
    controls.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!;
  const status = figure.querySelector<HTMLElement>('[data-chess-status]')!;
  const comment = figure.querySelector<HTMLElement>('[data-chess-comment]')!;
  const pgn = figure.querySelector<HTMLDetailsElement>('[data-chess-pgn]')!;
  const abort = new AbortController();
  const { signal } = abort;
  const initial = figure.dataset['ply'] ?? '0';
  let node = Number(initial);
  if (!Number.isInteger(node) || node < 0 || node > total) node = 0;

  for (const move of moves.values()) {
    move.setAttribute('role', 'button');
    move.tabIndex = -1;
  }
  const hostLabel = host.getAttribute('aria-label') ?? '';
  // The board takes focus on click, so the arrow keys work right after it.
  host.tabIndex = 0;
  controls.hidden = false;

  /** Fades mark the scrolled-away edges of the move pane, in either axis. */
  const updateFades = () => {
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = pane;
    pane.toggleAttribute('data-fade-start', scrollTop > 1 || scrollLeft > 1);
    pane.toggleAttribute(
      'data-fade-end',
      scrollTop + clientHeight < scrollHeight - 1 || scrollLeft + clientWidth < scrollWidth - 1,
    );
  };

  /**
   * Centers the current move inside the pane: vertically beside the board,
   * horizontally in the phone strip. Only the pane scrolls, never the page.
   */
  const reveal = (behavior: ScrollBehavior) => {
    const target = node === mainEnd ? result : moves.get(node);
    pane.scrollTo({
      top: target ? target.offsetTop - (pane.clientHeight - target.offsetHeight) / 2 : 0,
      left: target ? target.offsetLeft - (pane.clientWidth - target.offsetWidth) / 2 : 0,
      behavior: reducedMotion() ? 'instant' : behavior,
    });
  };

  const render = (behavior: ScrollBehavior, announce: boolean) => {
    const fen = fenAt(game, node);
    const move = plyAt(game, node);
    board.set({
      fen,
      turnColor: turnOf(fen),
      lastMove: move ? [move.from as Key, move.to as Key] : undefined,
      check: move?.check ?? false,
      drawable: { autoShapes: autoShapes(move?.arrows) },
      highlight: { custom: highlights(move?.marks) },
    });
    moves.forEach((element, id) => {
      const current = id === node;
      element.toggleAttribute('aria-current', current);
      if (current) element.setAttribute('aria-current', 'step');
      // One tab stop for the whole list: the current move, or the first one.
      element.tabIndex = current || (node === 0 && id === 1) ? 0 : -1;
    });
    const end = children[node].length === 0;
    button('first').disabled = button('previous').disabled = node === 0;
    button('next').disabled = button('last').disabled = end;
    comment.textContent = move?.comment ?? '';
    comment.hidden = !move?.comment;
    const name = node === 0 ? labels.start : moveName(game, node);
    const position = node > mainEnd ? labels.variation(name) : name;
    const state =
      node === mainEnd
        ? [...result.children].map((child) => child.textContent).join(' ')
        : labels.turn(turnOf(fen));
    // Steps count along the line being viewed, up to that line's end.
    const step = labels.step(depthOf(game, node), depthOf(game, forward(node)));
    const text = labels.describe(position, step, state);
    host.setAttribute('aria-label', `${labels.board}${text}`);
    if (announce) status.textContent = text;
    figure.dataset['ply'] = String(node);
    reveal(behavior);
    updateFades();
  };

  const go = (target: number, behavior: ScrollBehavior = 'smooth') => {
    if (target === node) return;
    const followFocus = [...moves.values()].includes(document.activeElement as HTMLElement);
    node = target;
    render(behavior, true);
    // Keep keyboard focus on the highlighted move while navigating the list.
    if (followFocus) moves.get(Math.max(node, 1))?.focus({ preventScroll: true });
  };

  figure.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element;
      const move = target.closest<HTMLElement>('.chess-move[data-ply]');
      if (move) return go(Number(move.dataset['ply']));
      const action = target.closest<HTMLButtonElement>('button[data-action]')?.dataset['action'];
      if (action === 'first') go(0);
      else if (action === 'previous') go(back(node, 1));
      else if (action === 'next') go(forward(node, 1));
      else if (action === 'last') go(forward(node));
      else if (action === 'pgn') pgn.open = !pgn.open;
    },
    { signal },
  );
  figure.addEventListener(
    'keydown',
    (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const move = (event.target as Element).closest<HTMLElement>('.chess-move[data-ply]');
      if (move && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        go(Number(move.dataset['ply']));
        return;
      }
      const step = STEPS[event.key];
      if (!step || (event.target as Element).closest('details[open]')) return;
      event.preventDefault();
      // Held keys jump instantly instead of queueing smooth scrolls.
      go(step(node), event.repeat ? 'instant' : 'smooth');
    },
    { signal },
  );
  pgn.addEventListener(
    'toggle',
    () => button('pgn').setAttribute('aria-pressed', String(pgn.open)),
    { signal },
  );
  pane.addEventListener('scroll', updateFades, { passive: true, signal });
  const resize = new ResizeObserver(() => {
    reveal('instant');
    updateFades();
  });
  resize.observe(pane);

  render('instant', false);
  return () => {
    abort.abort();
    resize.disconnect();
    restore();
    host.removeAttribute('tabindex');
    host.setAttribute('aria-label', hostLabel);
    figure.dataset['ply'] = initial;
    for (const move of moves.values()) {
      move.removeAttribute('role');
      move.removeAttribute('tabindex');
      move.removeAttribute('aria-current');
    }
    controls.hidden = true;
    comment.hidden = true;
    status.textContent = '';
    pgn.open = false;
    pane.removeAttribute('data-fade-start');
    pane.removeAttribute('data-fade-end');
    pane.scrollTo({ top: 0, left: 0 });
  };
}

export function enhancePost(container: HTMLElement): () => void {
  const cleanups = [
    ...[...container.querySelectorAll<HTMLElement>('[data-chess-diagram]')].map(enhanceDiagram),
    ...[...container.querySelectorAll<HTMLElement>('[data-chess-game]')].map(enhanceGame),
  ];
  return () => cleanups.reverse().forEach((cleanup) => cleanup());
}
