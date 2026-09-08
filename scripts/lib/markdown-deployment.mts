import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import type { MarkdownRoutes } from './markdown-negotiation.mts';

export function prepareMarkdownWorker(browserDirectory: string, siteUrl: string): number {
  const manifest = JSON.parse(
    readFileSync(join(browserDirectory, '..', 'prerendered-routes.json'), 'utf8'),
  ) as { routes: Record<string, unknown> };
  const routes: Record<string, string> = {};
  const origin = new URL(siteUrl).origin;
  for (const route of Object.keys(manifest.routes).sort()) {
    const dom = new JSDOM(readFileSync(join(browserDirectory, route, 'index.html'), 'utf8'));
    try {
      const head = dom.window.document.head;
      const href = head
        .querySelector('link[rel~="alternate" i][type="text/markdown" i]')
        ?.getAttribute('href');
      if (!href) continue;
      const url = new URL(href, siteUrl);
      if (
        url.origin !== origin ||
        url.search ||
        url.hash ||
        !/^\/(?:[a-z\d_-]+\/)*[a-z\d_-]+\.md$/i.test(url.pathname)
      ) {
        throw new Error(`Invalid Markdown alternate for ${route}: ${href}`);
      }
      if (!statSync(join(browserDirectory, url.pathname)).isFile()) {
        throw new Error(`Missing Markdown alternate for ${route}: ${href}`);
      }
      routes[route === '/' ? '/' : route.replace(/\/$/, '')] = url.href;
    } finally {
      dom.window.close();
    }
  }

  // Derive routing from the same discovery links agents see, outside public assets.
  const outputDirectory = dirname(browserDirectory);
  const serialized = JSON.stringify(routes satisfies MarkdownRoutes, null, 2);
  writeFileSync(join(outputDirectory, 'markdown-routes.json'), `${serialized}\n`, 'utf8');
  const implementation = relative(
    outputDirectory,
    fileURLToPath(new URL('./markdown-negotiation.mts', import.meta.url)),
  )
    .split(sep)
    .join('/');
  writeFileSync(
    join(outputDirectory, 'worker.mjs'),
    `// Generated from prerendered Markdown discovery links.\n` +
      `import { createMarkdownWorker } from ${JSON.stringify(`./${implementation}`)};\n` +
      `export default createMarkdownWorker(${serialized});\n`,
    'utf8',
  );
  return Object.keys(routes).length;
}
