# Offscreen world simulation tutorial — 2026-09-24

## Scope and baseline

The user requested careful research and a Chinese blog about how Minecraft,
Terraria, and Don't Starve handle things outside the loaded area. They then
clarified that the broader interest is contemporary large-world techniques,
including useful alternatives. The initially clean checkout was at `24622f6`.
No delegation was used. Publication/push is not part of this new article task.

The article is at `content/posts/cs/notes/offscreen-world-simulation/`. It
separates residency, rendering, simulation, replication, and persistence, then
develops spatial eligibility, global sparse updates, component sleep/catch-up,
and combinations with World Partition, HLOD, Mass, and Factorio's event and
registration optimizations. Three static SVG figures use local TSX and Morandi
tokens. There are no client scripts or application changes.

Read the root/content agreements, editorial principles, authoring/citation
guides, development and architecture guidance. The authoring and runtime
contracts remain unchanged; no handbook update is needed for this content-only
addition.

## Evidence and limits

- Minecraft Java uses Mojang's 1.21.5 and 1.21.9 release notes and NeoForged's
  1.21.5 vanilla porting primer. Avoid obsolete claims that random ticks always
  require a nearby player or that fixed spawn chunks always remain active.
  No numeric ticket level table is extrapolated across versions. Bedrock's
  simulation distance and ticking areas are discussed separately using
  Microsoft Learn.
- Terraria's full sampling loop was inspected in the community-hosted 1.4.4.5
  decompiled snapshot at `codingwatching/terraria-1.4.4.5-source-code`, commit
  `69b5a80eab473dca8a08f491bf7a090d9e7f22dc`. Assembly metadata and Main's version
  string agree on 1.4.4.5. `WorldGen.UpdateWorld` selects surface and underground
  coordinates across world width and sizes sample counts with area/update rate.
  Its wiring, liquid and tile entity entry points are distinct from sampling.
- Cross-checked vanilla context in tModLoader patches and its own RandomUpdate
  API at `666f69962d3bdffde54fc14025f02634965b4e7c`. Its Tilemap replacement is
  explicitly distinguished from vanilla Tile[,]. This is not a verification of
  every mechanic in current vanilla Terraria, and the article says so. A commit
  accepting GOG 1.4.5.8 installations does not establish a 1.4.5 runtime port.
- DST source is Klei's Lua implementation as preserved by the community mirror
  `vietnd69/dst-scripts`, build 747465, commit
  `ccfb486f11a5fca5a3d87decd484869800ca1935`. Read mainfunctions, EntityScript,
  scheduler, update, growable, perishable, and evergreen prefab code. Entity
  sleep disables brains/state graphs and dispatches component callbacks; it
  does not universally cancel tasks. Growable has offscreen and wake/catch-up
  branches; perishable schedules periodic work; evergreen sleep can remove
  burn/propagation components and record burnt state. No claim about exact
  engine sleep radius or complete native-engine memory layout is made.
- A single-player historical contrast uses the 2019-07-28 snapshot at
  `taichunmin/dont-starve-game-scripts`, commit
  `a4e5cb267f7ec0bb6c740d2b1bba391881eeb4d7`. Its gamelogic restores a saved world
  then uses player/world age difference for cave travel catch-up. This does not
  establish current behavior for all DLC. DST sharding and empty-server pause
  use Klei's official server configuration guide instead.
- Unreal capabilities are from Epic's World Partition, HLOD and MassGameplay
  documentation read on the research date. The document site exposes changing
  version selectors; no claim that a particular game or every engine version
  uses all features is made. Mass replication is described as a documented
  capability, not a blanket production-readiness claim.
- Factorio FFF 421 is used only for its specific radar coverage registration,
  overlap counters and update buckets. General event-driven devices are an
  explicitly derived design idea, not an unverified implementation claim about
  every Factorio entity.
- Probability, mill output, prefetch-distance and environment-integral examples
  are original explanatory models with assumptions stated. No source algorithms
  are reproduced verbatim. The suggested gameplay experiments were not run.

