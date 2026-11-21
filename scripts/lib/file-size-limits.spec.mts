import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countLines,
  fileSizeViolation,
  MAX_CODE_LINES,
  MAX_CSS_LINES,
} from './file-size-limits.mts';

test('countLines handles empty, trailing-newline, and non-trailing-newline text', () => {
  assert.equal(countLines(''), 0);
  assert.equal(countLines('a\n'), 1);
  assert.equal(countLines('a\nb'), 2);
  assert.equal(countLines('a\nb\n'), 2);
});

test('fileSizeViolation enforces CSS and code budgets with targeted hints', () => {
  assert.equal(fileSizeViolation('content/posts/example/styles.css', MAX_CSS_LINES), undefined);
  assert.match(
    fileSizeViolation('content/posts/example/styles.css', MAX_CSS_LINES + 1) ?? '',
    /styles\/\*\.css/,
  );
  assert.equal(
    fileSizeViolation('content/posts/example/scripts/a.post-component.tsx', MAX_CODE_LINES),
    undefined,
  );
  assert.match(
    fileSizeViolation('content/posts/example/scripts/a.post-component.tsx', MAX_CODE_LINES + 1) ??
      '',
    /post-component\.tsx/,
  );
  assert.equal(fileSizeViolation('content/posts/example/index.mdx', 2000), undefined);
});
