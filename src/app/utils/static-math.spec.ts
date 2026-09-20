import { expect, it, vi } from 'vitest';
import { enhanceStaticMath } from './static-math';

it('copies complete and partial formula selections as TeX and removes its listener', () => {
  const article = document.createElement('article');
  article.innerHTML =
    '<p>A <mjx-container data-tex="x^2"><mjx-math>rendered</mjx-math></mjx-container> B</p>';
  document.body.append(article);
  const cleanup = enhanceStaticMath(article);
  const selection = document.getSelection()!;
  const copy = () => {
    const setData = vi.fn();
    const event = new Event('copy', { cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: { setData } });
    article.dispatchEvent(event);
    return setData;
  };
  try {
    const range = document.createRange();
    range.selectNodeContents(article.querySelector('p')!);
    selection.removeAllRanges();
    selection.addRange(range);
    expect(copy()).toHaveBeenCalledWith('text/plain', 'A \\(x^2\\) B');
    range.selectNodeContents(article.querySelector('mjx-math')!);
    expect(copy()).toHaveBeenCalledWith('text/plain', '\\(x^2\\)');
    cleanup();
    expect(copy()).not.toHaveBeenCalled();
  } finally {
    cleanup();
    selection.removeAllRanges();
    article.remove();
  }
});
