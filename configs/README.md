# Site configuration

Common site settings live here. Posts live in `content/posts/`, and CV content
lives in `content/cv.yaml`.

| File | Settings |
| --- | --- |
| [blog.yaml](./blog.yaml) | Posts per page, blog description, visibility of list excerpts/covers/dates, article BibTeX cards |
| [site.yaml](./site.yaml) | Site URL and title, default description and sharing image, metadata author, citation author and key prefix, footer |
| [comments.yaml](./comments.yaml) | Comments toggle, Giscus repository and category, language, reactions, input position |
| [redirects.yaml](./redirects.yaml) | Redirect destinations and titles for old paths (previously `content/redirects.yaml`) |

## Change the page size

Edit `blog.yaml`:

```yaml
postsPerPage: 10
```

The value must be a positive integer. Posts are sorted by publication date,
newest first. The first page is `/blog`, followed by `/blog/page/2`,
`/blog/page/3`, and so on; `/blog/page/1` redirects to `/blog`.
Each page has its own static HTML, title, and canonical link. Changing the page
size recalculates all pages during the next build. Invalid or out-of-range page
numbers show a 404 page. Search covers all published posts.

`showExcerpts`, `showCoverImages`, and `showDates` control the archive list.
Excerpts are generated from the opening paragraphs and shown in up to three lines.
Post front matter may omit `description`; it is metadata and does not supply the
visible excerpt. Category directory entries show titles and dates without excerpts.
`showCitation` controls the BibTeX card at the end of each article, independently
of references cited within the article.

## Other settings

- `site.url` is the site origin, such as `https://pufanyi.com`, without a path,
  query, or fragment. It is used for canonical URLs, sharing links, article
  citation URLs, and comment theme stylesheet URLs.
- `site.defaultImage` accepts a site-relative path such as `/me.avif` or an
  absolute HTTP(S) URL.
- `site.author.name` is used in page titles and metadata. `citationName` uses
  BibTeX name formatting, such as `Pu, Fanyi`; `citationKeyPrefix` sets the
  citation key prefix, such as `pu`. Edit profile and CV prose in their
  respective content files.
- Set `comments.enabled` to `false` to disable comments and prevent Giscus from
  loading. Keep the other fields in the file.
- In `redirects.yaml`, `from` is a site-relative route and `to` is an absolute
  HTTP(S) destination URL. Use `[]` when there are no redirects.

## Apply changes

These YAML files are read at build time. Field names, value types, and page-size
constraints are validated. Write booleans as unquoted `true` or `false`.
Unknown settings produce an error identifying the file and field.

`pnpm start` and `pnpm watch` regenerate these files automatically on save.
Wait for compilation, then refresh the page. Invalid edits retain the last
successful preview and report the offending field. Use `pnpm generate:data`
for a one-off refresh. Check, test, and build also generate content; run
`pnpm build` again before deploying.
The generated files under `src/app/data/*-config.ts` should not be edited by hand.
