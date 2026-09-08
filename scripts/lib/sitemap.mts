import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { isCalendarDate } from './front-matter.mts';
import { escapeXml } from './xml.mts';

export function prepareSitemap(browserDirectory: string, siteUrl: string): number {
  const manifest = JSON.parse(
    readFileSync(join(browserDirectory, '..', 'prerendered-routes.json'), 'utf8'),
  ) as { routes: Record<string, unknown> };
  const origin = new URL(siteUrl).origin;
  const urls = new Map<string, string | undefined>();

  for (const route of Object.keys(manifest.routes)) {
    const html = readFileSync(join(browserDirectory, route, 'index.html'), 'utf8');
    const dom = new JSDOM(html);
    try {
      const head = dom.window.document.head;
      const noindex = Array.from(
        head.querySelectorAll('meta[name="robots" i], meta[name="googlebot" i]'),
      ).some((meta) =>
        (meta.getAttribute('content') ?? '')
          .toLowerCase()
          .split(/[\s,]+/)
          .some((directive) => directive === 'noindex' || directive === 'none'),
      );
      if (noindex || head.querySelector('meta[http-equiv="refresh" i]')) continue;

      const canonical = head.querySelector('link[rel~="canonical" i]')?.getAttribute('href');
      if (!canonical) throw new Error(`Missing canonical URL for prerendered route: ${route}`);
      const url = new URL(canonical);
      if (url.origin !== origin || url.search || url.hash) {
        throw new Error(`Invalid sitemap canonical for ${route}: ${canonical}`);
      }
      const updated = head
        .querySelector('meta[property="article:modified_time"]')
        ?.getAttribute('content');
      if (updated !== null && updated !== undefined && !isCalendarDate(updated)) {
        throw new Error(`Invalid authored modification date for ${route}: ${updated}`);
      }
      const previous = urls.get(url.href);
      if (previous && updated && previous !== updated) {
        throw new Error(`Conflicting modification dates for ${canonical}`);
      }
      urls.set(url.href, updated ?? previous);
    } finally {
      dom.window.close();
    }
  }

  const entries = [...urls]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([url, updated]) =>
        `  <url><loc>${escapeXml(url)}</loc>${updated ? `<lastmod>${updated}</lastmod>` : ''}</url>`,
    );
  writeFileSync(
    join(browserDirectory, 'sitemap.xml'),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      '</urlset>',
      '',
    ].join('\n'),
    'utf8',
  );
  writeFileSync(
    join(browserDirectory, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', siteUrl).href}\n`,
    'utf8',
  );
  return urls.size;
}
