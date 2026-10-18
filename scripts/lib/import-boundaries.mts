import ts from 'typescript';

/** Include type imports, re-exports and literal lazy imports; barrels cannot hide an edge. */
export function importSpecifiers(source: string): string[] {
  const file = ts.createSourceFile('module.ts', source, ts.ScriptTarget.Latest, true);
  const imports: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      imports.push(node.arguments[0].text);
    }
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteralLike(node.argument.literal)
    ) {
      imports.push(node.argument.literal.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return imports;
}

/** Paths are repository-relative, resolved and normalized by the caller. */
export function boundaryViolation(source: string, target: string): string | undefined {
  if (
    source.startsWith('src/contracts/') &&
    target.startsWith('src/') &&
    !target.startsWith('src/contracts/')
  ) {
    return 'Build/browser contracts cannot depend on application code';
  }
  if (
    source.startsWith('scripts/') &&
    !source.endsWith('.spec.mts') &&
    target.startsWith('src/app/')
  ) {
    return 'Build tooling must use framework-free contracts, not application implementation';
  }
  if (
    /^src\/app\/(shared|platform)\//.test(source) &&
    /^src\/app\/(features|shell)\//.test(target)
  ) {
    return 'Shared/platform modules cannot depend on features or shell';
  }
  const feature = (path: string) => /^src\/app\/features\/([^/]+)\//.exec(path)?.[1];
  const owner = feature(source);
  const dependency = feature(target);
  if (owner && target.startsWith('src/app/shell/'))
    return 'Features cannot depend on shell implementation';
  if (
    owner &&
    dependency &&
    owner !== dependency &&
    !(source.endsWith('.routes.ts') && target.endsWith('.routes.ts'))
  ) {
    return 'Features may compose route entry points but cannot import sibling implementation';
  }
  if (
    source.startsWith('src/app/shell/') &&
    dependency &&
    target !== 'src/app/features/search/search-launcher.ts'
  ) {
    return 'Shell may import only the small search launcher, not feature implementation';
  }
  return undefined;
}
