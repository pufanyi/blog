# Content working agreements

These instructions apply to authored CV data and posts. Before editing the
ML Revisited series, read [its editorial principles](../docs/ml-editorial.md).
For Jekyll, Hexo, or Typst imports, also read
[content migrations](../docs/content-migrations.md).

## Prose, structure, and assets

- Treat existing prose as author-owned. Preserve its wording, tone, and
  structure unless the user asks for a rewrite; make the smallest correction
  needed for genuine factual or rendering errors.
  Write revised posts as standalone explanations for readers, without carrying
  review rebuttals or draft-correction framing into the prose.

- In technical posts, prefer established English terminology without routine
  Chinese parenthetical translations. Improve clarity by explaining mechanisms
  and tradeoffs, not by translating basic terms such as gradient accumulation.

- For MathJax compatibility, expand legacy KaTeX aliases such as `\N` to
  equivalent standard TeX (`\mathbb{N}`), and `\empty` to `\emptyset`. Match complete commands so `\R`
  does not alter `\Rightarrow`. Inspect formulas for red undefined
  commands as well as `mjx-merror`; unsupported macros can render without
  producing an error node.
  When composing TeX labels from string fragments, separate a command from
  following letters so concatenation does not create an undefined command.

- Each blog post lives at `content/posts/<slug>/index.mdx`; the slug is its full
  relative directory path, such as `oi-icpc/codeforces/cf551c`. The generator and
  BibTeX checker share recursive discovery, stopping at article roots so asset
  folders are not treated as categories. Empty/draft-only categories are omitted.
  Top-level `page` and `contents`, and article basename `index`, are reserved
  for navigation and Markdown indexes. Directory segments use letters, digits,
  `_`, and `-`.
  `index.mdx` starts with YAML front matter delimited by `---`;
  `title` and `date` (`YYYY-MM-DD`) are required; `description`, `coverImage`,
  and `updated` are optional. The archive shows generated opening-paragraph
  excerpts, controlled by `showExcerpts`, rather than authored descriptions.
  Build excerpts from rendered prose, omit non-prose blocks, and preserve whole
  inline formulas for MathJax. Keep excerpt HTML bounded in generated summaries;
  never load full articles or the search index for list previews. Category
  directory entries show neither descriptions nor excerpts. Supplied descriptions
  remain available for metadata, search, Markdown exports, and feeds; these must also
  support posts without descriptions. `updated` must be a real `YYYY-MM-DD`
  date on or after publication and should mark a substantive content change.
  It drives the visible update date, Markdown metadata, article `dateModified`,
  sitemap `lastmod`, and feeds. Leave unknown historical update dates unset;
  do not infer them from migration commits or filesystem/build timestamps.

- Post-local image/assets live alongside `index.mdx` under
  `content/posts/<slug>/` and are referenced from Markdown with relative image
  paths. The generator rewrites those paths to `/posts/<slug>/...`, and Angular
  copies publishable assets into `/posts`. MDX, BibTeX, TSX, article `styles.css`,
  and build/client TypeScript under `scripts/` are excluded from asset copying.

- When renaming a post slug, update absolute `/posts/<slug>/...` references in
  post-local components and shared styles; unlike Markdown image paths, code
  and CSS URLs are not rewritten automatically.
  Prerender legacy Angular redirect routes as well, so static hosting can serve
  their immediate redirect pages on direct visits.

- Posts are compiled as standard MDX with GFM and math support. Prefer native
  MDX syntax and semantic HTML elements such as `<details>` for authored
  interactive content; imported build-time components are also supported.
  The generator wraps disclosure bodies in `.details-content`; apply disclosure
  spacing there, not to arbitrary children whose code/table padding and borders
  must remain intact. Keep each native `summary` a direct child of its `details`
  and scope open-state styles to that summary so nested disclosures stay independent.

- For mathematical pseudocode, use post-local semantic HTML with the existing
  MathJax renderer so formulas match the prose. Keep the complete algorithm
  visible, use native `<details>` for supplementary notes, and verify that the
  generated Markdown preserves every step and formula. TeX in TSX string
  literals should use `String.raw` or escaped backslashes; code blocks are not
  MathJax containers.

