import assert from 'node:assert/strict';
import test from 'node:test';
import { replaceInlineSyntaxColors } from './code-renderer.mts';

test('replaceInlineSyntaxColors maps both Catppuccin source themes to Morandi syntax tokens', () => {
  const html =
    '<span style="color:#1e66f5;--shiki-dark:#89b4fa;background:#eff1f5;--shiki-dark-bg:#1e1e2e">code</span>';

  assert.equal(
    replaceInlineSyntaxColors(html),
    '<span style="color:var(--syntax-blue);--shiki-dark:var(--syntax-blue);background:var(--syntax-background);--shiki-dark-bg:var(--syntax-background)">code</span>',
  );
});

test('replaceInlineSyntaxColors leaves unrelated inline colors unchanged', () => {
  const html = '<span style="color:#123456">code</span>';

  assert.equal(replaceInlineSyntaxColors(html), html);
});
