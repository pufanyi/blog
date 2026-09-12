import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createProcessor } from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import ts from 'typescript';
import type { Post } from '../../src/app/models/post.model';
import type { AgentPost } from './agent-content.mts';

export function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

export function treeFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink())
        throw new Error(`Content inputs/outputs must not be symlinks: ${path}`);
      return entry.isDirectory() ? treeFiles(path) : [path];
    })
    .sort();
}

/** Hash bytes, not timestamps; also follow literal local imports across article boundaries. */
export class InputDigests {
  private readonly hashes = new Map<string, string>();
  private readonly imports = new Map<string, string[]>();

  private dependencies(path: string): string[] {
    const cached = this.imports.get(path);
    if (cached) return cached;
    if (!path.endsWith('.mdx') && !/\.[cm]?[jt]sx?$/.test(path)) return [];
    let source = readFileSync(path, 'utf8');
    if (path.endsWith('.mdx')) {
      const tree = createProcessor({
        remarkPlugins: [remarkFrontmatter, remarkGfm, remarkMath],
      }).parse(source);
      source = tree.children
        .flatMap((node) => (node.type === 'mdxjsEsm' ? [node.value] : []))
        .join('\n');
    } else if (!/\.[cm]?[jt]sx?$/.test(path)) return [];
    const specifiers: string[] = [];
    const syntax = ts.createSourceFile(
      path,
      source,
      ts.ScriptTarget.Latest,
      true,
      path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const visit = (node: ts.Node) => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        specifiers.push(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      )
        specifiers.push(node.arguments[0].text);
      ts.forEachChild(node, visit);
    };
    visit(syntax);
    const imports = specifiers
      .filter((specifier) => specifier.startsWith('.'))
      .map((specifier) => {
        const target = resolve(dirname(path), specifier);
        const candidates = [
          target,
          ...['.ts', '.mts', '.tsx', '.js', '.mjs', '.json'].map((extension) => target + extension),
          ...['index.ts', 'index.tsx', 'index.mts'].map((file) => join(target, file)),
        ];
        const resolved = candidates.find((file) => existsSync(file) && statSync(file).isFile());
        if (!resolved) throw new Error(`${path}: cannot resolve local import ${specifier}`);
        return resolved;
      });
    this.imports.set(path, imports);
    return imports;
  }

  files(paths: readonly string[], followImports = false): string {
    const visited = new Set<string>();
    const visit = (path: string) => {
      if (visited.has(path)) return;
      visited.add(path);
      if (!this.hashes.has(path)) this.hashes.set(path, digest(readFileSync(path)));
      if (followImports) for (const dependency of this.dependencies(path)) visit(dependency);
    };
    for (const path of paths) visit(path);
    return digest(JSON.stringify([...visited].sort().map((path) => [path, this.hashes.get(path)])));
  }
}

export interface CachedPost {
  post: Post;
  agent: AgentPost;
  searchText: string;
}

export function readCachedPost(path: string, key: string): CachedPost | undefined {
  try {
    const entry = JSON.parse(readFileSync(path, 'utf8'));
    if (entry.key !== key || entry.checksum !== digest(JSON.stringify(entry.value))) return;
    if (
      typeof entry.value?.post?.contentHtml !== 'string' ||
      typeof entry.value?.agent?.markdownExport !== 'string' ||
      typeof entry.value?.searchText !== 'string'
    )
      return;
    return entry.value;
  } catch {
    return;
  }
}

export function encodeCachedPost(key: string, value: CachedPost): string {
  return JSON.stringify({ key, checksum: digest(JSON.stringify(value)), value });
}

export function outputDigest(directories: string[]): string {
  const inputs = new InputDigests();
  return inputs.files(directories.flatMap(treeFiles));
}

export function generatedDigest(
  trees: { directory: string; files: Map<string, string> }[],
): string {
  const files = new Map(
    trees.flatMap((tree) =>
      [...tree.files].map(([path, value]) => [join(tree.directory, path), digest(value)] as const),
    ),
  );
  return digest(JSON.stringify([...files.keys()].sort().map((path) => [path, files.get(path)])));
}
