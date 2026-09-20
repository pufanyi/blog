# Robotics simulation article — 2026-09-20

## Scope

Added the standalone Chinese tutorial at
`content/posts/robotics/simulation-engines/`, outside ML Revisited. Its teaching
sequence follows the series' editorial principles: a robot pushing a block,
state representation, dynamics and contact derivation, implementation choices,
GPU batching, differentiation, comparison, and experimental selection.

The article includes 22 bibliography entries, versioned source-code entry points,
and three accessible build-time SVG figures. It adds no client-side scripts or
shared application changes. The writing/publishing, media, and reference guides
were reviewed; their documented authoring contracts remain unchanged.

## Research boundary

Official release APIs and release pages were checked on 2026-09-20:

| Project | Article baseline | Release date |
| --- | --- | --- |
| MuJoCo | 3.13.0 | 2026-09-09 |
| Isaac Sim | 6.1.0 | 2026-09-10 |
| Genesis World | 1.4.1 | 2026-09-12 |
| Newton | 1.6.0 | 2026-09-10 |

Isaac Sim 7.0.0a1 was identified as a prerelease, not used as the stable baseline.
Versioned source files were inspected alongside documentation, especially the
Genesis 1.4.1 rigid gradient tests/options and Newton 1.6.0 solver matrix.

Important distinctions retained in the article:

- Platform scope versus physics engine and task framework scope.
- MJX-JAX differentiation versus the non-autodiff Warp backend.
- Current Genesis Quadrants architecture and rigid differentiation, with
  collision/friction/coupler restrictions; the early MPM-only description is
  not a valid description of this baseline.
- Newton differentiation is solver-specific; the MuJoCo and XPBD solvers do
  not inherit autodiff simply from the Warp infrastructure.
- Isaac Sim 6.1 Newton integration remains experimental.
- No four-engine benchmark or simulator execution was performed. Numbers in
  the contact example are elementary analytical examples, not measurements.
  API sketches are explicitly pseudocode. Selection guidance is reasoned
  interpretation, not an empirical speed or accuracy ranking.

All 22 bibliography URLs and the article's direct release/source links returned
HTTP 200 during verification. Dynamic `stable`/`latest` references record the
access date; future updates should recheck their claims against release tags.

## Validation

Validation used an isolated worktree based on
`11ccbf8d8672739f15bec6a320cd7b57c6172d07`, with only this article overlaid and its
own `node_modules`. Node 24.18.1 and pnpm 12.3.4 were used with
`pnpm install --frozen-lockfile`. Existing ViT and long-article audit edits in the
shared checkout were preserved and were not included in this validation.

- `pnpm format:bib` and targeted Biome formatting completed.
- `pnpm check` passed after the final article/figure changes.
- `pnpm test --watch=false` passed: 83 content tests and 79 application tests.
- `pnpm build` passed, prerendering 165 routes and preparing deployment output.
- The generated Markdown retains formulas, comparison tables, figure captions,
  disclosure content, and the generated bibliography.
- Served production route `/blog/robotics/simulation-engines` was checked in
  Chromium 151.0.7922.34 and WebKit 26.5 at 1280 and 390 CSS pixels, in light
  and dark themes, using the real pinned MathJax 4.1.3 engine/fonts/worker.
- All four browser/width combinations rendered 94 math containers and 22
  bibliography entries, with no MathJax error nodes, undefined TeX labels,
  missing local bibliography targets, empty SVG titles, page exceptions, or
  document-level horizontal overflow. Disclosures were opened and the article
  was traversed through its section headings. Diagram and opening screenshots
  were captured; representative screenshots were visually inspected.

The host needed its existing temporary browser libraries and CJK font setup.
WebKit initially failed to create a page until the process-local Mesa EGL vendor
configuration was supplied. No dependency or host configuration was committed.
A first preview port was occupied; validation used its own server on port 48763.

Local research and browser evidence are retained under ignored
`tmp/sim-research/` and `tmp/sim-validation/`. This is local publication-readiness
evidence; the article was not pushed or deployed.
