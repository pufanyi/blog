import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function collectIconNames(root: string): string[] {
  const names = new Set<string>();
  for (const directory of ['src', 'content', 'configs']) {
    for (const file of readdirSync(join(root, directory), { recursive: true, encoding: 'utf8' })) {
      if (!/\.(?:ts|tsx|html|css|mdx|yaml)$/.test(file)) continue;
      if (directory === 'src' && (file.startsWith('app/data/') || file.startsWith('styles/icons/')))
        continue;
      const source = readFileSync(join(root, directory, file), 'utf8');
      for (const match of source.matchAll(/(?:\bph-|--icon-)([a-z][a-z0-9-]*)/g)) {
        names.add(match[1]);
      }
    }
  }
  return [...names].sort();
}

export function validateIconSubset(root: string): void {
  const css = readFileSync(join(root, 'src/styles/icons/phosphor.css'), 'utf8');
  const missing = collectIconNames(root).filter((name) => !css.includes(`.ph.ph-${name}::before`));
  if (missing.length) {
    throw new Error(
      `Missing Phosphor icons: ${missing.join(', ')}. Run scripts/subset-icons.mts; see docs/development.md.`,
    );
  }
}
