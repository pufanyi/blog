# Content migrations

Also follow [content working agreements](../content/AGENTS.md), including image
conversion, citation handling, and preserving author-owned prose.

- When migrating legacy posts, add spaces between Chinese text and Latin
  words, numbers, or inline math without changing the formulas or prose.
  Keep original code blocks verbatim; typography cleanup applies to prose only.

- For legacy Jekyll imports, replace Liquid includes with Markdown or native
  MDX and remove theme-only front matter. Keep original exports and ZIP archives
  outside `content/posts`; files not excluded by the asset rules are published.

- For Typst imports, translate math into standard TeX, preserve display equations
  and heading relationships, and resolve `@key` citations through a post-local
  `references.bib`. Keep the original `.typ` outside `content/posts`, since the
  asset copy rules would otherwise publish it.
  When inserting MDX with JavaScript `replace`, use a replacement callback:
  replacement strings turn `$$` display-math fences into single dollar signs.

- For Hexo imports, remove `<!--more-->` and replace plugin tags with equivalent
  embeds, such as a PDF iframe with a direct link. Apart from the prose spacing
  above, preserve original prose, math placement, links, and code; further
  editorial changes require a separate request.
  Resolve relative images in the asset folder named after the source post;
  prefer original PNGs over derived WebP files when converting to AVIF.
  Download links (PDF, ZIP, source code, and text) use `/posts/<slug>/<file>`;
  only image paths are rewritten automatically. Copy only referenced downloads
  and preserve their bytes. Update migrated cross-post links to `/blog/<slug>` and
  regenerate heading fragments with `slugifyHeading`; legacy Hexo anchors
  can differ in case and punctuation. Only level-two and level-three headings
  receive generated IDs; add an explicit ID when preserving links to deeper
  headings.
