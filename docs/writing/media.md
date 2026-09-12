# Images, diagrams, and embeds

Keep an article's media beside its prose. Prefer responsive, accessible figures whose explanation remains useful in static HTML and Markdown exports.

## Images and downloads

Use Markdown for ordinary images:

```mdx
![A description of what the figure demonstrates](./images/example.avif)
```

The generator rewrites the URL to `/posts/<slug>/images/example.avif`, reads dimensions, and emits initial HTML. Browser enhancement supplies the image lightbox. Give alt text the figure's meaning rather than its filename.

Convert newly added or changed raster images to AVIF. Check whether a GIF or WebP is animated before conversion: preserve all composited frames, dimensions, frame durations, and loops. Verify decoded metadata and served playback; a successful converter exit does not prove the animation survived. Keep conversion originals outside `content/posts` unless they are intentional public downloads.

Download links use explicit `/posts/<slug>/<file>` URLs. Only Markdown image paths are rewritten automatically. Include just the files the article uses. Build-time `.mts`, `.ts`, and `.tsx` helpers are excluded from article asset publication; other non-excluded attachments are public, including attachments under draft articles.

## Static technical diagrams

Place build-time components under the article's `scripts/` directory with a `.post-component.tsx` suffix. Export a `POST_COMPONENTS` object, then invoke its component name from MDX:

```tsx
export function FlowFigure() {
  return (
    <figure>
      <svg role="img" aria-labelledby="flow-title flow-desc" viewBox="0 0 400 100">
        <title id="flow-title">A two-stage flow</title>
        <desc id="flow-desc">An input is transformed into an output.</desc>
        <text x="20" y="55">Input → Output</text>
      </svg>
      <figcaption>Each stage transforms the previous result.</figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { FlowFigure };
```

```mdx
<FlowFigure />
```

Use unique accessible IDs when a component appears more than once. Give SVG titles one string child, and put large diagrams in a local overflow container. Derive related cells, arrows, labels, and accessible transcripts from one data model. Match notation to the surrounding prose and verify shapes, scales, and equations.

## Styling and mathematical labels

An article's `styles.css` is discovered automatically. Prefix selectors with a unique article or figure class and use semantic variables from [`morandi.css`](../../src/styles/morandi.css). Distinguish different edge roles through line patterns or weights as well as colors.

Do not add article-specific styles to the shared post component. Small fragments inside SVG should use local fragment references. CSS and TSX asset URLs are not automatically rewritten when an article's slug changes.

Use TeX delimiters inside a sized HTML `foreignObject` for mathematical SVG labels; the site's MathJax CHTML renderer does not typeset SVG `text`. In TSX, use `String.raw` or escaped backslashes. Give labels explicit bounds and check actual WebKit rendering at narrow widths. The [content working agreements](../../content/AGENTS.md#post-diagrams) contain detailed diagram conventions.

## Interactive examples

Put browser controllers in `scripts/*.post-client.ts` and export `enhancePost(container)`. The enhancement receives the current article element and returns cleanup. Query within that container, attach listeners only to your own controls, and release timers, observers, events, and asynchronous work on navigation.

Render useful initial HTML in the build-time component. Keep playback opt-in, pause it when hidden or offscreen, and respect reduced motion. Mark transient controls with `data-agent-omit`, with a static explanation or transcript outside the omitted region. Follow the [architecture contracts](../architecture.md) when implementing controllers and readiness signals.

## PDFs and external embeds

Use an iframe with a descriptive `title`, explicit height, `width="100%"`, and `loading="lazy"`; always include a direct source link. Local PDF iframes under `/posts/` or `/assets/` are rewritten to the site's PDF viewer. Keep each embedded reader in its own iframe because the viewer library uses global IDs.

For Lichess, the `/black` suffix chooses viewpoint and the fragment selects the initial ply. Use a Study chapter when authored arrows and variations must persist. The embed's `bg=system` follows the OS, independently of the site's theme toggle.

After changing diagrams or embeds, inspect the served article in both themes and at desktop and narrow widths. Check labels, scrolling, legends, actual PDF canvases, and the Markdown alternative, then run the relevant checks from [testing](../testing.md).
