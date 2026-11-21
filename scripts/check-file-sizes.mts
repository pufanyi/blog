import { readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { treeFiles } from './lib/content-cache.mts';
import { countLines, fileSizeLimit, fileSizeViolation } from './lib/file-size-limits.mts';

const root = fileURLToPath(new URL('..', import.meta.url));
const name = (path: string) => relative(root, path).split(sep).join('/');
const roots = ['src', 'scripts', 'content/posts', 'content/shared'];
const errors: string[] = [];

for (const directory of roots) {
  for (const path of treeFiles(resolve(root, directory))) {
    const source = name(path);
    if (
      source.startsWith('src/app/data/') ||
      source.includes('/fixtures/') ||
      fileSizeLimit(source) === undefined
    )
      continue;
    const violation = fileSizeViolation(source, countLines(readFileSync(path, 'utf8')));
    if (violation) errors.push(violation);
  }
}

if (errors.length) throw new Error(errors.join('\n'));
console.log('File size budgets verified');
