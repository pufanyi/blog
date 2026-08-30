import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// bibtex-tidy bundles this proposal for its CLI but not its library build.
// Remove this compatibility shim once Node provides Map#getOrInsert natively.
for (const prototype of [Map.prototype, WeakMap.prototype]) {
  if (!prototype.getOrInsert) {
    Object.defineProperty(prototype, 'getOrInsert', {
      configurable: true,
      value(key, value) {
        if (!this.has(key)) this.set(key, value);
        return this.get(key);
      },
    });
  }
}

const { tidy } = await import('bibtex-tidy');
const POSTS_DIR = new URL('../content/posts/', import.meta.url).pathname;
const write = process.argv.includes('--write');
const files = readdirSync(POSTS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(POSTS_DIR, entry.name, 'references.bib'))
  .filter((file) => {
    try {
      readFileSync(file);
      return true;
    } catch {
      return false;
    }
  });

let failed = false;
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  let result;
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
