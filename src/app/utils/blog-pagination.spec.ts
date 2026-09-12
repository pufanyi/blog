import { describe, expect, it } from 'vitest';
import { blogPageCount, blogPagePath, paginatePosts, paginationItems } from './blog-pagination';

const posts = Array.from({ length: 23 }, (_, index) => ({
  slug: `post-${index}`,
  title: `Post ${index}`,
  date: '2026-09-06',
  description: 'A test post',
}));

describe('blog pagination', () => {
  it('partitions every post exactly once for different configured page sizes', () => {
    for (const size of [1, 4, 10, 23, 100]) {
      const pages = Array.from(
        { length: blogPageCount(posts.length, size) },
        (_, index) => paginatePosts(posts, String(index + 1), size)!,
      );
      expect(pages.flatMap((page) => page.posts)).toEqual(posts);
      expect(pages.every((page) => page.posts.length <= size)).toBe(true);
      expect(pages.at(-1)?.end).toBe(23);
    }
    expect(paginatePosts(posts, '2', 10)).toMatchObject({
      number: 2,
      totalPages: 3,
      start: 11,
      end: 20,
    });
    expect(paginatePosts(posts, '3', 10)?.posts).toHaveLength(3);
  });

  it('uses /blog for the first page and handles an empty archive', () => {
    expect(blogPagePath(1)).toBe('/blog');
    expect(blogPagePath(2)).toBe('/blog/page/2');
    expect(paginatePosts([], null, 10)).toEqual({
      number: 1,
      totalPages: 1,
      totalPosts: 0,
      start: 0,
      end: 0,
      posts: [],
    });
    expect(paginatePosts([], '2', 10)).toBeNull();
  });

  it('rejects malformed and out-of-range page numbers', () => {
    for (const page of [
      '',
      '0',
      '-1',
      '1.5',
      '02',
      '+2',
      '2abc',
      '1e2',
      '999',
      '9007199254740993',
    ]) {
      expect(paginatePosts(posts, page, 10), page).toBeNull();
    }
    expect(() => blogPageCount(23, 0)).toThrow();
  });

  it('keeps the current page and both ends visible in a bounded page list', () => {
    expect(paginationItems(2, 3)).toEqual([1, 2, 3]);
    expect(paginationItems(50, 100)).toEqual([1, 'ellipsis', 49, 50, 51, 'ellipsis', 100]);
    for (let current = 1; current <= 100; current++) {
      const items = paginationItems(current, 100);
      expect(items).toContain(current);
      expect(items[0]).toBe(1);
      expect(items.at(-1)).toBe(100);
      expect(items.length).toBeLessThanOrEqual(7);
      const numbers = items.filter((item): item is number => typeof item === 'number');
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });
});
