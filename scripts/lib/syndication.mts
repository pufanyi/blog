import type { SiteConfig } from '../../src/app/models/config.model';
import type { PostSummary } from '../../src/app/models/post.model';
import { escapeXml } from './xml.mts';

export function buildSyndicationFeeds(
  posts: readonly PostSummary[],
  site: SiteConfig,
): Map<string, string> {
  const activity = (post: PostSummary) => post.updated ?? post.date;
  const sorted = [...posts].sort(
    (a, b) => activity(b).localeCompare(activity(a)) || a.slug.localeCompare(b.slug),
  );
  if (!sorted.length)
    throw new Error('Syndication feeds require at least one dated published article');
  const canonical = (post: PostSummary) => new URL(`/blog/${post.slug}`, site.url).href;
  const isoDate = (date: string) => `${date}T00:00:00Z`;
  const rssDate = (date: string) => new Date(isoDate(date)).toUTCString();
  const latest = activity(sorted[0]);
  const blog = new URL('/blog', site.url).href;
  const rssUrl = new URL('/feed.xml', site.url).href;
  const atomUrl = new URL('/atom.xml', site.url).href;
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
  const rss = [
    declaration,
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
    `<title>${escapeXml(site.title)}</title>`,
    `<link>${escapeXml(blog)}</link>`,
    `<description>${escapeXml(site.description)}</description>`,
    `<atom:link href="${escapeXml(rssUrl)}" rel="self" type="application/rss+xml"/>`,
    `<lastBuildDate>${rssDate(latest)}</lastBuildDate>`,
    ...sorted.map((post) =>
      [
        '<item>',
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(canonical(post))}</link>`,
        `<guid isPermaLink="true">${escapeXml(canonical(post))}</guid>`,
        `<description>${escapeXml(post.description ?? '')}</description>`,
        `<pubDate>${rssDate(post.date)}</pubDate>`,
        `<atom:updated>${isoDate(activity(post))}</atom:updated>`,
        `<atom:link href="${escapeXml(`${canonical(post)}.md`)}" rel="alternate" type="text/markdown"/>`,
        '</item>',
      ].join('\n'),
    ),
    '</channel></rss>',
    '',
  ].join('\n');
  const atom = [
    declaration,
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `<id>${escapeXml(blog)}</id>`,
    `<title>${escapeXml(site.title)}</title>`,
    `<subtitle>${escapeXml(site.description)}</subtitle>`,
    `<link href="${escapeXml(atomUrl)}" rel="self" type="application/atom+xml"/>`,
    `<link href="${escapeXml(blog)}" rel="alternate" type="text/html"/>`,
    `<updated>${isoDate(latest)}</updated>`,
    `<author><name>${escapeXml(site.author.name)}</name><uri>${escapeXml(new URL('/', site.url).href)}</uri></author>`,
    ...sorted.map((post) =>
      [
        '<entry>',
        `<id>${escapeXml(canonical(post))}</id>`,
        `<title>${escapeXml(post.title)}</title>`,
        `<link href="${escapeXml(canonical(post))}" rel="alternate" type="text/html"/>`,
        `<link href="${escapeXml(`${canonical(post)}.md`)}" rel="alternate" type="text/markdown"/>`,
        `<published>${isoDate(post.date)}</published>`,
        `<updated>${isoDate(activity(post))}</updated>`,
        `<summary>${escapeXml(post.description ?? '')}</summary>`,
        '</entry>',
      ].join('\n'),
    ),
    '</feed>',
    '',
  ].join('\n');
  return new Map([
    ['feed.xml', rss],
    ['atom.xml', atom],
  ]);
}
