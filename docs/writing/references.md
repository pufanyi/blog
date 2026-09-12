# Citations and bibliographies

Each article owns its references in a sibling `references.bib`. Citations are resolved at build time and rendered in APA style, with bibliography links and browser previews.

## Add a reference

Use a stable, readable citation key and bibliographic metadata for the actual source consulted:

```bibtex
@article{example2026method,
  title = {An Example Method},
  author = {Example, Alice and Sample, Bob},
  year = {2026},
  journal = {Example Journal},
  url = {https://example.com/method}
}
```

This is a formatting example, not a real source. For actual references include a DOI, venue, volume, and pages when available. Prefer a dedicated landing page or the direct document over a generic course index. Do not include abstracts: citation previews show bibliographic metadata only. Use `year = {n.d.}` for undated documentation; a copyright footer is not a publication date.

## Cite it in prose

```mdx
The method was introduced in [@example2026method].

These papers support the same claim [@firstKey; @secondKey].
```

Keys resolve only against this article's bibliography. Copy a needed entry into the current `references.bib`; another article's reference list is not shared automatically. The generator appends a level-two References section. Do not add a manual References heading or a `[^ref]` marker.

Put citations next to the method, paper, lecture, result, or adapted figure they attribute. Cite distinct named sources separately. Avoid mechanically repeating the same citation throughout one explanation; specific empirical claims and quotations still need clear attribution.

## Validate and inspect

```bash
pnpm format:bib
pnpm generate:data
pnpm check
pnpm test --watch=false
```

`format:bib` formats bibliographies across the repository; inspect its diff. The checker rejects duplicate keys, duplicate DOIs, and parser warnings. Preview the article to check that each displayed citation links to its intended entry and that the title, authors, year, and destination are correct. Collapsed same-author citations with different years must retain a link for each year.

## Selecting sources

Use original papers for attribution of methods and results. When consulting a course, verify the latest available offering on the official course site and read the relevant lecture. Update the key, year, term, lecturer, and URL together if changing editions. Use an older offering when it contains required material absent from the newer one, and identify that edition accurately.

Check current papers and official implementations when describing a method's release history; a recent lecture alone does not establish the full history. The [ML editorial principles](../ml-editorial.md) provide additional guidance for that series.
