# Antichess principles and tactics — 2026-10-29

## Scope and sources

Expanded the existing principles article into a single principles-and-basic-tactics
lesson. The next article is planned to cover elementary endgames; no second post
was created. Preserved the existing authors and dated the substantive revision.

Consulted Liardet's basic tactical principle, relay, intermediate-move and weak-point
lessons, firebatprime's guide, the Lichess rules, and Andrejic's publicly available
contents. The three new reduced positions are original teaching examples, not
transcriptions of source diagrams. They isolate capture order, a free preparation
tempo for a relay, and an alternative capture that avoids immediate recapture.

Corrected the conditions on recaptures, blocked pawns, and double-control threats.
Distinguished having no safe move from having no legal move, and positional
sacrifices from forced winning combinations. Added three exercises with disclosed
answers. Kept the existing e4 illustrative line explicitly separate from a proof
covering all White alternatives.

Reviewed `docs/architecture.md` and the content/editorial agreements. The existing
post-local static-board and enhancement contracts are unchanged; no public handbook
change is needed. The new diagrams reuse the existing Board component and styles.

## Validation

Validated a patch containing only the four article files against base `3de85d0`
in `/Users/bob/workspace/blog-antichess-content`, with its own frozen-lockfile
installation, Node 24.22.1 and pnpm 12.15.0. Concurrent chess-viewer development was
excluded from that validation.

- `pnpm check`: passed after the final article change.
- `TMPDIR=/private/tmp pnpm test --watch=false`: 106 content tests and 242 app tests passed.
- `pnpm build`: passed, including 188 prerendered routes and deployment preparation.
  The first attempt emitted the routes then aborted at process exit (134); an
  unchanged retry completed successfully. No source workaround was introduced.
- Existing Antichess Playwright tests: all six desktop/mobile cases passed against
  production output, including playback, layout and no-JavaScript rendering.
- Additional production browser inspection: new boards have 5, 5 and 6 pieces,
  respectively; checked at 1280px and 390px in both themes, with no page errors or
  horizontal overflow. Inspected screenshots for piece placement, arrows and text.
  All three static SVG diagrams remain visible without JavaScript.
- Generated Markdown retains the positions, descriptions, lines, explanations,
  exercises and citations.
- Independent python-chess 1.11.2 AntichessBoard verification: both capture-order
  branches have exactly one legal reply at every ply after the first decision and
  end with opposite winners. Every Black reply in the relay and intermediate
  examples is forced; both finish with White losing all pieces. Verified the three
  alternatives after Nxe3 and the exercise positions, including removal of h7.
- Rechecked the original 31-ply e4 line against authored from/to data: 12 of White's
  15 post-opening moves are unique; Black wins by stalemate with 11 White pieces.

Temporary rule-verification scripts and input JSON are under
`tmp/antichess-principles/` in the main workspace. Screenshots and the browser
inspection script are under `tmp/antichess-review/` in the validation worktree.
No publication or push was performed.

## PR #27 conflict reconciliation

Merged main `cdd2bd2` after the shared chess kit landed in PR #26. Resolved the
board-component conflict by retaining the shared `ChessGame`/`ChessDiagram`
implementation and porting all three new tactical figures to `ChessDiagram` with
full FENs. Preserved the main branch's removal of the duplicate authored PGN block;
the shared viewer supplies that PGN. The article explanations, tactical positions,
and exercises are unchanged. Reviewed `docs/writing/chess.md`; this is a consumer
migration and does not change the shared authoring contract.

Added browser assertions for the tactical positions and piece counts, including
no-JavaScript rendering, so the merge cannot silently drop the new diagrams.
The earlier validation above remains a historical record of the pre-kit version.
