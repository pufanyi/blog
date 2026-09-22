# RL score-centering chapter — 2026-09-22

## Scope and sources

Extended the existing RL article after GRPO with a standalone chapter about
training-inference mismatch, score centering, baselines, importance sampling,
and Bellman Policy Optimization. Preserved the existing article, authors,
unfinished chapters, and diffusion cross-links. Updated the substantive date
and description and appended the editing model's byline.

Primary research:

- Marek and Ryabinin, [Score Centering Stabilizes Off-policy Reinforcement
  Learning](https://arxiv.org/abs/2609.20807), September 2026 v1: main argument,
  experimental setup and results, and Appendix A's full and top-k corrections.
- Song et al., [Bellman Policy Optimization](https://arxiv.org/abs/2609.15987),
  September 2026 v1: Sections 2–3, particularly the residual, linearization,
  binary KL, additive smoothing, clipping mask, and detached weights.
- The authors' [reference implementation](https://github.com/martin-marek/score-centering),
  including the README examples and `losses.py` full/head/tail gradient paths.

Temporary source copies, numerical checks, logs, and screenshots remain in
ignored `tmp/score-centering-research/`. The user's comparison image guided
coverage, but the article derives the comparison with explicit assumptions
rather than publishing the screenshot or attributing unverified community claims.
No LLM training experiment was reproduced.

## Mathematical and editorial decisions

- Fix a prefix and the same action-value signal before comparing updates. Use
  `V_q` for the sampler mean of that signal, distinguishing it from the value
  function of a particular continuation policy.
- Separate mean-score drift from covariance bias. Exact score centering restores
  invariance to a constant reward shift; it is not a general unbiasedness or
  minimum-variance claim.
- Explain the expectation-level equivalence with an exact sampler baseline,
  the distinction from prompt-level group centering, and the finite-group caveat.
- Center the entire weighted score when composing with truncated/masked IS.
  State support coverage and the difference between actual sampling probabilities
  and probabilities before temperature/truncation.
- The full-KL linearized BPO contribution equals the corresponding SC contribution
  per sample when coefficients and aggregation agree. Keep this separate from the
  original squared-residual objective and practical BPO's binary KL/smoothing/mask.
- Derive the complementary-probability ratio. A three-token counterexample shows
  that binary KL alone can lose exact centering; the two-action special case
  would conceal this distinction.
- Practical BPO's sign-dependent mask requires joint expectations when rewards
  or group statistics are random. The simplified comparison row explicitly fixes
  its action-dependent advantage.
- Derive the top-k head/tail approximation, detached coefficients, and residual
  bias. Distinguish logging top-k probabilities from truncating the sampler.
- Restore prefix visitation and continuation-policy differences before discussing
  whole-trajectory unbiasedness. Bound the experimental claims to the paper's
  amplified-mismatch, shared-objective comparison and training metrics.

The numerical diagram and its transcript derive from one set of action data.
It shows naive updates changing sign under a common reward offset, while SC and
on-policy updates remain constant but unequal. Two locally scrollable comparison
tables retain readable method names and formulas on narrow screens. Supplementary
PMD and implementation derivations use native disclosures; all content survives
the Markdown export.

Reviewed `docs/ml-editorial.md`, `content/AGENTS.md`, the writing handbook,
`docs/development.md`, and `docs/architecture.md`. This is an article-local
extension using existing authoring contracts; no handbook or application-contract
change is necessary.

## Validation

The shared checkout started clean at `7cc2bf2`. Concurrent reading-layout edits
appeared during writing, so validation uses a detached worktree based on that
commit with only this task's article files overlaid and independently installed
dependencies. It does not validate the other task's unfinished layout changes.
Node 24.18.1 and pnpm 12.3.4 match the repository. Lifecycle commands run
sequentially.

Independent numerical checks passed for 50 probability-distribution examples,
200 finite-difference gradient checks of full SC/full KL/binary KL/top-k losses,
weighted-tail reductions for plain, exact, truncated and masked corrections,
the reward-shift example, the three-token counterexample, and four paths through
a two-step PMD tree. The checks use double-precision scalar arithmetic, not a
training-framework benchmark; the illustrative PyTorch snippet was not executed.

After the final content and table-style changes:

- `pnpm check` passed, including generation, formatting, strict TypeScript,
  Angular templates, MDX lint, and bibliography checks.
- `pnpm test --watch=false` passed: 90 content tests and 205 application tests.
- `pnpm build` passed, prerendering 171 routes and preparing deployment output.
- Served the production RL route in Chromium 151.0.7922.34 and WebKit 26.5 at
  1280 and 390 CSS pixels, in light and dark themes. Reviewed the new chapter,
  diagram, BPO explanation, and both ends of the two comparison tables.
- Traversed all article headings, opened every disclosure, followed the new
  chapter through the desktop/mobile TOC, and checked citation and local-anchor
  targets. The generated article contains 603 static math containers. No page
  errors, undefined TeX, MathJax error nodes, display-formula overflow, SVG label
  overflow, or document-level horizontal overflow occurred.
- Normal reading and complete traversal loaded no browser MathJax engine or
  worker and did not request the RL body chunk again. Caption mathematics and
  the Markdown export preserve the numerical example and derivations.
- Startup/font readiness and heading traversal were measured separately:
  Chromium about 1.3–2.5 s / 2.5–3.0 s; WebKit about 6.7–7.7 s / 4.3–5.9 s.
  These are local smoke observations with concurrent host activity, not controlled
  performance benchmarks.
- All 18 existing math/rendering regressions passed across desktop/mobile
  Chromium and WebKit, including copied TeX, stable right-click geometry,
  static/browser typography agreement, and actual browser MathJax on dynamic
  Angular-authored formulas.
- `git diff --check` passed for this task's files. Article sources in the shared
  checkout and validation worktree match byte-for-byte.

The additional three existing resource-budget tests failed. Rebuilt the untouched
starting commit `7cc2bf2` in a second detached worktree with its own dependencies
and reproduced all three failures there. Decoded-byte measurements:

| Budget | Limit | Untouched starting commit | With this article change |
| --- | ---: | ---: | ---: |
| Cold search payload | 1,923,536 | 2,071,066 | 2,115,808 |
| `/blog` code/resources | 649,473 | 750,959 | 751,029 |
| `/blog/oi-icpc/codeforces/cf551c` code/resources | 762,330 | 845,465 | 845,535 |

The article adds 44,742 bytes to the already-lazy cold-search payload and 70 bytes
to the two measured ordinary-page resource totals. The existing thresholds remain
unchanged. These failures are recorded, not counted as passes or repaired by
editing unrelated application code. Raw per-request reports and the baseline
comparison are retained under the task's ignored directory.

Browser review reused existing temporary host libraries, CJK fonts, and software
rendering configuration. The task's production previews used ports 48802 and
48803 and were stopped afterward. No host workaround or persistent test fixture
was added to the repository. No commit, push, or deployment is part of this task.
