# Long article reading experience

Long articles should be easy to enter, comfortable to read, straightforward to navigate, and practical to resume. This is a design proposal for RL and Diffusion, supported by a production-page walkthrough and a separate runtime investigation. Formula performance is one workstream within that reader journey.

## Status and evidence

The walkthrough used the production build of `1f7b856`, with the real pinned MathJax engine, at 1280, 1600, and 390 CSS pixels. Screenshots and browser geometry checks confirmed the layout findings below. Source inspection covered the current reading components and the RL/Diffusion outline. Concurrent article edits were preserved.

An isolated HTML interaction preview demonstrates the proposed layout, chapter navigation, section filtering, text-size/theme controls, a resume example, and returning from a chapter jump. It reuses rendered RL prose and formulas from that fixed snapshot. It is a design artifact, not application code, a performance comparison, or a completed accessibility implementation.

## Reader journeys and current friction

| Reader's task | Current behavior | Proposed outcome |
| --- | --- | --- |
| Decide where to start | RL opens with resource links and definitions; there is no in-body chapter overview | A brief orientation and discoverable outline let a newcomer begin sequentially and a returning reader choose a topic |
| Read comfortably for a sustained period | Body text is 15px on desktop and 14px on mobile, justified; the measured desktop text column is 795px wide | Trial a slightly larger, narrower, left-aligned reading column, with optional text-size adjustment |
| Understand the current location | Sidebar appears only from 1480px; mobile toolbar says `Reading`; position percentage appears inside the TOC | Current chapter remains available in a compact reading bar; desktop layout accommodates a persistent outline at ordinary laptop widths |
| Find a later chapter | RL has 42 generated H2/H3 links, all expanded in the TOC | Show the chapter structure first, expand the current chapter's subsections, and offer clearly labeled section-title filtering |
| Visit a prerequisite and return | Native anchors and router history restoration exist; search results are article-level | Preserve these behaviors and make the reading location easy to recover after a deliberate detour |
| Continue another day | There is no application-level persistent reading position | Offer a local, explicit continuation action naming the saved chapter |
| Read a diagram or derivation | Disclosures and local overflow already exist; a large GAE figure needs horizontal movement at 390px | Keep the main explanation readable, make overflow discoverable, and offer a larger view when a diagram cannot meaningfully reflow |
| Keep a complete copy | Print action calls `window.print()`; the inspected closed disclosure body remains invisible in print media | Provide an explicit complete-article print path and restore disclosure state afterward |
| Read as articles grow | Whole-article formula processing and expanding DOM can delay interaction | Budget responsiveness for actual reading actions, including first use and work deferred until scrolling |

There is also an immediate navigation defect: at 1280px, the desktop Blog link and the TOC toggle both occupy the rectangle from `(102, 15)` to `(138, 51)`. Browser hit testing selects the TOC toggle at the Blog link's center. Shared layout must allocate their space together.

Existing features worth retaining include heading permalinks, active-section highlighting, native dialog focus behavior, browser history restoration, bibliography previews, theme support, code copying, and image/PDF handling. The proposal extends those capabilities through their existing owners.

## Proposed reading interface

### Orientation and chapter navigation

Place a short article introduction and a labeled, collapsible overview near the title. Derive the complete outline from existing headings. An author can add a few useful starting points in normal MDX when the article serves different learning goals; those links should reuse the actual section anchors.

For RL, candidate starting points are the initial definitions, GAE, PPO, and the diffusion RL chapter. They are suggested reading entry points, not a rewritten chapter order or a claim that all other sections can be skipped. Preserve unfinished sections and the author's existing explanation.

Use a left outline beside the reading column when both fit, starting with a prototype around 1200px. Allocate a shared grid for the sidebar and paper; merely reducing the current 1480px breakpoint would overlap the existing centered paper. On narrower screens, expose a plainly labeled contents control and retain the in-body overview.

The outline initially presents H2 chapters. Expand the current chapter's H3 children and let the reader expand other chapters. A link navigates; its separate disclosure affordance expands the subtree. Manual focus or scrolling within the outline must not be disrupted by automatic tracking. All chapters remain discoverable.