The article has 22 bibliography entries with fixed commit links for code. Keep
same-author undated citations separate because the existing citation renderer
has a known grouped-undated-reference limitation. Research downloads stay in
`/tmp/offscreen-research`; browser artifacts stay under ignored `tmp/`.

## Initial draft validation

Node 24.18.1 and pnpm 12.3.4 match the repository. Lifecycle commands ran
sequentially. Formatting touched only the new bibliography and diagram source.

- `pnpm generate:data`: 103 posts and 146 exports; the new article was the only
  rendered post in the initial generation. Subsequent runs used the cache.
- `pnpm check`: passed after the final article, figure and bibliography changes.
  The existing ignored browser-runtime directory produces two broken-symlink
  warnings, and generation reports the existing punycode deprecation.
- `pnpm test --watch=false`: passed after the final changes, with 92 content
  tests and 227 application tests across 31 application test files.
- `pnpm build`: passed, with 172 prerendered routes, 155 sitemap URLs and 154
  Markdown alternatives. No build warnings were reported.
- Markdown export inspection confirmed the version boundaries, equations,
  accessible figure descriptions/captions and resolved references. All 22
  bibliography entries are cited; there are no unresolved or unused keys.
- Focused production-route review passed in Chromium 151.0.7922.34 and WebKit
  26.5 at 1280 and 390 CSS pixels in light and dark themes. Each configuration
  checked 3 figures, 27 SVG labels, 24 citation links and 22 reference targets.
  All 24 headings were traversed and both disclosures opened and closed.
- No page exceptions, failed local resources, broken citation targets, SVG
  label overflow, document-level horizontal overflow, MathJax error nodes or
  visible undefined TeX were found. Narrow figures scroll within their own
  containers. Ordinary reading did not request the browser MathJax engine or
  speech worker.
- Opening and figure screenshots were captured for every configuration,
  including right-scrolled narrow figures. Visually reviewed desktop/mobile
  openings, all three full figures, and narrow WebKit dark-theme legends for
  CJK glyphs, geometry, label collisions, contrast and caption readability.

The focused browser review used the existing ignored WebKit host-library
wrapper and CJK font configuration from `tmp/score-review/`. External services
were stubbed; local production assets and article navigation were exercised.
Logs, browser results and screenshots are in `tmp/world-review/`. This was not
a full site-wide E2E run, a game runtime benchmark, or a gameplay experiment.
No commit, push or deployment was performed.


## Problem-first revision — 2026-09-24

The user asked to make contemporary large-world problems and solutions the
main learning path, with the three original games serving as examples. The
revision was inspected against `e2de541` (after the subsequent article commits
`17d1488` and `e2de541`). Preserve the current Fanyi Pu and GPT-6 Astra byline.
The initial validation above describes the earlier draft only.

The new title is “大世界如何运转：流式加载、分级模拟与状态一致性”. The stable route
is unchanged. A travel-world example connects memory/residency, steady work
and transition budgets; partition dependencies; the read-to-activation pipeline;
prefetch and hysteresis; visual representations; sparse and event-driven work;
frequency reduction and ECS layout; catch-up and simulation model changes;
per-client interest, lockstep and ownership; and persistence/time semantics.
Minecraft, Terraria and Don't Starve now appear in optional case disclosures
beside their respective mechanisms. Five static figures include two new
original diagrams for incremental activation and conserved caravan handoff.

Additional primary sources were read directly:

- Epic's UE 5.6 release article (2025-06-03): asynchronous physics state
  creation/destruction and experimental Fast Geometry Streaming for immutable
  static geometry. This is a dated implementation example, not a claim that
  5.6 is the latest version or that experimental features are universally ready.
- Epic's Nanite, Streaming Virtual Texturing, Large World Coordinates,
  Replication Graph and Actor Network Dormancy documentation: cluster/tile
  residency, feedback costs, precision, persistent replication candidate lists
  and waking before replicated property changes. World Partition and Mass
  documentation were reread for actor dependencies and independent LOD roles.
