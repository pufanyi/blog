# Reusable chess game viewer — design, 2026-10-29

Status: implemented on `feat/chess-viewer`, with every open decision taking
its recommended option. Baseline: `main` at 3de85d0 (after #25). The current
contract is in [chess games and diagrams](../../../docs/writing/chess.md) and
the [architecture page](../../../docs/architecture.md); this record keeps the
reasoning.

## Goal

Replace the Antichess article's one-off main-line player with a shared tool
that any article can use by writing a PGN and one MDX tag. The tool owns the
whole flow, from an authored PGN, through build-time validation and static
HTML, to the interactive board, move list and PGN export. One source of truth
feeds every output.

## Problems in the current implementation

Data and flow:

- **The line is written twice and can drift.** The moves are hand-written
  `from`/`to` pairs in `e4-line.ts`, and the article separately contains a
  hand-written PGN in a `<details>` block. No check keeps the two in sync, and
  legality was checked once by hand (with python-chess), not by the build.
- **Game prose is hard-coded in the controller.** The client imports
  `E4_REFUTATION` directly and contains the final-position sentence, so a
  second game would need a second controller.
- **Everything is tied to one article.** Piece URLs point at
  `/posts/chess/antichess/principles/pieces/`. The 124 `anti-` CSS rules,
  including Chessground layout, live in the article's `styles.css`.
- **The move list is invisible without JavaScript.** It is `hidden` and
  `data-agent-omit`. Static readers and Markdown get only the separate PGN.

Interaction:

- **The move list scrolls with a jump.** `scrollTop` is assigned directly, so
  every step snaps the list. Nothing shows that the list continues above or
  below.
- **Every move is a tab stop.** Getting past the player takes 31 Tab presses,
  plus the four controls.
- **The board does not take focus.** Arrow keys work only after focus is in
  the panel; the board is the natural thing to click.
- **The phone list wraps.** On phones the moves wrap into a paragraph, so the
  current move jumps between lines; Lichess mobile uses a single horizontal
  strip.

## Design

### Authoring

PGN is the only input. An article keeps its games in a post-local module, so
the content cache's import tracking regenerates the article when a game
changes:

```ts
// content/posts/<slug>/scripts/games.ts
import { parseGame } from '../../../../../shared/chess/game';

export const E4_B5 = parseGame(String.raw`
[Variant "Antichess"]
[Result "0-1"]

1. e4 b5 2. Bxb5 Nf6 3. Bxd7 Nxe4 { Black declines to recapture. } ...
`);
```

```tsx
// content/posts/<slug>/scripts/boards.post-component.tsx
import { ChessDiagram, ChessGame, moveArrows } from '../../../../../shared/chess';
import { E4_B5 } from './games';

const MainLine = () => (
  <ChessGame game={E4_B5} title="1.e4 b5 主线" caption="…" result="黑方无棋可走，获胜" />
);
const BishopRun = () => (
  <ChessDiagram game={E4_B5} ply={9} arrows={moveArrows(E4_B5, [3, 5, 7, 9])} caption="…" />
);
```

`parseGame` runs only at build time, using chessops:

- It replays every move under the declared variant.
- It fails the build with the PGN line and SAN of the first illegal move.
- It records each node's SAN, UCI, `from`/`to`, FEN, comment and Lichess
  `[%cal]`/`[%csl]` shapes.

The model is a tree, not an array, so variations fit later without changing
the format.

`ChessDiagram` is the current static `Board`, generalized: it shows the
position after any ply of a game, or any FEN. Its arrows and marks keep the
two roles, `path` (solid sage, optionally numbered) and `option` (dashed
blue). The static diagrams therefore derive from the same game as the player,
not from a second move list.

### Output

`ChessGame` renders one figure. The static HTML carries the full meaning, and
JavaScript only upgrades it.

| Part | Static HTML / no JavaScript | Markdown export | Enhanced |
| --- | --- | --- | --- |
| Board | SVG of the starting ply, with FEN in `<desc>` | `<desc>` text | Chessground |
| Move list | Visible `<ol>` of SAN, with comments | omitted (PGN carries it) | clickable, current move highlighted |
| PGN | `<details>` containing canonical PGN text | fenced `pgn` block | PGN view with a Copy button |
| Result | Result row at the end of the list | included in PGN | same |

The canonical PGN comes from the parsed tree, so the displayed PGN cannot
drift from the moves. The browser receives a compact JSON payload: per-node
SAN, UCI, FEN, comment and shapes. The client needs only Chessground, not
chessops.

### Panel layout

The panel uses the same Lichess-style grid as #25. It shows the board on the
left and the panel on the right whenever the article column is at least
480px wide. Under 480px it shows the board, then the control bar, then a
one-line move strip.

```
┌────────────────────────────┬────────────────────────┐
│                            │ Antichess · 0-1        │  header (from PGN tags)
│                            ├────┬─────────┬─────────┤
│                            │  1 │ e4      │ b5      │
│          board             │  2 │ Bxb5    │ Nf6     │  ← only this pane scrolls,
│                            │  3 │ Bxd7    │ Nxe4    │    with fades at the edges
│                            │    │ Black declines…   │  comments span both columns
│                            │ ⋮                      │
│                            │      0-1 · 黑方…获胜    │
│                            ├────────────────────────┤
│                            │ ⏮   ◀   ▶   ⏭   │ PGN │  controls + PGN toggle
└────────────────────────────┴────────────────────────┘
                  caption
```

```
phone (< 480px column)
┌──────────────────────────┐
│          board           │
├──────────────────────────┤
│ ⏮   ◀   ▶   ⏭   │  PGN  │
├──────────────────────────┤
│ …2. Bxb5 Nf6 [3. Bxd7] N…│  ← one line, scrolls sideways, current move centered
└──────────────────────────┘
```

The PGN button swaps the move pane for the PGN text and a Copy button, in
the same space. The viewer therefore never grows a second box below itself.

### Interaction contract

- **One state value.** State is the current node. Every input (move click,
  buttons, keys) calls one `go(node)`. One `render()` updates the board,
  `aria-current`, the buttons, the live status and the scroll position.
- **Scrolling is contained.**
  - Stepping scrolls only the move pane, never the page; no `scrollIntoView`.
  - The pane scrolls with `scrollTo({ behavior: 'smooth' })`, or instantly
    under reduced motion or a held key.
  - The current move stays centered, as in Lichess. At the last ply the pane
    shows the result row.
  - `overscroll-behavior: contain` stops wheel scrolling from chaining into
    the page. Edge fades show that more moves exist.
- **The wheel is never captured.** The mouse wheel over the board does not
  step moves (Lichess does this). In an article it would trap page scrolling
  over a 440px area, so we reject it.
- **Keyboard.** The viewer is one composite widget:
  - The board and the move list are each a single tab stop. The list uses a
    roving `tabindex`.
  - ←/→ step, Home/End jump to the ends, and ↑/↓ move by a full move
    (two plies), as in Lichess.
  - Keys work while focus is anywhere in the viewer, including the board.
- **Announcements.** A polite live region speaks `moveText` and the result
  only on user steps, not on initial render.
- **Lifecycle.** Each viewer has one `AbortController` for events, and
  Chessground and its ResizeObserver are destroyed on navigation. Viewers
  attach lazily through `data-post-enhancement`.

### Code layout

```
content/shared/chess/
  game.ts          build time: parseGame (chessops), the tree model, canonical PGN, moveText
  diagram.tsx      ChessDiagram: static SVG board, arrows, marks, labels
  viewer.tsx       ChessGame: figure, panel markup, JSON payload
  client.ts        browser: mountChessViewers(container) => cleanup (Chessground only)
  styles.css       chess-* styles: board, Chessground layout, panel, pieces
public/assets/chess/cburnett/*.svg   pieces, shared by every article
```

The shared kit needs its stylesheet and client module on every article that
uses it, and only there. We propose a small generator feature for this, the
**shared component kit**. Its rules:

- When an article's post components import from `content/shared/<kit>/`,
  the generator includes that kit's `styles.css` in the article's
  `style[data-post-style]`.
- If the kit has a `client.ts`, the generator registers it as one more lazy
  enhancement for that article.
- The content cache already follows these imports for regeneration, so the
  same dependency walk drives this.

Nothing reaches the global stylesheet, and articles need no shim files. See
the decision below for the alternative.

### Migration of the Antichess article

1. Move the PGN into `games.ts`; delete `e4-line.ts`, the article's
   `<details>` PGN block and its `pieces/` folder.
2. Rebuild the five diagrams on `ChessDiagram` with the same arrows, marks
   and captions; `MainLine` becomes one `ChessGame` tag.
3. Delete the `anti-` CSS (about 450 lines). The article keeps only
   article-specific overrides, if any remain.
4. Delete `boards.post-client.ts`; the kit's client takes over.

The result is the same reader-visible content: the same moves, the same
figures and the same captions.

### Tests

- **Unit tests for `parseGame`:**
  - standard and antichess games parse;
  - an illegal move, a wrong variant and a malformed PGN each fail with a
    line number;
  - comments and `[%cal]`/`[%csl]` shapes are kept;
  - canonical PGN round-trips.
- **Generator tests:** a kit's styles and client are included only in
  articles that import the kit, and a kit change regenerates only its
  consumers.
- **Browser tests:**
  - stepping never changes `window.scrollY`;
  - the current move stays inside the pane, and the result is visible at
    the end;
  - Tab reaches the viewer in at most three stops;
  - keys work from the board;
  - PGN copy works;
  - without JavaScript, the move list and PGN are visible;
  - the layout holds at 1280, 1024 and 390px, in light and dark;
  - the Markdown export contains the PGN block.

### Documentation

- A new handbook page, `docs/writing/chess.md`, covers authoring games and
  diagrams and the supported PGN features.
- `docs/architecture.md` describes the shared kit mechanism.
- `docs/dependencies.md` records the chessops licence next to Chessground.
- `content/AGENTS.md` points to the kit instead of the article.

## Out of scope for the first version

- Free play or move entry.
- Engine evaluation.
- Board flipping.
- Pocket variants such as crazyhouse.
- Deep links to a ply.

The tree model and the client's node addressing leave room for variations.

## Open decisions

1. **How far the first version goes.**
   - Recommended: main line, PGN comments shown in the list, and Lichess
     `[%cal]`/`[%csl]` arrows shown while stepping.
   - Variations: parse them now, but show them inline only in phase 2.
2. **The chessops dependency.** chessops 0.15.1 is published by Lichess under
   GPL-3.0-or-later, the same licence as Chessground. It runs only at build
   time.
   - Recommended: add it.
   - Alternative: keep hand-written `from`/`to` pairs, which drops build-time
     legality checks and real PGN input.
3. **How the kit reaches articles.**
   - Recommended: the generator's shared component kit, described above.
   - Alternative: a global `src/styles/chess.css`, which is how
     `vision-examples.css` works today, plus a one-line `chess.post-client.ts`
     shim per article. That is simpler, but it puts about 10 kB of chess CSS
     on every page.
4. **Interface language.** The tool needs labels such as 上一步 and Copy PGN.
   Posts have no language field today.
   - Recommended: Chinese labels by default, plus a `locale="en"` prop backed
     by a second label table.

## Implementation notes

These are the places where the implementation departs from the proposal
above, with the reason for each:

- **PGN copy uses the site's code block.** Generation already renders every
  `pre > code` through the shared code renderer, with its Copy button. The
  viewer reuses that block instead of adding a second copy control.
- **Move-number errors, not line numbers.** chessops does not report PGN line
  numbers, so a build failure names the move instead, e.g.
  `Illegal or unsupported move 2.Ke3 in chess`.
- **Movetext on one line.** The canonical movetext is a single line, as
  Lichess exports it. The panel wraps it softly; hard 80-column breaks split
  moves awkwardly in a 14rem column.
- **No panel header.** The proposed header (players and variant from the PGN
  tags) was left out. The result row and the caption already say the same
  thing, and the article's tags are placeholders.
- **The figure is the container.** `.chess-game` is the size container and
  `.chess-game__layout` the grid. The layout is identical before and after the
  controller attaches, so enhancing a game causes no layout shift.

Validation on the worktree:

- `pnpm check` passes.
- `pnpm test --watch=false` passes, with 113 content tests including 7 in
  `chess-kit.spec.mts`. As on `main`, it was run with `TMPDIR` resolved
  through `pwd -P`.
- The antichess browser tests pass, 10 of 10, on the desktop and mobile
  projects.
- Chromium screenshots at 1280 (light and dark), 1024 and 390px showed that
  stepping through all 31 plies never changed `scrollY`.
- WebKit was not run: Playwright WebKit does not launch on this host.
