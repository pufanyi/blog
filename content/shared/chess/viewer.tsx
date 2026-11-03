import type { ReactNode } from 'react';
import { BoardSvg, GroundHost } from './board';
import type { ChessGameModel } from './game';
import {
  childrenOf,
  depthOf,
  fenAt,
  type GamePayload,
  LABELS,
  moveName,
  moveNumber,
  plyAt,
  sanText,
} from './model';

/** Stroke paths for the playback buttons, drawn on a 24-unit grid. */
const ICONS = {
  first: 'M7 6v12M17 6l-6 6 6 6',
  previous: 'M15 6l-6 6 6 6',
  next: 'M9 6l6 6-6 6',
  last: 'M7 6l6 6-6 6M17 6v12',
};

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

type Row =
  | { readonly kind: 'moves'; readonly number: number; readonly plies: (number | undefined)[] }
  | { readonly kind: 'comment'; readonly ply: number; readonly text: string }
  | { readonly kind: 'variations'; readonly ply: number; readonly lines: readonly number[] };

/**
 * Groups half-moves into Lichess-style rows: number, White, Black. A comment
 * or the alternatives to a move end its row, and Black's reply then starts a
 * new row after an ellipsis.
 */
function rows(game: ChessGameModel): Row[] {
  const result: Row[] = [];
  let open: { kind: 'moves'; number: number; plies: (number | undefined)[] } | undefined;
  game.plies.forEach(({ comment }, index) => {
    const ply = index + 1;
    const white = (game.startPly + ply) % 2 === 1;
    if (white || !open) {
      open = {
        kind: 'moves',
        number: moveNumber(game, ply),
        plies: white ? [ply] : [undefined, ply],
      };
      result.push(open);
    } else open.plies.push(ply);
    if (comment) result.push({ kind: 'comment', ply, text: comment });
    const lines = childrenOf(game, ply - 1).slice(1);
    if (lines.length > 0) result.push({ kind: 'variations', ply, lines });
    if (comment || lines.length > 0) open = undefined;
  });
  return result;
}

/** One selectable move; variation moves say so to screen readers. */
function Move({ game, node }: { game: ChessGameModel; node: number }) {
  const name = moveName(game, node);
  return (
    <span
      className="chess-move"
      data-ply={node}
      aria-label={node > game.plies.length ? LABELS[game.locale].variation(name) : name}
    >
      {sanText(plyAt(game, node)!)}
    </span>
  );
}

/**
 * A variation as running text, as Lichess prints it: numbered moves and
 * comments, with the alternatives to a move indented after it.
 */
function Line({ game, start }: { game: ChessGameModel; start: number }) {
  const items: ReactNode[] = [];
  let resume = true;
  let pending: number[] = [];
  for (let node: number | undefined = start; node !== undefined; ) {
    const depth = depthOf(game, node);
    const white = (game.startPly + depth) % 2 === 1;
    if (white || resume)
      items.push(
        <span key={`number-${node}`} className="chess-line__number" aria-hidden="true">
          {`${moveNumber(game, depth)}${white ? '.' : '...'}`}
        </span>,
      );
    // Spaces let a line wrap between moves, never inside "6.Bxg8".
    items.push(<Move key={node} game={game} node={node} />, ' ');
    const { comment } = plyAt(game, node)!;
    if (comment)
      items.push(
        <span key={`comment-${node}`} className="chess-line__comment">
          {comment}
        </span>,
        ' ',
      );
    resume = Boolean(comment);
    if (pending.length > 0) {
      items.push(
        <div key={`variations-${node}`} className="chess-line__variations">
          {pending.map((line) => (
            <Line key={line} game={game} start={line} />
          ))}
        </div>,
      );
      resume = true;
    }
    [node, ...pending] = childrenOf(game, node);
  }
  return <div className="chess-line">{items}</div>;
}

/**
 * A replayable game: board, move list, controls, and PGN. The static HTML is a
 * complete reading of the game; the `chess` client adds Chessground and
 * navigation. Markdown exports keep the board description and the PGN.
 */
export function ChessGame({
  id,
  game,
  title,
  description,
  caption,
  result,
  ply = 0,
}: {
  id: string;
  game: ChessGameModel;
  title: string;
  description: string;
  caption: ReactNode;
  /** Short explanation shown beside the result token, e.g. why Black wins. */
  result?: string;
  /** Position shown first, as a count of half-moves. */
  ply?: number;
}) {
  const labels = LABELS[game.locale];
  const payload: GamePayload = {
    fen: game.fen,
    startPly: game.startPly,
    orientation: game.orientation,
    locale: game.locale,
    plies: game.plies,
    ...(game.variations && { variations: game.variations }),
  };
  return (
    <figure
      className="chess-game"
      data-post-enhancement="chess"
      data-chess-game={JSON.stringify(payload)}
      data-ply={ply}
    >
      <div className="chess-game__layout">
        <div className="chess-game__board">
          <GroundHost label={description} />
          <BoardSvg
            id={id}
            title={title}
            description={description}
            fen={fenAt(game, ply)}
            orientation={game.orientation}
          />
        </div>
        <div className="chess-game__panel">
          {/* The PGN below carries the same moves for Markdown readers. */}
          <div className="chess-game__moves" data-agent-omit="">
            <ol className="chess-moves" aria-label={labels.moves}>
              {rows(game).map((row) =>
                row.kind === 'comment' ? (
                  <li key={`comment-${row.ply}`} className="chess-moves__comment">
                    {row.text}
                  </li>
                ) : row.kind === 'variations' ? (
                  <li key={`variations-${row.ply}`} className="chess-moves__variations">
                    {row.lines.map((line) => (
                      <Line key={line} game={game} start={line} />
                    ))}
                  </li>
                ) : (
                  <li key={`row-${row.plies.find(Boolean)}`} className="chess-moves__row">
                    <span className="chess-moves__number" aria-hidden="true">
                      {row.number}
                    </span>
                    {[0, 1].map((cell) => {
                      const index = row.plies[cell];
                      return index === undefined ? (
                        <span
                          key={cell}
                          className="chess-move chess-move--empty"
                          aria-hidden="true"
                        >
                          {cell === 0 && row.plies[1] ? '…' : ''}
                        </span>
                      ) : (
                        <Move key={cell} game={game} node={index} />
                      );
                    })}
                  </li>
                ),
              )}
              <li className="chess-moves__result">
                <strong>{game.result}</strong>
                {result && <span>{result}</span>}
              </li>
            </ol>
          </div>
          <p className="chess-game__comment" data-chess-comment="" hidden data-agent-omit="" />
          <div className="chess-controls" data-chess-controls="" hidden data-agent-omit="">
            {(['first', 'previous', 'next', 'last'] as const).map((action) => (
              <button
                key={action}
                type="button"
                data-action={action}
                aria-label={labels[action]}
                title={labels[action]}
              >
                <Icon path={ICONS[action]} />
              </button>
            ))}
            <button
              type="button"
              className="chess-controls__pgn"
              data-action="pgn"
              aria-pressed="false"
            >
              {labels.pgn}
            </button>
          </div>
          <p className="chess-game__status" data-chess-status="" role="status" data-agent-omit="" />
          <details className="chess-pgn" data-chess-pgn="">
            <summary>{labels.pgn}</summary>
            <pre>
              <code className="language-pgn">{game.pgn}</code>
            </pre>
          </details>
        </div>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