The filter says `Find a section` and searches heading labels. It must not imply full-text search. Preserve browser Find. Later, an in-article search could return section names and snippets, but it should reuse article-local source data rather than scanning the MathJax DOM on every keystroke.

NN/G's [table-of-contents guidance](https://www.nngroup.com/articles/table-of-contents/) supports a clear overview, recognizable in-page links, and location feedback. It also reports discoverability problems with some sticky collapsed controls. Therefore, a mobile control needs a visible label and an in-body introduction; stickiness alone does not make it usable. The exact layout and disclosure behavior above remain proposals for this site.

### A compact reading bar

On mobile, replace the generic `Reading` label with the current chapter/subsection and a labeled contents action. Keep the toolbar to one row. Home/archive navigation remains available, while lower-frequency actions such as printing and text-size adjustment can live in reading options. Keep theme switching easy to reach.

Use ellipsis for long chapter labels while exposing the complete label to assistive technology and in the contents panel. Avoid a second sticky toolbar stacked above the article. A subtle position indicator can accompany the bar, but chapter names carry more useful context than a percentage.

Describe progress as position in the article, not proof of reading or comprehension. Expanding a derivation changes page height, and diagrams are not proportional to reading time. An exact estimated reading duration is not a priority for these mathematical tutorials.

### Typography and large content

Prototype 16px mobile body text and roughly 17px desktop text, with a desktop prose column around 680–740px and line height around 1.75–1.8. Compare these settings against the current site with mixed Chinese, English, inline math, and actual diagrams. These numbers are design hypotheses, not accessibility-standard requirements.

Use left alignment to avoid stretching mixed-language lines. Offer a small text-size control in reading options if the comparison shows it useful. Scope changes to reading content so navigation, diagram coordinate systems, and application typography do not scale unexpectedly. Preserve normal browser zoom.

Wide code, tables, and two-dimensional diagrams keep their own horizontal scrolling regions. Give such regions a visible affordance and keyboard access. Where an SVG is too detailed to read at article width, explore a larger viewing surface with an explicit close/return action. Keep the site's established SVG/MathJax sizing contracts and meaningful figure descriptions.

W3C's [reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) distinguishes ordinary text from content that needs two-dimensional layout. Its [text-spacing guidance](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) requires content to survive user spacing changes. Validate narrow text reflow and user overrides without flattening technical diagrams or hiding content.

## Reading continuity

### Resume with reader control

Save a bounded amount of local reading state after deliberate reading: article identity, stable section ID, and a position within that section. Do not write storage on every scroll frame. An absolute pixel offset alone becomes stale after content, font, width, or disclosure changes.

On a later visit, offer `Continue at [section]` and a dismissal action. An incoming explicit fragment and browser back/forward restoration take precedence. Do not unexpectedly move a visitor who has started reading from the beginning. If a section disappears, fall back to a known parent or offer the article overview.

Keep this feature local to the browser initially. A saved position should not require an account, a remote service, or a manually maintained author field.

### Preserve position during detours and layout changes

Exercise the journey `PPO paragraph → GAE prerequisite → original PPO paragraph`, as well as `RL → Diffusion → Back`. Preserve existing browser history and focus semantics. A visible return-to-reading affordance can be considered for deliberate in-page jumps; it should not become a competing navigation stack.

The reader's visible text should remain stable as formulas, images, disclosures, and fonts settle. Reserve space for predictable media and limit deferred work. Restore a saved anchor only after the relevant content is ready, while honoring the existing user-scroll cancellation rule.

## Content layers and sustained reading

Keep the main mechanism, necessary assumptions, core equations, and a useful example visible in the normal flow. Put optional derivations or implementation refinements in well-labeled disclosures. NN/G's [accordion analysis](https://www.nngroup.com/articles/accordions-complex-content/) describes the interaction cost of hiding content that readers need to consume in sequence; folding every chapter would impose that cost on these tutorials.

