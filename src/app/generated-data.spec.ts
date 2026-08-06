import { describe, expect, it } from 'vitest';
import { CV_DATA } from './data/cv';
import { POSTS } from './data/posts';
import { REDIRECTS } from './data/redirects';
import type { PostTocItem } from './models/post.model';

function flattenIds(items: readonly PostTocItem[]): string[] {
  return items.flatMap(item => [item.id, ...flattenIds(item.children)]);
}

describe('generated content data', () => {
  it('loads generated data modules', () => {
    expect(POSTS.length).toBeGreaterThan(0);
    expect(Array.isArray(REDIRECTS)).toBe(true);
    expect(CV_DATA).toBeTruthy();
  });

  it('keeps generated table-of-contents data aligned with article headings', () => {
    for (const post of POSTS) {
      const document = new DOMParser().parseFromString(post.contentHtml, 'text/html');
      const headingIds = Array.from(document.querySelectorAll('h2, h3')).map(
        heading => heading.id,
      );
      const tocIds = flattenIds(post.toc);

      expect(tocIds, post.slug).toEqual(headingIds);
      expect(new Set(tocIds).size, post.slug).toBe(tocIds.length);

      for (const heading of Array.from(document.querySelectorAll('h2, h3'))) {
        expect(heading.getAttribute('tabindex'), post.slug).toBe('-1');
        const permalink = heading.querySelector<HTMLAnchorElement>('.heading-permalink');
        expect(permalink, post.slug).not.toBeNull();
        expect(permalink?.getAttribute('href'), post.slug).toBe(
          `/blog/${encodeURIComponent(post.slug)}#${encodeURIComponent(heading.id)}`,
        );
      }
    }
  });
});