- Embed Lichess games with native MDX iframes using a descriptive `title`,
  `loading="lazy"`, `width="100%"`, and an explicit height. The `/black` URL
  suffix sets the viewpoint; the hash selects the initial ply (for example,
  `#101` shows the position after White's 51st move). Keep a direct game link.
  Persistent authored arrows and variations require a Study chapter embed.
  `bg=system` follows the reader's OS theme, independently of the site toggle.

- When adding or touching image assets, manually convert any non-AVIF images to
  AVIF and reference the converted files instead.
  Inspect GIF/WebP frame counts before converting: animations must become AVIF
  sequences with all composited frames, original dimensions, per-frame durations,
  and loop counts preserved. Verify decoded metadata and playback on the served
  page; a successful conversion can still silently retain only the first frame.
  Original Hexo sources and assets are in `../blog-src/source/_posts`.
  Compare original GIFs with derived WebP files before choosing animation
  sources: legacy WebP conversions can omit frames or change pause durations.
  Prefer the complete original animation when the versions differ.
  `image-size` omits the animated `avis` brand from its detector; our dimension
  helper routes it through the exported HEIF parser so image hydration still
  receives width and height.

- Rich-text fields in `content/cv.yaml` support inline Markdown while retaining
  compatibility with authored HTML. This applies to abstract paragraphs, entry
  details and items, subsection items, and section content; structural fields
  such as titles, dates, locations, and header data remain plain text.

- All color choices should follow the muted Morandi theme and use the semantic
  color variables from `src/styles/morandi.css`.

- Disable animations when capturing theme changes so SVG strokes and animated
  page backgrounds are captured in the same theme state.

- MDX-generated post images are emitted as plain HTML first, then hydrated
  by the post page into `app-image-lightbox` instances. Keep generated image
  HTML dimensioned with `width`/`height` whenever possible so `NgOptimizedImage`
  can run correctly after hydration.

- Author ordinary post images with Markdown `![alt](./images/file.avif)`.
  The generator reads local image dimensions through `image-size` and preserves
  SVG viewBox handling; it does not require a system ImageMagick installation.

- Embed PDFs with a titled, lazy iframe and a direct download link. The generator
  supplies a separate reader for each iframe. See the
  [PDF contract](../docs/architecture.md#embedded-pdf-readers) before changing it.
- Keep guidance outside `content/posts` category directories: discovery expects
  directories there, and ordinary files under article roots can be published.

## Citations

- A post can keep BibTeX references in a sibling `references.bib` file and cite
  them with Pandoc-style keys such as `[@key]`. Citations use the APA CSL
  style. When a bibliography is rendered, the generator appends it with a
  level-two `References` heading; do not add a manual heading or `[^ref]`
  marker to the MDX source.

- Citation keys resolve only against the current post's `references.bib`;
  entries in another post's bibliography are not shared automatically.

- Prefer the latest publicly available offering of a course when consulting
  lecture notes. Check the official course site and schedule first, then read
  the relevant lecture to verify that it supports the cited claim. Update the
  citation key, year, term, lecturer, and URL together when changing editions.
  Use an older offering when the relevant newer material is unavailable or
  omits needed content, and identify the edition accurately. Continue citing
  original papers for attribution of methods and results.
  When summarizing a method's evolution, also check the authors' current papers
  and official implementation for later versions; recent lecture notes alone
  do not establish a complete release history.

- Use citations selectively and place them at the point of attribution: next to
  the named paper, lecture, method, or specific claim they support, including
  within a sentence. Cite distinct named sources separately instead of bundling
  them at the paragraph's end. Group citations only when they support the same
  claim; use a paragraph-end citation only when its scope is clear. Avoid
  mechanically citing every paragraph or repeating the same source throughout
  one explanation. Keep specific results, quotations, empirical claims, and
  adapted figures attributable.

- Citation workflow:
  1. Create or update `content/posts/<slug>/references.bib`. Use readable,
     stable keys such as `kingma2014autoencoding`; write authors as
     `Family, Given and Family, Given`; and include `title`, `year`, and `url`.
     Prefer adding `doi`, publication venue, volume, and pages when available.
     Prefer a dedicated landing-page URL when it clearly identifies the cited
     work. If none exists, use the direct document URL rather than a generic
     index or syllabus page. Do not add abstracts; citation previews
     intentionally show bibliographic metadata only.
     Undated documentation uses `year = {n.d.}`; do not infer a publication
     year from the current year or a copyright footer.
  2. Cite an entry in `index.mdx` with `[@key]`. Multiple references can be
     written as `[@key1; @key2]`. The References section is generated at the
     end of the post automatically.
  3. Run `pnpm format:bib` after editing BibTeX, then `pnpm generate:data` to
     regenerate the post HTML. The generator applies APA style and copies CSL
     metadata onto each `.csl-entry` as `data-title`, `data-authors`,
     `data-year`, `data-url`, and `data-doi` when present. Citation previews
     consume these attributes; do not author `data-*` attributes manually in
     MDX.
  4. Run `pnpm check` and `pnpm test` before committing. `pnpm lint:bib` checks
     formatting, duplicate citation keys, duplicate DOIs, and parser warnings.

- Keep renderer coverage for APA-collapsed citations that share an author but
  use different years; every displayed year must retain its own bibliography
  link.

## Post diagrams

- Prefer post-local build-time components for authored technical diagrams.
  Put them in `content/posts/<slug>/scripts/*.post-component.tsx`, export them
  through a `POST_COMPONENTS` object, and invoke them directly from MDX.
- Render structural diagrams as accessible inline SVG inside a `<figure>`.
  Provide a meaningful `<title>`, `<desc>`, and `<figcaption>`, use a
  responsive `viewBox`, and place the figure in an overflow container for
  narrow screens.
- Pass one string to a React-rendered SVG `<title>` (use a template string for
  dynamic labels); mixed JSX children produce React warnings and empty titles.
- Keep diagram colors in prefixed classes in the article's `styles.css` and use
  only semantic variables from `src/styles/morandi.css`; verify both themes.
  Distinguish edge roles with line patterns or weight as well as color, since
  muted hues can look alike at small sizes.
  The generator includes this file only with its article. Do not register article
  styles in `PostComponent.styleUrls`; served-route resource budgets cover the
  actual payload, including inline styles.
- Keep one source of truth for a diagram's data. Derive related masks, cells,
  edges, and labels from the same arrays and predicates instead of duplicating
  hard-coded values that can drift apart.
  For iterative numerical methods, distinguish ideal targets from finite-step
  approximations; derive plotted values and accessible transcripts from the
  same recurrence, and state the precision used by the example.
  Memory diagrams should state tensor precisions and included allocations;
  distinguish stored model states from peak memory used by temporary buffers.
  Distributed training flows should distinguish per-layer/bucket collectives
  from total per-step communication and show temporary states being released.
- Match diagram symbols, head indices, and matrix/vector conventions to the
  surrounding post; adapt reference figures to the author's notation.
  Typeset mathematical diagram labels with the same TeX/MathJax notation as
  the prose, including subscripts, transposes, fractions, and tensor shapes;
  do not substitute Unicode approximations or code-like expressions for them.
- When redrawing legacy graphs, validate nodes and capacities against the
  article sample and code; numbered image files can represent different drafts.
  Route fan-in edges to distinct node ports and place labels clear of curves;
  opaque label backgrounds can hide unintended breaks in a path.
- Rooted layouts do not make tree edges directed. Preserve undirected sample
  edges without arrowheads unless the diagram explicitly depicts a traversal.
- For coordinate geometry, use the same scale on both axes and calculate
  intersections from the equations. Simple Latin point labels can use italic
  SVG text; reserve MathJax containers for actual TeX.
- For TeX inside inline SVG, use a sized `<foreignObject>` containing HTML
  with MathJax delimiters such as `\(...\)`. The site uses MathJax CHTML, so
  do not expect TeX inside an SVG `<text>` element to typeset reliably. Give
  each foreign object explicit bounds and remove default `mjx-container`
  margins. WebKit can misplace this HTML when a responsive SVG is scaled; for
  narrow overflow layouts, keep the rendered SVG dimensions at 1:1 with its
  `viewBox` and verify on an actual WebKit device.
- After changing a diagram, run `pnpm generate:data`, `pnpm check`, and
  `pnpm test`, then inspect the actual served page at desktop and narrow
  widths. Check label collisions, arrowheads, legends, theme contrast, and
  whether the visual encoding agrees with the underlying equations.

## Interactive examples

- Interactive MDX examples render semantic initial HTML in post-local components
  and attach lazy browser controllers through `PostContentDirective`. Share numeric
  models between build-time markup and playback, preserve explanations in Markdown,
  and clean up timers, observers, and events on navigation. Keep playback opt-in,
  pause when hidden/offscreen, and respect reduced motion. Async examples expose
  their own readiness attribute; `data-rendered` does not await their lazy imports.
  Mark transient playback UI with `data-agent-omit` and provide a static explanation
  or numeric transcript outside it for Markdown exports and noninteractive reading.
  Give each animation a teaching focus that complements the surrounding prose.
  For tiling, keep the full sequence, current block, and accumulated coverage visible
  together; avoid repeating an already-explained scalar merge derivation.

Controllers live in `scripts/*.post-client.ts` and export
`enhancePost(container): () => void`. The generator discovers them automatically;
keep article styles in `styles.css`. See
[the lifecycle contract](../docs/architecture.md#article-payload-and-lifecycle).
