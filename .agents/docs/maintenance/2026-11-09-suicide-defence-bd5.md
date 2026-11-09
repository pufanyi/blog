# Suicide Defence 6...Bd5 refutation — 2026-11-09

Scope: `content/posts/chess/antichess/openings/classical-defence`, the line
`1.e3 b5 2.Bxb5 Bb7 3.Bxd7 Bxg2 4.Bxe8 Bxh1 5.Bxf7 Qxd2 6.Bxd2 Bd5`.
Baseline commit: `b43bd00`.

## Finding

The article stated only `7.Bxg8 Rxg8 8.Qh5!`. Black has three recaptures
after `7.Bxg8`, and White also has `7.Bxd5`. No published source we cite covers
the other branches, so they were solved locally.

## Method

A proof-number search on python-chess 1.11.2 `AntichessBoard`
(scratch scripts only, not retained). Each white alternative was classified by
solving the resulting position with White as attacker; "loses" means the
search disproved a forced White win (Black wins or the line is drawn).

| Position | Result |
| --- | --- |
| after `6...Bd5` | `7.Bxg8` wins (277-node proof); `7.Bxd5` does not |
| `7.Bxd5` | `7...Nh6`, `7...Nf6`, `7...e6` win for Black; White then has one legal move per turn through `17.Qxh5` |
| `7...Rxg8` | `8.Qh5`, `8.c4`, `8.Ba5` win; 22 moves disproved; `8.Bc3`, `8.Qg4` unresolved at 200k nodes |
| `7...Bxg8` | `8.c4`, `8.Qg4`, `8.Qh5`, `8.Bc3` win; seven moves unresolved at 20k nodes |
| `7...Bxa2` | `8.Rxa2` and `8.Bxh7` both win |
| `7...Bxa2 8.Rxa2 Rxg8 9.Rxa7 Rxa7` | `10.Ba5` wins; `10.Bc3`, `10.Qf3` unresolved at 3k nodes |

In each published line, Black has exactly one legal move from White's eighth
move onward. The article claims uniqueness only where every alternative was
resolved (`7.Bxg8`).

## Validation

`pnpm check`, `pnpm test --watch=false`, and `playwright test
e2e/antichess.spec.ts` (18 passed) on Node 24.22.1. The e2e run used a fresh
`pnpm build`; the `pretest:e2e` rebuild later failed twice on a transient Google
Fonts fetch, so Playwright ran directly against that build, whose content
matched the final article.
