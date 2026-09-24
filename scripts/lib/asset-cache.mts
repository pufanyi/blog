import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const marker = '# Generated fingerprinted asset caching';

export function prepareAssetCacheHeaders(browserDirectory: string): void {
  const files = readdirSync(browserDirectory, { recursive: true, encoding: 'utf8' });
  const patterns = new Set<string>();
  for (const file of files) {
    const rootAsset = /^(main|chunk|styles)-[^/]+\.(js|css)$/.exec(file);
    const media = file.startsWith('media/');
    if (!rootAsset && !media) continue;
    // These namespaces belong to Angular's outputHashing, not authored assets.
    if (!/^[^/]+-[\w-]{8,}\.[a-z0-9]+$/.test(media ? file.slice(6) : file)) {
      throw new Error(`Cannot cache an unversioned build asset immutably: ${file}`);
    }
    patterns.add(media ? '/media/*' : `/${rootAsset![1]}-*.${rootAsset![2]}`);
  }
  const headerFile = join(browserDirectory, '_headers');
  const original = existsSync(headerFile)
    ? readFileSync(headerFile, 'utf8').split(marker)[0].trimEnd()
    : '';
  const rules = [...patterns]
    .sort()
    .map((pattern) => `${pattern}\n  Cache-Control: public, max-age=31536000, immutable`);
  writeFileSync(headerFile, `${original}\n\n${marker}\n${rules.join('\n\n')}\n`);
}
