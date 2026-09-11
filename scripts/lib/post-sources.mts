import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Article directories own their assets; only category directories are traversed. */
export function discoverPostSources(root: string): { slug: string; sourcePath: string }[] {
  const posts: { slug: string; sourcePath: string }[] = [];
  function visit(slug: string): void {
    const directory = join(root, slug);
    const sourcePath = join(directory, 'index.mdx');
    if (existsSync(sourcePath)) {
      if (!slug || slug.split('/').at(-1) === 'index') {
        throw new Error(`Reserved post slug: ${slug || '(root)'}`);
      }
      posts.push({ slug, sourcePath });
      return;
    }
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      if (!entry.isDirectory() || !/^[a-z\d][a-z\d_-]*$/i.test(entry.name)) {
        throw new Error(`Expected a category or post directory: ${join(directory, entry.name)}`);
      }
      if (!slug && ['page', 'contents'].includes(entry.name))
        throw new Error(`The blog/${entry.name} path is reserved for navigation`);
      visit(slug ? `${slug}/${entry.name}` : entry.name);
    }
  }
  visit('');
  return posts;
}
