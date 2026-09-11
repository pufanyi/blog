import { describe, expect, it } from 'vitest';
import type { PostSummary } from '../models/post.model';
import { blogDirectoryPath, buildBlogDirectories, parentBlogSlug } from './blog-directories';
import { comparePostsByPublication } from './blog-pagination';

const post = (slug: string, date: string, updated?: string): PostSummary => ({
  slug, title: slug.split('/').at(-1)!, description: 'Description', date, ...(updated ? { updated } : {}),
});

describe('blog directories', () => {
  it('preserves archive order when same-day posts move into different categories', () => {
    const posts = [post('a/zebra', '2026-01-01'), post('z/apple', '2026-01-01'), post('b/new', '2026-01-02')];
    expect(posts.sort(comparePostsByPublication).map(post => post.slug)).toEqual(['b/new', 'z/apple', 'a/zebra']);
  });
  it('lists immediate children and propagates publication dates while ignoring later updates', () => {
    const posts = [
      post('oi/codeforces/old', '2019-01-01', '2026-09-10'),
      post('oi/codeforces/new', '2026-09-01'),
      post('oi/notes/deep/example', '2026-09-09'),
      post('oi/overview', '2026-09-11'),
      post('other/example', '2026-09-11', '2026-09-12'),
      post('flat', '2026-09-13'),
    ];
    const directories = buildBlogDirectories(posts);
    const root = directories.find(directory => directory.slug === 'oi')!;
    expect(root.date).toBe('2026-09-11');
    expect(root.postCount).toBe(4);
    expect(root.entries.map(entry => [entry.kind, entry.slug, entry.date, entry.postCount])).toEqual([
      ['directory', 'oi/notes', '2026-09-09', 1],
      ['directory', 'oi/codeforces', '2026-09-01', 2],
      ['post', 'oi/overview', '2026-09-11', undefined],
    ]);
    expect(directories.find(directory => directory.slug === 'oi/codeforces')!.entries.map(entry => entry.slug)).toEqual(['oi/codeforces/new', 'oi/codeforces/old']);
    expect(directories.find(directory => directory.slug === 'oi/notes/deep')!.date).toBe('2026-09-09');
    const contents = directories.find(directory => directory.slug === '')!;
    expect(contents).toMatchObject({ name: 'Contents', date: '2026-09-13', postCount: 6 });
    expect(contents.entries.map(entry => entry.slug)).toEqual(['oi', 'other', 'flat']);
    expect(directories.find(directory => directory.slug === 'other')!.date).toBe('2026-09-11');
    expect(buildBlogDirectories([...posts].reverse())).toEqual(directories);
    expect(posts[0].slug).toBe('oi/codeforces/old');
  });

  it('keeps a contents root for empty and flat collections and computes directory navigation', () => {
    expect(buildBlogDirectories([])).toEqual([{ slug: '', name: 'Contents', postCount: 0, entries: [] }]);
    const directories = buildBlogDirectories([post('flat', '2026-01-01')]);
    expect(directories).toHaveLength(1);
    expect(directories[0].entries).toEqual([{ kind: 'post', slug: 'flat', title: 'flat', date: '2026-01-01' }]);
    expect(blogDirectoryPath('')).toBe('/blog/contents');
    expect(blogDirectoryPath('oi/codeforces')).toBe('/blog/contents/oi/codeforces');
    expect(parentBlogSlug('oi/codeforces/post')).toBe('oi/codeforces');
    expect(parentBlogSlug('oi')).toBe('');
  });
});
