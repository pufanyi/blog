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
  fenAt,
  type GamePayload,
  LABELS,
  type Mark,
  moveText,
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

/** Keys that move through the game, as on Lichess; ↑/↓ move by a full move. */
const STEPS: Record<string, (ply: number, last: number) => number> = {
  ArrowLeft: (ply) => ply - 1,
  ArrowRight: (ply) => ply + 1,
  ArrowUp: (ply) => ply - 2,
  ArrowDown: (ply) => ply + 2,
  Home: () => 0,
  End: (_ply, last) => last,
};

function enhanceGame(figure: HTMLElement): () => void {
  const game = JSON.parse(figure.dataset['chessGame']!) as GamePayload;
  const labels = LABELS[game.locale];
  const last = game.plies.length;
  const { board, host, restore } = mountBoard(figure, game.fen, game.orientation);
  const pane = figure.querySelector<HTMLElement>('.chess-game__moves')!;
  const moves = [...figure.querySelectorAll<HTMLElement>('.chess-move[data-ply]')];
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
  let ply = Math.min(Number(initial), last);

  for (const move of moves) {
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
    const target = ply === last ? result : moves[ply - 1];
    pane.scrollTo({
      top: target ? target.offsetTop - (pane.clientHeight - target.offsetHeight) / 2 : 0,
      left: target ? target.offsetLeft - (pane.clientWidth - target.offsetWidth) / 2 : 0,
      behavior: reducedMotion() ? 'instant' : behavior,
    });
  };

  const render = (behavior: ScrollBehavior, announce: boolean) => {
    const fen = fenAt(game, ply);
    const move = game.plies[ply - 1];
    board.set({
      fen,
      turnColor: turnOf(fen),
      lastMove: move ? [move.from as Key, move.to as Key] : undefined,
      check: move?.check ?? false,
      drawable: { autoShapes: autoShapes(move?.arrows) },
      highlight: { custom: highlights(move?.marks) },
    });
    moves.forEach((element, index) => {
      const current = index + 1 === ply;
      element.toggleAttribute('aria-current', current);
      if (current) element.setAttribute('aria-current', 'step');
      // One tab stop for the whole list: the current move, or the first one.
      element.tabIndex = current || (ply === 0 && index === 0) ? 0 : -1;
    });
    button('first').disabled = button('previous').disabled = ply === 0;
    button('next').disabled = button('last').disabled = ply === last;
    comment.textContent = move?.comment ?? '';
    comment.hidden = !move?.comment;
    const position = ply === 0 ? labels.start : moveText(game, ply - 1, ply);
    const state =
      ply === last
        ? [...result.children].map((child) => child.textContent).join(' ')
        : labels.turn(turnOf(fen));
    const text = labels.describe(position, labels.step(ply, last), state);
    host.setAttribute('aria-label', `${labels.board}${text}`);
    if (announce) status.textContent = text;
    figure.dataset['ply'] = String(ply);
    reveal(behavior);
    updateFades();
  };

  const go = (target: number, behavior: ScrollBehavior = 'smooth') => {
    const next = Math.max(0, Math.min(last, target));
    if (next === ply) return;
    const followFocus = moves.includes(document.activeElement as HTMLElement);
    ply = next;
    render(behavior, true);
    // Keep keyboard focus on the highlighted move while navigating the list.
    if (followFocus) moves[Math.max(ply, 1) - 1].focus({ preventScroll: true });
  };

  figure.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element;
      const move = target.closest<HTMLElement>('.chess-move[data-ply]');
      if (move) return go(Number(move.dataset['ply']));
      const action = target.closest<HTMLButtonElement>('button[data-action]')?.dataset['action'];
      if (action === 'first') go(0);
      else if (action === 'previous') go(ply - 1);
      else if (action === 'next') go(ply + 1);
      else if (action === 'last') go(last);
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
      go(step(ply, last), event.repeat ? 'instant' : 'smooth');
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
    for (const move of moves) {
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
