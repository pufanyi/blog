# Compression modernization research — 2026-09-24

Repository inspected at `fa5b989`; working tree was clean. This is research, not
an implemented performance change. Existing local build outputs were sampled
without rebuilding; their exact source revision is unverified. Live requests
used `https://pufanyi.com` and measured response body bytes, excluding HTTP/TLS
overhead. No browser navigation timing or visual quality comparison was run.

## Observations

- Live homepage: 87,394 decoded bytes; 11,713 bytes with Zstandard, 11,024 with
  Brotli-only negotiation, and 11,280 with gzip-only negotiation. These are
  separate requests, not a controlled encoder benchmark.
- Live `main-BHKIDQOG.js`: 40,376 Zstandard bytes; live
  `styles-AWWJGQRR.css`: 16,290 Zstandard bytes. Both return
  `Cache-Control: public, max-age=0, must-revalidate`.
- Live `media/Phosphor-FILTTWNO.woff2`: 147,380 bytes, with the same cache policy.
  The build imports the full regular Phosphor stylesheet. Legacy font formats
  also exist in the build, but their presence does not imply browser download.
- `/profile.md` also returns Zstandard. Homepage HTML retains `Vary: Accept`
  and private revalidation because the Worker negotiates HTML versus Markdown.
- Authored post assets contain 45 AVIF files totaling 3,416,850 bytes. Merely
  adopting AVIF is therefore not a new optimization. One AVIF is 1,014,400 bytes.
- Two UMM SVGs contain Base64 data: `model_diagram.svg` is 1,164,313 bytes and
  `attention_mask.svg` is 736,141 bytes. Local Brotli quality 11 produces
  835,074 and 508,118 bytes respectively. HTTP compression alone leaves them large.
- The MDX renderer sets dimensions, lazy loading, async decoding and zoom source;
  this path does not generate responsive raster variants or automatic `srcset`.
- Existing resource budgets measure decoded code, with images/fonts outside the
  code budget. Search already loads lazily; its generated data includes document
  text and a serialized index. Further reductions require measuring their split.

## Recommended order

1. Subset the existing icon font or use only the required SVG icons. Preserve
   the existing icon style and account for dynamically selected icon names.
2. Apply long browser caching only to content-fingerprinted assets. Generate
   precise rules rather than assigning immutable caching to all `/assets` or
   `/posts` files. Preserve negotiated page caching and old-chunk recovery.
3. Inspect embedded raster content in the two SVGs and optimize that content;
   preserve vector text/lines and diagram fidelity. Removing Base64 alone is
   not a promise of a proportional compressed-byte reduction.
4. Add build-time responsive raster variants with `srcset`/`sizes`, preserving
   the full-resolution zoom source. Evaluate diagram text at mobile DPR 2/3.
5. Measure search index/text duplication and compressed cold-search transfer
   before choosing snippet splitting or a more compact serialized layout.
6. Add separate compressed-transfer measurements including fonts, images and
   worker requests; retain decoded-byte and runtime budgets.

## Compression algorithms and experiments

Keep Cloudflare negotiation as the baseline: live compression already works.
For the sampled local homepage, gzip 9 / Brotli 6 / Brotli 11 yielded
11,401 / 10,267 / 9,155 bytes from 87,521 bytes. Local main JS yielded
38,147 / 36,845 / 33,637 bytes from 128,099 bytes. These show potential encoding
tradeoffs, not deployable savings: the live and local HTML differ, and emitting
`.br` sidecars does not itself establish correct hosting negotiation.

Shared dictionary compression (`dcb`/`dcz`) is a later experiment for returning
visitors. Cloudflare documents passthrough, not automatic dictionary/delta
generation. It needs dictionary retention, compatible clients, correct variant
caching and ordinary compression fallback. The static assets setup does not
gain this behavior by merely toggling a setting.

## Official references

- [Cloudflare compression](https://developers.cloudflare.com/speed/optimization/content/compression/)
- [Static asset headers and fingerprinted caching](https://developers.cloudflare.com/workers/static-assets/headers/)
- [Shared dictionary requirements](https://developers.cloudflare.com/speed/optimization/content/shared-dictionaries/)
- [Font formats and subsetting](https://web.dev/articles/font-best-practices)
- [Image format selection](https://web.dev/articles/choose-the-right-image-format)

Only this research record and its index were changed. Application and authoring
contracts remain unchanged; no lifecycle tests were run for this research-only
update and no deployment or push was performed.
