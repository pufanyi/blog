import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createHighlighter } from 'shiki';
import { createCodeRenderer, replaceInlineSyntaxColors } from './code-renderer.mts';

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

test('code rendering identifies only the terminal newline without changing copy text', async (t) => {
  const highlighter = await createHighlighter({
    themes: ['catppuccin-latte', 'catppuccin-mocha'],
    langs: ['bash'],
  });
  t.after(() => highlighter.dispose());
  const render = createCodeRenderer(highlighter);

  for (const lang of ['text', 'bash']) {
    for (const text of [
      'last.avif',
      'last.avif\n',
      'first\n\nlast\n',
      'last\n\n',
      'last\n  \n',
      '',
    ]) {
      const dom = new JSDOM(render({ text, lang }));
      const code = dom.window.document.querySelector('code')!;
      const lines = [...code.querySelectorAll('.line')];
      const terminal = code.querySelectorAll('.terminal-newline');
      assert.equal(code.textContent, text, `${lang}: source whitespace is preserved`);
      assert.equal(
        terminal.length,
        text.endsWith('\n') ? 1 : 0,
        `${lang}: ${JSON.stringify(text)}`,
      );
      if (terminal.length) {
        assert.equal(terminal[0], lines.at(-1));
        assert.equal(terminal[0].textContent, '');
      }
      dom.window.close();
    }
  }
});
