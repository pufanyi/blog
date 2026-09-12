import type { PostSummary } from '../models/post.model';

export interface BlogDirectoryEntry {
  kind: 'directory' | 'post';
  slug: string;
  title: string;
  date: string;
  postCount?: number;
}

export interface BlogDirectory {
  slug: string;
  name: string;
  date?: string;
  postCount: number;
  entries: BlogDirectoryEntry[];
}

export function parentBlogSlug(slug: string): string {
  return slug.split('/').slice(0, -1).join('/');
}

export function blogDirectoryPath(slug: string): string {
  return `/blog/contents${slug ? `/${slug}` : ''}`;
}

/** Includes the contents root; folder dates use descendant publication dates only. */
export function buildBlogDirectories(posts: readonly PostSummary[]): BlogDirectory[] {
  const directories = new Map<string, BlogDirectory>([
    ['', { slug: '', name: 'Contents', postCount: 0, entries: [] }],
  ]);
  for (const post of posts) {
    const date = post.date;
    const segments = post.slug.split('/');
    for (let depth = 0; depth < segments.length; depth++) {
      const slug = segments.slice(0, depth).join('/');
      let directory = directories.get(slug);
      if (!directory) {
        directory = { slug, name: segments[depth - 1], date, postCount: 0, entries: [] };
        directories.set(slug, directory);
      }
      directory.postCount++;
      if (!directory.date || date > directory.date) directory.date = date;
      if (depth === segments.length - 1) {
        directory.entries.push({ kind: 'post', slug: post.slug, title: post.title, date });
      }
    }
  }
  for (const directory of directories.values()) {
    if (!directory.slug) continue;
    directories.get(parentBlogSlug(directory.slug))?.entries.push({
      kind: 'directory',
      slug: directory.slug,
      title: directory.name,
      date: directory.date!,
      postCount: directory.postCount,
    });
  }
  for (const directory of directories.values()) {
    directory.entries.sort(
      (a, b) =>
        a.kind.localeCompare(b.kind) ||
        b.date.localeCompare(a.date) ||
        a.slug.localeCompare(b.slug),
    );
  }
  return [...directories.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}