For a long RL chapter, a short opening statement can explain the question it resolves and a brief transition can connect its result to the next topic. Add these only through an editorial change, with the author-owned prose and [series principles](../../../docs/ml-editorial.md) respected. Avoid automatically generated summaries, repetitive callouts, or a heading for every reasoning step.

Continue using citation previews for bibliographic checks. A future definition preview should refer back to one authored explanation; it should not introduce a separately maintained glossary that drifts from the article.

For printing, expand supplementary content intentionally, wait for any required rendering, and restore the original state afterward. A complete-export action should include explanations and references that were collapsed during screen reading.

## Performance within the reading design

The [runtime investigation](../audits/2026-09-13-long-article-performance.md) contains measured formula/DOM costs and the limits of simply enabling lazy typesetting. Its technical follow-ups belong within R5 below; they do not replace the broader reading roadmap.

Treat responsiveness, stable location, and complete accessible content as joint acceptance criteria. Deferred formula output, build-time typesetting, cheaper heading tracking, and section-level rendering containment are implementation candidates. They should support the same reader interface. A faster initial page that stutters or jumps during reading is an incomplete improvement.

Retain continuous full-article reading as the initial model. Compare the larger structural alternatives only when they solve a demonstrated reader need:

| Structure | Appropriate trigger | Main cost |
| --- | --- | --- |
| Continuous article with navigable sections | One connected explanation that readers both study and revisit | Needs disciplined rendering and navigation as content grows |
| Separate articles in a series | Topics have independent learning objectives and useful standalone entry points | Requires editorial transitions, link/redirect ownership, and series navigation |
| Optional chapter-focused view | Readers demonstrate a need to work on one chapter at a time | Adds view state and more search, history, export, and accessibility cases |

Do not choose these structures from an arbitrary source-character threshold. Source-file decomposition, public article organization, and browser rendering are separate decisions.

## Ordered task list

R0 is complete. R1–R6 describe proposed production work in order; the preview does not mark those tasks complete.

- [x] R0 — Review the complete reader journey on RL and Diffusion, retain the runtime evidence, inspect real layouts, and produce an interactive interface proposal.
- [ ] R1 — Fix navigation overlap and trial the shared reading layout, text size, line length, and alignment. Verify 1280px desktop and narrow layouts before changing defaults.
- [ ] R2 — Implement the compact chapter-aware bar, grouped outline, opening overview, and section-title filter. Preserve stable links, keyboard focus, and discoverability; derive all navigation from the existing outline.
- [ ] R3 — Add explicit local continuation and verify reading-location preservation across detours, reloads, font/media changes, and article revisions. Reuse existing history and scroll ownership.
- [ ] R4 — Refine long-diagram viewing, complete printing, and the authoring guidance for introductions, transitions, and supplementary details. Apply editorial adjustments to selected sections with a clear scope.
- [ ] R5 — Implement the chosen runtime strategy using the benchmark and technical steps in the linked investigation. Measure startup and active reading, including a growth fixture, while preserving the R1–R4 behaviors.
- [ ] R6 — Validate the full sequence on Chromium and WebKit, both themes, narrow widths, browser zoom, keyboard navigation, and failed/deferred resources. Update owning developer/author guides and run the required check, unit, and relevant browser suites before shipping.

After the initial interface trial, prefer a small number of consistent controls. Additional settings, reading modes, summaries, and overlays need a demonstrated benefit and their own maintenance cost assessment.

## Prototype and verification artifacts

The local `tmp/reading-experience-2026-09-13/reader-preview.html` file is an interactive design preview. It labels its seeded continuation state as an example. Saved positions use a prototype-specific local-storage key. It includes existing rendered article content and demonstrates controls without modifying the application or authored posts.

The same ignored directory retains preview screenshots and baseline reading screenshots/geometry. A browser smoke check exercises section filtering, continuation, a chapter jump, the return control, theme switching, and narrow-page overflow. This is limited prototype validation; it is not the production acceptance suite described in R6.
