import { Chessground } from '@lichess-org/chessground';
import type { Key } from '@lichess-org/chessground/types';
import { E4_REFUTATION, moveText, placementAfter, placementFen } from './e4-line';

export function enhancePost(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  for (const figure of container.querySelectorAll<HTMLElement>('[data-anti-board]')) {
    const host = figure.querySelector<HTMLElement>('.anti-ground')!;
    const fallback = figure.querySelector<SVGElement>('.anti-board')!;
    const arrows = JSON.parse(figure.dataset['arrows'] ?? '[]') as {
      from: Key;
      to: Key;
      role: string;
    }[];
    const marks = JSON.parse(figure.dataset['marks'] ?? '[]') as {
      square: Key;
      role: string;
    }[];
    host.hidden = false;
    const board = Chessground(host, {
      fen: figure.dataset['fen'],
      viewOnly: true,
      autoCastle: false,
      // Chessground colors each label for its edge; ranks are styled on the a-file.
      ranksPosition: 'left',
      animation: {
        enabled: !matchMedia('(prefers-reduced-motion: reduce)').matches,
        duration: 200,
      },
      drawable: {
        enabled: false,
        brushes: {
          green: { key: 'g', color: 'var(--accent-clay)', opacity: 0.85, lineWidth: 8 },
          red: { key: 'r', color: 'var(--accent-red)', opacity: 0.85, lineWidth: 8 },
          blue: { key: 'b', color: 'var(--accent-blue)', opacity: 0.85, lineWidth: 5 },
          yellow: { key: 'y', color: 'var(--accent-ochre)', opacity: 0.85, lineWidth: 8 },
          path: { key: 'path', color: 'var(--accent-clay)', opacity: 0.85, lineWidth: 8 },
          option: { key: 'option', color: 'var(--accent-blue)', opacity: 0.85, lineWidth: 5 },
        },
        autoShapes: arrows.map((a) => ({ orig: a.from, dest: a.to, brush: a.role })),
      },
      highlight: { custom: new Map(marks.map((m) => [m.square, `anti-${m.role}`])) },
    });
    fallback.setAttribute('hidden', '');
    const player = figure.closest<HTMLElement>('[data-anti-player]');
    const abort = new AbortController();
    if (player) {
      let ply = 0;
      const controls = player.querySelector<HTMLElement>('[data-anti-controls]')!;
      const status = player.querySelector<HTMLElement>('[data-anti-status]')!;
      const render = () => {
        const move = E4_REFUTATION[ply - 1];
        const label =
          ply === E4_REFUTATION.length
            ? '黑方只剩 c7 兵，无合法着法，黑方获胜。'
            : `轮到${ply % 2 === 0 ? '白' : '黑'}方走棋。`;
        const text = `${ply === 0 ? '初始局面' : moveText(E4_REFUTATION, ply - 1, ply)} · ${ply} / ${E4_REFUTATION.length} · ${label}`;
        board.set({
          fen: placementFen(placementAfter(E4_REFUTATION, ply)),
          lastMove: move ? [move.from, move.to] : undefined,
          turnColor: ply % 2 === 0 ? 'white' : 'black',
        });
        status.textContent = text;
        host.setAttribute('aria-label', text);
        player.dataset['ply'] = String(ply);
        player.querySelector<HTMLButtonElement>('[data-action="previous"]')!.disabled = ply === 0;
        player.querySelector<HTMLButtonElement>('[data-action="next"]')!.disabled =
          ply === E4_REFUTATION.length;
        for (const button of player.querySelectorAll<HTMLButtonElement>(
          '.anti-moves [data-step]',
        )) {
          if (Number(button.dataset['step']) === ply) button.setAttribute('aria-current', 'step');
          else button.removeAttribute('aria-current');
        }
      };
      const go = (target: number) => {
        ply = Math.max(0, Math.min(E4_REFUTATION.length, target));
        render();
      };
      controls.addEventListener(
        'click',
        (event) => {
          const button = (event.target as Element).closest<HTMLButtonElement>('button');
          if (!button) return;
          go(
            button.dataset['step'] !== undefined
              ? Number(button.dataset['step'])
              : ply + (button.dataset['action'] === 'next' ? 1 : -1),
          );
        },
        { signal: abort.signal },
      );
      // Arrow keys step through the line while focus is inside the controls.
      const keys: Record<string, () => number> = {
        ArrowLeft: () => ply - 1,
        ArrowRight: () => ply + 1,
        Home: () => 0,
        End: () => E4_REFUTATION.length,
      };
      controls.addEventListener(
        'keydown',
        (event) => {
          const target = keys[event.key];
          if (!target || event.altKey || event.ctrlKey || event.metaKey) return;
          event.preventDefault();
          go(target());
        },
        { signal: abort.signal },
      );
      controls.hidden = false;
      render();
      cleanups.push(() => {
        controls.hidden = true;
        delete player.dataset['ply'];
      });
    }
    figure.dataset['ready'] = 'true';
    cleanups.push(() => {
      abort.abort();
      board.destroy();
      host.replaceChildren();
      host.hidden = true;
      fallback.removeAttribute('hidden');
      delete figure.dataset['ready'];
    });
  }
  return () => cleanups.reverse().forEach((cleanup) => cleanup());
}
