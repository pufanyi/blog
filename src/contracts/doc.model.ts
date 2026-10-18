import type { PostContent } from './post.model';

export interface DocSummary {
  slug: string;
  title: string;
  description: string;
  group: string;
  sourceUrl: string;
}

export interface DocPage extends DocSummary, PostContent {}

export function docPath(slug: string): string {
  return slug ? `/docs/${slug}` : '/docs';
}

export function docMarkdownPath(slug: string): string {
  return slug ? `/docs/${slug}.md` : '/docs/index.md';
}
