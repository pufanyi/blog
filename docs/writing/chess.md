# Chess games and diagrams

The shared chess kit in `content/shared/chess` turns a PGN into a replayable
game viewer and into captioned position diagrams. One parsed game feeds every
figure, so the moves, positions, arrows, and exported PGN cannot drift apart.
Use a [Lichess embed](media.md#pdfs-and-external-embeds) instead when readers
need engine analysis or a Study's own chapters.

## Write the game once

Keep each game in a post-local module. `parseGame` runs during generation: it
replays every move under the PGN's `Variant` (standard chess when absent) and
fails the build with the first illegal move, such as
`Illegal or unsupported move 7.Kxd3 in antichess`.

```ts
// content/posts/<slug>/scripts/games.ts
import { parseGame } from '../../../../../shared/chess';

export const E4_B5 = parseGame(`
[Variant "Antichess"]
[Result "0-1"]

1. e4 b5 2. Bxb5 Nf6 { The knight attacks e4. [%cal Gf6e4] } 3. Bxd7 Nxe4 0-1
`);
```

Supported PGN input:

- **Tags.** Any tags are kept. `FEN` and `SetUp` start from a position, and
  placeholder values such as `?` are dropped from the published PGN.
- **Result.** If the final position is decisive, a declared result must agree
  with it. A result of `*` is filled in from that position.
- **Comments.** Comment text appears in the move list.
- **Shapes.** Lichess `[%cal]` arrows and `[%csl]` squares are drawn on the
  board while that move is shown.
- **Variations.** Parenthesized alternatives may nest to any depth, and every
  move in them is replayed and validated like the main line.
- **Move annotations.** `!`, `?`, `!!`, `??`, `!?`, and `?!` (NAGs `$1`–`$6`)
  are shown after the move and kept in the PGN. Other NAGs, such as position
  assessments, are ignored.
- **Not supported.** Comments before a variation's first move are ignored, and
  so are variants that need pockets, such as crazyhouse.

`parseGame(pgn, { orientation: 'black', locale: 'en' })` flips the board and
switches the interface labels from Chinese to English.

## Show the game

Import the kit from a post component. The kit's styles and browser controller
then load with that article automatically, and only with it. See the
[architecture contract](../architecture.md#article-payload-and-lifecycle).

```tsx
import { ChessGame } from '../../../../../shared/chess';
import { E4_B5 } from './games';

const MainLine = () => (
  <ChessGame
    id="e4-b5"
    game={E4_B5}
    title="1.e4 b5 主线"
    description="逐步查看黑方如何引导清扫。"
    caption="1.e4 b5 主线：从初始局面逐步查看双方走法。"
    result="黑方无棋可走，获胜"
  />
);

export const POST_COMPONENTS = { MainLine };
```

`result` explains the main line's result next to its token. `ply` chooses the
first main-line position shown; the default is the starting position. The article no longer
needs its own PGN block, because the viewer includes one.

### Show alternatives as variations

When a section compares several continuations from one position, write them
as variations of one game instead of listing move sequences in the prose. Put
each alternative right after the main-line move it replaces, and open the
viewer on the branch point with `ply`:

```ts
export const RECAPTURES = parseGame(`
[Variant "Antichess"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
6. Bxd2! (6. Bxg8?? Rxg8 7. Kxd2 h5!) (6. Kxd2 Bd5! 7. Bxg8 Bxa2
  8. Rxa2! (8. Bxh7?? Rxh7) 8... Rxg8)
6... Bf3 (6... Bd5?? 7. Bxg8 Rxg8 8. Qh5!) 7. Bxg8 *
`);
```

`<ChessGame game={RECAPTURES} ply={10} … />` then opens on 5...Qxd2. The
main line still numbers its positions by ply, so `ply`, `ChessDiagram`,
`moveText`, and `moveArrows` refer only to the main line. A comment at the
end of a variation is a good place for its verdict.

### What readers get

| Situation | Layout and behavior |
| --- | --- |
| Column at least 480px wide | The board is on the left. The panel on the right matches the board's height: a scrolling move table with comments across both columns, the result row, and a control bar along the bottom. |
| Phones | The board comes first, then the control bar, then a single line of moves that scrolls sideways. The current move's comment appears below that line. |
| Variations | Wide panels list each move's alternatives below it, with nested variations indented further and comments inline. On phones they appear inline in parentheses in the move strip. Screen readers announce variation moves as such. |
| Stepping | The current move stays centered inside the move pane, which fades at its scrolled edges. The page itself never scrolls. Clicking a move in a variation enters that line. |
| Keyboard | Clicking the board focuses it. ←/→ step one move, ↑/↓ a full move, and Home/End jump to the start and to the end of the line being viewed, from anywhere in the viewer. → follows the current line; ← steps back into the line a variation branched from. The move list is a single tab stop. |
| PGN | The PGN button swaps the move pane for the PGN, which uses the site's code block and its Copy button. |
| No JavaScript, print | The static board, the full move list, and a PGN disclosure. |
| Markdown export | The board description with its FEN, then the PGN, variations included, as a fenced `pgn` block. |

## Draw positions from the same game

`ChessDiagram` shows the position after a number of half-moves (`ply`). Number
them as the game does: `ply={9}` is the position after 5.Bxf7, and
`moveText(game, 2, 9)` prints the moves between positions 2 and 9 for a
caption. `moveArrows(game, plies)` draws the moves that led to the listed
positions; with more than one arrow, each is labeled with its move number.

```tsx
<ChessDiagram
  id="bishop-run"
  game={E4_B5}
  ply={9}
  title="白方 f1 象被迫连续吃子的路线"
  description="白象依次吃 b5、d7、e8、f7。"
  arrows={moveArrows(E4_B5, [3, 5, 7, 9])}
  marks={[{ square: 'b5', role: 'target' }]}
  caption={`${moveText(E4_B5, 2, 9)}：白象每吃一次，就停在下一个必须吃的位置上。`}
/>
```

Pass `fen="8/p7/8/8/8/8/P7/8 w - - 0 1"` instead of `game` and `ply` for a
standalone position.

Arrow roles differ in pattern or weight as well as color, and match the
Lichess colors:

| Role | Lichess | Drawing | Typical use |
| --- | --- | --- | --- |
| `path` | green | solid sage | moves played, in order |
| `option` | blue | dashed blue | alternatives that were available |
| `threat` | red | thin solid red | captures or attacks to watch |
| `idea` | yellow | dotted ochre | plans and ideas |

Square marks are `target`, a red outline (Lichess red), and `area`, an ochre
tint (other colors).

## Check the result

After changing a game or a diagram, run `pnpm generate:data` to replay the
PGN. Then inspect the served article in both themes, at desktop width and at
phone width. Finally, run the checks from [testing](../testing.md); the kit's
unit tests are in `scripts/lib/chess-kit.spec.mts`, and the article's browser
tests are in `e2e/antichess.spec.ts`.
