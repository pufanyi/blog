import type { ReactNode } from 'react';
import { BoardSvg, GroundHost } from './board';
import type { ChessGameModel } from './game';
import { fenAt, type GamePayload, LABELS, moveNumber, moveText } from './model';

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
  | { readonly kind: 'comment'; readonly ply: number; readonly text: string };

/**
 * Groups half-moves into Lichess-style rows: number, White, Black. A comment
 * ends its row, and Black's reply then starts a new row after an ellipsis.
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
    if (comment) {
      result.push({ kind: 'comment', ply, text: comment });
      open = undefined;
    }
  });
  return result;
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
                        <span
                          key={cell}
                          className="chess-move"
                          data-ply={index}
                          aria-label={moveText(game, index - 1, index)}
                        >
                          {game.plies[index - 1].san}
                        </span>
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
