# Angular disk cache

Disk caching remains enabled with `@angular/build`, `@angular/cli`, and
`@angular/ssr` 22.2.0. The original repair upgraded these packages from 22.1.3
to 22.1.8. The 22.2.0 dependency refresh also passed strict peer validation.

The original disablement had a reproducible cause on this host. With caching
enabled, both a build following unit tests and a build following
`pnpm exec ng cache clean` failed with:

```text
"contents" must be a string or a Uint8Array [plugin angular-compiler]
```

The installed 22.1.3 SQLite store used JSON serialization. A direct round trip
of `new Uint8Array([65, 66])` returned a plain object. esbuild correctly rejected
that cached transformer result. The optional LMDB native module could not load
on this older host, so Angular selected SQLite. This was not evidence that
article generation or Angular's dependency invalidation was stale.

The 22.1.8 store preserves the typed array. The
[upstream implementation](https://github.com/angular/angular-cli/blob/main/packages/angular/build/src/tools/esbuild/sqlite-cache-store.ts)
explains the serialization requirement. Validation includes checks, unit tests,
a production build followed by a warm production build, and author edits through
the development watcher. Raw validation logs are retained with the task evidence.

When changing Angular/Node versions, repeat that sequence. If a future cache
failure is reproduced, record the failing versions and a minimal reproducer
before disabling caching. Avoid a permanent workaround based only on a single
failed build; deleting `.generated/content-cache` is independent of Angular's
`.angular/cache`.
