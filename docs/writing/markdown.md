# Markdown, code, and math

Articles use MDX with GitHub-flavored Markdown and math support. Ordinary Markdown is the default; native HTML and build-time React components support explanations that need richer structure.

## Headings and links

Start article sections at `##`, with `###` for subsections. These levels receive stable IDs, permalinks, and entries in the table of contents. Deeper headings do not receive generated IDs. Avoid changing published headings unnecessarily because incoming fragment links use those IDs.

Use full article paths for cross-post links, for example `/blog/oi-icpc/codeforces/cf551c`. For a section link, use the fragment shown by its generated permalink; the heading slugger normalizes punctuation and case. Duplicate headings receive numbered suffixes. When migrating old anchors, inspect the generated link rather than assuming the previous system used the same algorithm.

Markdown tables and fenced code blocks work normally. Put a language after the opening code fence, such as `typescript`, `python`, or `bash`, for syntax highlighting. Code uses the same semantic Morandi colors in both themes and gains a copy button in the browser.

## GitHub code quotations

Paste a public GitHub file permalink on its own paragraph to embed the selected
code. Use a full 40-character commit SHA and a line selection (`#L8` or `#L8-L12`):

```md
The following definition comes from Git:

https://github.com/git/git/blob/c51408889c3b372814bc20b9431c3b74d0d268eb/blob.h#L8-L12

Continue the explanation here.
```

The generated card shows the repository, file, original line numbers, and short
commit SHA. Its source link opens the selected lines on GitHub; its copy button
copies only code. Syntax colors follow the site's light/dark themes. Language is
inferred from the filename, with plain text for unknown extensions. Header files
ending in `.h` use C; `.hpp` and `.hh` use C++.

Only standalone bare links expand. Inline links, `[View source](url)`, explicitly
labeled links whose label is the URL, and links inside code blocks stay as written.
The Markdown linter permits these standalone quotes; use labeled links for ordinary
inline references. Branch/tag URLs and URLs without line selections remain ordinary links. Use
GitHub's **Copy permalink** action to pin a version; editing the permalink is how
you update a quotation. Markdown files can use `?plain=1` before the line fragment.

Code is fetched during content generation and rendered into static HTML. Markdown
exports retain a fenced code block and the permanent source link. No browser
request to GitHub is needed. The first build needs network access; complete source
files are cached under `.generated/github-code-cache` and reused offline across
articles and line ranges. Keep that directory when you need offline rebuilds.
Fresh CI environments also need network access for new quotes. This feature does
not fetch authenticated/private repositories.

A quote can select up to 500 lines from a UTF-8 text file of at most 2 MiB.
Generation fails with the article path, line in its MDX body, URL, and cause when
a matching quote cannot be fetched or its line range is invalid. Invalid ranges
are never silently truncated. Fix the permalink or use an ordinary labeled link
when you only want to point readers at the source.

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
