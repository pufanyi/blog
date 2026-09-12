# Markdown, code, and math

Articles use MDX with GitHub-flavored Markdown and math support. Ordinary Markdown is the default; native HTML and build-time React components support explanations that need richer structure.

## Headings and links

Start article sections at `##`, with `###` for subsections. These levels receive stable IDs, permalinks, and entries in the table of contents. Deeper headings do not receive generated IDs. Avoid changing published headings unnecessarily because incoming fragment links use those IDs.

Use full article paths for cross-post links, for example `/blog/oi-icpc/codeforces/cf551c`. For a section link, use the fragment shown by its generated permalink; the heading slugger normalizes punctuation and case. Duplicate headings receive numbered suffixes. When migrating old anchors, inspect the generated link rather than assuming the previous system used the same algorithm.

Markdown tables and fenced code blocks work normally. Put a language after the opening code fence, such as `typescript`, `python`, or `bash`, for syntax highlighting. Code uses the same semantic Morandi colors in both themes and gains a copy button in the browser.

## Inline and display equations

```mdx
The prediction is $y = wx + b$.

$$
\mathcal{L}(w) = \frac{1}{n} \sum_{i=1}^{n} (y_i - wx_i)^2.
$$
```

Use standard TeX. Legacy shortcuts such as `\N`, `\R`, and `\empty` should become `\mathbb{N}`, `\mathbb{R}`, and `\emptyset`. Match complete commands when replacing macros; replacing a prefix can corrupt commands such as `\Rightarrow`.

MathJax loads only when the page contains formulas. Long display equations scroll within their own region on narrow screens. Inspect actual rendering for undefined commands as well as explicit error nodes. Code blocks display literal text and are not MathJax containers.

## Supplementary explanations

Use native disclosures for derivations or implementation notes that interrupt the main explanation:

```mdx
<details>
<summary>Derivation</summary>

Explain each step and preserve the complete formula.

</details>
```

Keep `summary` a direct child of its `details`. The generator wraps disclosure content in `.details-content` for consistent spacing. A disclosure should have a meaningful label and still make sense when expanded in exported Markdown.

## Components and literal text

MDX evaluates JSX syntax: braces and angle brackets in prose can be interpreted as expressions or tags. Put literal code in inline backticks or a fenced block. Use standard MDX imports for build-time helpers, or the post-local `POST_COMPONENTS` convention described in [media and diagrams](media.md).

Do not add browser event handlers to build-time JSX and expect them to hydrate. A separate lazy controller supplies interaction after the semantic HTML is rendered. Its explanation must remain readable without that controller.

## Troubleshooting content errors

Generation errors identify the source file. Start with the first error: check front matter delimiters and date strings, unmatched JSX tags or braces, missing imports, and unresolved citation keys. Run `pnpm generate:data` for a focused reproduction. A stale page after an error reflects the last successful output; restarting Angular does not fix malformed content.
