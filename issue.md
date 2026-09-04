<!--
Suggested title:
`linkCitations` creates empty and misplaced anchors for APA-collapsed citations with different coauthors
-->

## Description

When `linkCitations: true` is used with the APA style, a grouped citation can
produce empty or misplaced links if citeproc renders different full author lists
with the same abbreviated author label.

For example, two works whose author lists both render as `Doe et al.` are
correctly formatted as `(Doe et al., 2025, 2026)`. Enabling citation links,
however, links the closing parenthesis to one bibliography entry and emits an
empty link for the other entry.

## Minimal reproduction

`references.bib`:

```bibtex
@article{collapsed2025,
  title = {First Collapsed Reference},
  author = {Doe, Jane and Roe, Richard and Poe, Patricia},
  journal = {Journal of Examples},
  year = {2025}
}

@article{collapsed2026,
  title = {Second Collapsed Reference},
  author = {Doe, Jane and Public, John and Bloggs, Jane and Example, Eve},
  journal = {Journal of Examples},
  year = {2026}
}
```

`reproduce.mjs`:

```js
import { evaluate } from '@mdx-js/mdx'
import { renderToStaticMarkup } from 'react-dom/server'
import rehypeCitation from 'rehype-citation'
import * as runtime from 'react/jsx-runtime'

for (const linkCitations of [false, true]) {
  const { default: Content } = await evaluate(
    'Same displayed author [@collapsed2025; @collapsed2026].',
    {
      ...runtime,
      rehypePlugins: [
        [
          rehypeCitation,
          {
            bibliography: 'references.bib',
            path: process.cwd(),
            csl: 'apa',
            linkCitations,
            suppressBibliography: true,
          },
        ],
      ],
    },
  )

  console.log(
    `${linkCitations}: ${renderToStaticMarkup(runtime.jsx(Content, {}))}`,
  )
}
```

## Actual behavior

With `linkCitations: false`, the citation text is correct:

```html
<span id="citation--collapsed2025--collapsed2026--1">
  (Doe et al., 2025, 2026)
</span>
```

With `linkCitations: true`, the generated links are corrupted:

```html
<span id="citation--collapsed2025--collapsed2026--1">
  (Doe et al., 2025, 2026<a href="#bib-collapsed2026">)</a><a href="#bib-collapsed2025"></a>
</span>
```

## Expected behavior

Each displayed citation should link to its corresponding bibliography entry,
and punctuation should remain outside the links. For example:

```html
<span id="citation--collapsed2025--collapsed2026--1">
  (<a href="#bib-collapsed2025">Doe et al., 2025</a>, <a href="#bib-collapsed2026">2026</a>)
</span>
```

## Possible cause

The author-date linking code first searches the rendered citation for
`item.ambig`. It falls back to matching only the year when `isSameAuthor`
reports that adjacent registry items have identical complete author lists.

In this case, citeproc abbreviates both author lists to the same visible
`Doe et al.` label, but `isSameAuthor` returns `false` because the complete
coauthor lists differ. The rendered string therefore does not contain the
expected uncollapsed `item.ambig` value. `str.indexOf(citeMatch)` returns `-1`,
and passing that value to `split` causes the final character to be wrapped in
an anchor.

It may also be unsafe to assume that registry order always matches the order of
the visible, collapsed citation. At minimum, guarding against `startPos === -1`
would prevent invalid markup; correctly associating each link may require
matching the rendered citation tokens independently of complete-author-list
equality.

Relevant code:

- [`src/gen-citation.js`](https://github.com/timlrx/rehype-citation/blob/main/src/gen-citation.js)
- [`src/utils.js`](https://github.com/timlrx/rehype-citation/blob/main/src/utils.js)

## Environment

- `rehype-citation`: 2.3.2
- `@mdx-js/mdx`: 3.1.1
- React / React DOM: 19.2.8
- Node.js: 24.18.1
- OS: Linux (WSL2), x86_64

