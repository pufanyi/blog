import { readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { treeFiles } from './lib/content-cache.mts';
import { boundaryViolation, importSpecifiers } from './lib/import-boundaries.mts';

const root = fileURLToPath(new URL('..', import.meta.url));
const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile);
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
const name = (path: string) => relative(root, path).split(sep).join('/');
const errors: string[] = [];
for (const path of [...treeFiles(resolve(root, 'src')), ...treeFiles(resolve(root, 'scripts'))]) {
  const source = name(path);
  if (
    !/\.(ts|mts|tsx)$/.test(path) ||
    source.startsWith('src/app/data/') ||
    source.includes('/fixtures/')
  )
    continue;
  for (const specifier of importSpecifiers(readFileSync(path, 'utf8'))) {
    if (source.startsWith('src/contracts/') && /^(?:@angular\/|node:)/.test(specifier)) {
      errors.push(`${source}: contracts cannot import ${specifier}`);
    }
    const target = ts.resolveModuleName(specifier, path, options, ts.sys).resolvedModule;
    if (!target || target.isExternalLibraryImport) continue;
    const violation = boundaryViolation(source, name(target.resolvedFileName));
    if (violation) errors.push(`${source} → ${name(target.resolvedFileName)}: ${violation}`);
  }
}
if (errors.length) throw new Error(errors.join('\n'));
console.log('Import boundaries verified');
