import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverPostSources } from './lib/post-sources.mts';

// bibtex-tidy bundles this proposal for its CLI but not its library build.
// Remove this compatibility shim once Node provides Map#getOrInsert natively.
for (const prototype of [Map.prototype, WeakMap.prototype]) {
  if (!('getOrInsert' in prototype)) {
    Object.defineProperty(prototype, 'getOrInsert', {
      configurable: true,
      value<K, V>(this: Pick<Map<K, V>, 'has' | 'set' | 'get'>, key: K, value: V) {
        if (!this.has(key)) this.set(key, value);
        return this.get(key);
      },
    });
  }
}

const { tidy } = await import('bibtex-tidy');
const POSTS_DIR = fileURLToPath(new URL('../content/posts/', import.meta.url));
const write = process.argv.includes('--write');
const files = discoverPostSources(POSTS_DIR)
  .map(({ sourcePath }) => join(dirname(sourcePath), 'references.bib'))
  .filter(existsSync);

let failed = false;
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  let result: ReturnType<typeof tidy>;
  try {
    result = tidy(source, {
      duplicates: ['key', 'doi'],
      // Content BibTeX is UTF-8 and rendered as HTML, so Unicode does not need
      // to be converted to LaTeX macros.
      escape: false,
    });
  } catch (error) {
    console.error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    failed = true;
    continue;
  }

  for (const warning of result.warnings) {
    console.error(`${file}: ${warning.message}`);
    failed = true;
  }

  if (source !== result.bibtex) {
    if (write) {
      writeFileSync(file, result.bibtex, 'utf8');
      console.log(`Formatted ${file}`);
    } else {
      console.error(`${file}: formatting differs; run pnpm format:bib`);
      failed = true;
    }
  }
}

if (failed) process.exitCode = 1;
else console.log(`Checked ${files.length} BibTeX file${files.length === 1 ? '' : 's'}`);
