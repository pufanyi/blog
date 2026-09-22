# ViT model explanations — 2026-09-22

## Scope

Expanded `content/posts/ml/ml-revisit/vit/index.mdx` at the author's request.
Removed the umbrella model chapter and its compact comparison table. Fourteen
standalone model chapters now follow the patch, position, computation,
connector, and answer-training foundations. Model chapters contain no nested
model headings. Existing authors and publication date are preserved; the
substantive update date is 2026-09-22.

The new narrative explains CLIP and sigmoid objectives, SigLIP 2 regional and
visual supervision, DINOv3 Gram anchoring, Qwen's window/global communication
and DeepStack, InternVL tiling and ViCO, MiniCPM spatial/temporal compression,
codec-driven input selection, Gemma pooling and budgets, and encoder-free
shared computation. Current public Qwen3.8 and MiniCPM-V 4.6 checkpoints are
included with explicit source and configuration boundaries. This is not an
exhaustive model catalogue or an empirical performance ranking.

Added one post-local static SVG explaining the MiniCPM-V 4.6 compression paths.
Its counts, accessible description, and caption derive from shared constants.
The article keeps its four previous figures and has 28 cited references.
No application logic, dependencies, or browser controllers changed. The owning
editorial and content guides were reviewed; their contracts remain unchanged.

## Research and numerical checks

Read original papers and official cards/configuration/code, with temporary
source copies under ignored `tmp/vit-expansion/`:

- SigLIP 2, especially the local supervision and NaFlex sections. NaFlex does
  not use the fixed-resolution recipe's self-distillation and masked prediction.
- DINOv3, including registers, the separate Gram teacher, Gram refinement, and
  high-resolution teacher features. Derived the pairwise-similarity objective
  and its invariance to a common orthogonal feature rotation.
- Qwen2.5-VL and Qwen3-VL reports; Qwen3-VL-8B, Qwen3.5-9B, and Qwen3.8-27B
  configurations and current model cards. Distinguish encoder 2D RoPE from
  language-side MRoPE, depth injection from sequence concatenation, and
  configuration evidence from unreleased training details.
- InternVL3.5 report and card, including the two ViCO stages and the Flash
  router's post-encoder placement.
- MiniCPM-V 4.5/4.6 cards and configurations; LLaVA-UHD v4; Transformers'
  `MiniCPMV4_6VisionModel` and `get_image_features`. The current implementation
  inserts the merger after zero-based block 6: seven full-length blocks and
  twenty reduced-length blocks. The 4x mode bypasses that internal merger.
- OneVision-Encoder report and existing official Large model card. Codec
  signals select RGB patches rather than replacing RGB model inputs.
- Gemma 3 report, Gemma 4 model card, 31B configuration, image processor and
  vision pooling implementation. Kept the 12B Unified architecture separate.

Arithmetic checks cover the Qwen window attention matrix ratio (about 16.1%
for the specified grid and layer schedule), spatial merges, tile sums, the
different denominators of MiniCPM's 96x and 24x examples, codec patch selection,
and Gemma's square-input budget rounding (280-token budget, 768-pixel side,
2304 valid patches, 256 valid output positions). These are instructional
calculations, not measured latency or quality results. No model weights were
downloaded and no model inference or training benchmarks were run.

All generated internal anchor links, including the SSL and media-compression
cross-links, resolve. The generated article has 188 static math containers,
five figures, and 28 bibliography entries with no missing or unused citations.

## Validation

Validation starts from clean baseline `bfb2a41` in the shared checkout, using
Node 24.18.1 and pnpm 12.3.4. Lifecycle commands run sequentially. Raw validation
logs and screenshots remain in ignored `tmp/vit-expansion/`.

- `pnpm format:bib` completed and scoped Biome checking required no fixes.
- `pnpm check` passed after the final content and diagram changes.
- `pnpm test --watch=false` passed: 89 content tests and 200 application tests.
- `pnpm build` passed: 167 prerendered routes and deployment output prepared.
- Served `/blog/ml/ml-revisit/vit` in Chromium 151.0.7922.34 and WebKit 26.5
  at 1280 and 390 CSS pixels, in light and dark themes. Traversed every heading,
  verified all TOC targets, followed the new MiniCPM-V 4.6 TOC entry, and checked
  all fourteen model headings are independent level-two entries.
- Captured the opening, all five figures, and representative SigLIP 2, DINOv3,
  and Gemma sections. Manually inspected desktop and narrow screenshots,
  including both ends of the new diagram's mobile horizontal scroll area.
  Labels, arrows, theme contrast, formulas, and chapter transitions are legible.
- All four engine/width combinations had 188 static math containers, five
  figures, and 28 references. No page errors, undefined TeX, MathJax error nodes,
  empty figure titles, raw caption formulas, or document-level horizontal
  overflow appeared. The wider formula and diagram use local scroll areas.
- Normal reading loads neither the browser MathJax engine/worker nor the
  article's duplicate body module. A separate Chromium request audit confirmed
  the built `vit` body chunk is not requested during initial reading/traversal.
- Startup and complete heading traversal were measured separately: about
  0.5 s / 0.9 s in Chromium and 4.0–4.4 s / 1.0–1.1 s in WebKit. These include
  local font readiness and are smoke-test observations, not controlled speed
  benchmarks.
- The public Markdown export retains model headings, mathematical derivations,
  worked examples, figure captions, references, and the update date.
- `git diff --check` passed. No persistent test fixtures were added for this
  editorial change; temporary checks and browser captures stay under `tmp/`.

Browser review reused the existing temporary host-library, CJK-font, and Mesa
configuration. The preview used its own port 48766 and was stopped afterward.
No host setup changes were committed.

No commit, push, or deployment is part of this editing task.
