/** Copy selections containing build-rendered formulas as their retained TeX source. */
export function bindStaticMathCopy(container: HTMLElement): () => void {
  const copy = (event: ClipboardEvent) => {
    const selection = container.ownerDocument.getSelection();
    if (!event.clipboardData || !selection?.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;
    // Selecting inside a single formula omits its outer container from the clone.
    const ancestor = range.commonAncestorContainer;
    const selectedFormula = (
      ancestor instanceof Element ? ancestor : ancestor.parentElement
    )?.closest<HTMLElement>('mjx-container[data-tex]');
    const fragment = container.ownerDocument.createDocumentFragment();
    fragment.append(selectedFormula ? selectedFormula.cloneNode(true) : range.cloneContents());
    const formulas = fragment.querySelectorAll<HTMLElement>('mjx-container[data-tex]');
    if (!formulas.length) return;
    for (const formula of formulas) {
      const tex = formula.dataset['tex'] ?? '';
      formula.replaceWith(formula.hasAttribute('display') ? `\\[${tex}\\]` : `\\(${tex}\\)`);
    }
    for (const lineBreak of fragment.querySelectorAll('br')) lineBreak.replaceWith('\n');
    for (const block of fragment.querySelectorAll(
      'p, li, pre, blockquote, h1, h2, h3, h4, h5, h6, tr, summary, .math-display',
    ))
      block.append('\n');
    event.clipboardData.setData('text/plain', fragment.textContent ?? '');
    event.preventDefault();
  };
  container.addEventListener('copy', copy);
  return () => {
    container.removeEventListener('copy', copy);
  };
}
