export const MAX_CSS_LINES = 400;
export const MAX_CODE_LINES = 500;

export function countLines(source: string): number {
  if (!source.length) return 0;
  return source.endsWith('\n') ? source.split('\n').length - 1 : source.split('\n').length;
}

export function fileSizeLimit(relativePath: string): number | undefined {
  if (relativePath.endsWith('.css')) return MAX_CSS_LINES;
  if (/\.(?:ts|tsx|mts|html)$/.test(relativePath)) return MAX_CODE_LINES;
  return undefined;
}

function splitHint(relativePath: string): string {
  if (relativePath.endsWith('.css') && relativePath.startsWith('content/')) {
    return 'split article or kit styles into styles/*.css partials';
  }
  if (relativePath.endsWith('.css')) {
    return 'extract cohesive partials or shared style modules';
  }
  if (relativePath.startsWith('content/')) {
    return 'extract shared primitives/models or split into focused *.post-component.tsx files';
  }
  return 'split into cohesive submodules';
}

export function fileSizeViolation(relativePath: string, lineCount: number): string | undefined {
  const limit = fileSizeLimit(relativePath);
  if (limit === undefined || lineCount <= limit) return undefined;
  return `${relativePath}: ${lineCount} lines exceeds limit of ${limit} (${splitHint(relativePath)})`;
}