- Unity Entities 1.4 archetype documentation, marked 1.4.8 when read: packed
  component arrays, archetype grouping and structural move costs. A memory
  chunk is not assumed to be a spatial cell.
- Box2D's Simulation documentation, Sleep Parameters: physical inactivity and
  wake conditions are independent of camera visibility.
- Factorio FFF 364 (2021-01-29): inserter wake registration and deterministic
  merging of parallel wake requests. FFF 76 (2015-03-06) explains deterministic
  lockstep; FFF 147 (2016-07-15) separates subsequent server communication work
  from the earlier pure P2P topology. Neither historical topology is presented
  as an unverified current implementation.

There are 33 bibliography entries. New load, inventory, and transition examples
are explanatory models, not engine benchmarks. Distributed ownership and
snapshot consistency are presented as design constraints rather than claims
about proprietary implementations. No authoring/runtime contract changed, so
no public handbook change is required. No client runtime code was added.

### Revision validation

Node 24.18.1 and pnpm 12.3.4 match the repository. All lifecycle commands ran
sequentially after the article, bibliography and diagram changes:

- `pnpm format:bib` and targeted Biome formatting passed; only the intended
  article bibliography and diagram source changed.
- `pnpm generate:data` passed with 103 posts and 146 exports. The final content
  was regenerated by the check/test/build lifecycle hooks.
- `pnpm check` passed. The same two ignored browser-runtime broken-symlink
  warnings and existing punycode deprecation remain; no new warning was found.
- `pnpm test --watch=false` passed: 92 content tests and 227 application tests
  across 31 application test files.
- `pnpm build` passed: 172 prerendered routes, 155 sitemap URLs and 154 Markdown
  alternatives. The production build reported no compilation warnings.
- All 33 bibliography entries are cited, with no missing or unused keys.
  Markdown export inspection confirmed the preserved byline, equations,
  finite-inventory example, both new figure descriptions and resolved citations.
- Production reading review passed in Chromium 151.0.7922.34 and WebKit 26.5,
  at 1280 and 390 CSS pixels, each in light and dark themes. Each viewport
  checked 5 figures, 54 SVG labels, 34 citation links and 33 reference targets;
  all 32 body headings were traversed and all six disclosures opened/closed.
- No page exceptions, failed local resources, broken citation targets, SVG
  label overflow, document-level horizontal overflow, MathJax errors or visible
  undefined TeX were found. Ordinary reading did not load the browser MathJax
  engine or speech worker. Narrow diagrams scroll within their containers.
- Visually inspected desktop/mobile openings, all five full diagrams, both new
  diagrams in WebKit dark mode, and right-scrolled narrow dark diagrams for
  geometry, label placement, glyphs, contrast and caption readability.

Focused browser review used the existing ignored WebKit library wrapper and
CJK font configuration. External services were stubbed while local production
assets were exercised. Logs, screenshots and machine-readable browser results
are in `tmp/world-review-v2/`. This was not a full site-wide E2E run or a game
runtime experiment. Commit `7b7ba53` appeared in the shared checkout during
validation and contains the reviewed article, bibliography and diagrams; those
files have no remaining working-tree diff. Only this final validation record
remains modified. This agent did not run commit, push or deployment commands.


## Temporary Cloudflare withdrawal — 2026-09-24

The user requested hiding this page using Cloudflare. The clean baseline was
`0ac7e8c`, including the subsequent author additions; none of that prose or the
byline was changed. Set only `draft: true` in the article front matter and use
the documented draft lifecycle to omit the page, public discovery and browser
content from the production build. The article contains only authoring sources
and build-time diagrams, with no separately published attachments to remove.

The current Wrangler OAuth session can deploy the blog Worker but the existing
zone-level Access application API returns HTTP 403. No Access policy was
modified. The implemented behavior is temporary public withdrawal with HTTP
404, rather than a newly created owner-login policy. The user was informed of
this approach before the edit and deployment. Existing publishing, architecture
and deployment guides already cover drafts and hosting; their contracts did not
change and no handbook edit is needed.

Validation and deployment:

- `pnpm check` passed; only the existing ignored broken-symlink warnings and
  punycode deprecation remain.
- `pnpm test --watch=false` passed: 92 content tests and 226 application tests
  across 31 files. The generated-post test count decreases with the draft.
- `pnpm build` passed: 171 prerendered routes, 154 sitemap URLs and 153 Markdown
  alternatives. No published HTML, JS, JSON, Markdown, XML or text file contains
  the hidden slug; the article's HTML directory and Markdown export are absent.
- Local Wrangler on port 8794 passed 14 HTTP checks: the canonical URL, trailing
  slash, `.html`, `/index.html`, `.md`, and negotiated Markdown return HTML 404;
  eight public pages/discovery endpoints remain 200 and omit the article.
- Deployed using `pnpm exec wrangler deploy --strict --keep-vars` with the
  message “Temporarily hide offscreen world simulation article”. Production
  Worker version: `b170f6cf-12af-4fda-a3e8-8e96f92e9582`.
- Live `https://pufanyi.com` passed the same checks plus an unaffected public
  article (15 checks). The existing private simulation-engines article still
  redirects unauthenticated requests to Cloudflare Access.
- Local Wrangler was stopped. Logs and machine-readable checks are in ignored
  `tmp/hide-world/`; no credentials are included in this record.

To restore publication, remove `draft: true`, run the usual checks/build and
redeploy. This task did not push Git changes. The Cloudflare deployment is
already live; the source flag must remain in future repository deployments
until the author wants to restore the article.


## Correction: owner-only access — 2026-09-24

The user clarified that the article must remain readable to the owner after
Cloudflare login. Temporary withdrawal did not fulfill that intent. Against
clean baseline `5a1620e`, replaced `draft: true` with `private: true`, preserving
all article prose and authors. The private build is prepared but has NOT been
deployed: deploying it before Access protects the route would expose the HTML.
The currently deployed version still returns HTTP 404 at the original URL.

The user asked to use the CLI. Checked the pinned Wrangler 4.129.1 CLI directly:
`wrangler access --help` reports `Unknown argument: access`. The available OAuth
scopes do not include Access application/policy management. Refreshed the normal
Wrangler OAuth session with `wrangler whoami` before retrying authenticated
calls, to distinguish token expiry from permissions. Account-level reads of
apps/identity providers return empty lists, while organization access returns
403. A real, narrowly scoped account-level POST to create a self-hosted Access
application for `pufanyi.com/blog/cs/notes/offscreen-world-simulation*` was denied
with HTTP 403, code 1010, `auth.forbidden`. Its requested empty policy list would
have denied access by default while an owner policy was configured; the failed
call created no application. Existing Access rules were not modified.

The official application-create API requires `Access: Apps and Policies Write`:
https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/methods/create/

To finish, provide a suitable scoped API token through the local environment,
or add this path to the existing owner-only Access application in the dashboard.
Then verify the allowed owner identity and coverage of canonical/HTML aliases,
deploy the prepared build, and verify anonymous login redirects plus owner
access. A refreshed Workers-only login is insufficient. Do not publish the
private HTML without the host rule.

Prepared-source validation:

- `pnpm check`, `pnpm test --watch=false`, and `pnpm build` all passed
  sequentially: 92 content tests, 226 application tests across 31 files.
- Build emits 172 prerendered routes, 154 sitemap URLs and 153 Markdown
  alternatives. The article's HTML exists with noindex; the public Markdown,
  feed, sitemap and archive exports omit it. Its body text is absent from
  public JavaScript chunks.
- Local Wrangler and Chromium 151.0.7922.34 verified HTTP 200 for the private
  HTML, successful hydration, five figures, noindex, Markdown 404, no archive
  link and no browser exceptions. The local server was stopped afterward.
- Final live request still returns 404. No deployment, commit or push was made
  in this correction. Logs and the failed API response are under ignored
  `tmp/private-world/`; no credentials are recorded here.

The private-post authoring and runtime contracts are unchanged. The remaining
step depends on Access configuration/credentials from the user, not additional
article code.
