/** Static formulas retain native MathML; load the explorer only on explicit use. */
export function enhanceStaticMath(container: HTMLElement): () => void {
  const abort = new AbortController();
  const pending = new WeakSet<HTMLElement>();
  const activate = (event: Event) => {
    if (
      event instanceof KeyboardEvent &&
      !['Enter', ' ', 'ContextMenu'].includes(event.key) &&
      !(event.shiftKey && event.key === 'F10')
    )
      return;
    const target = event.target;
    const math =
      target instanceof Element
        ? target.closest<HTMLElement>('mjx-container[data-static-math]')
        : null;
    if (!math || !container.contains(math)) return;
    event.preventDefault();
    if (pending.has(math)) return;
    pending.add(math);
    const point = event instanceof MouseEvent ? { x: event.clientX, y: event.clientY } : null;
    void import('./mathjax')
      .then(async ({ activateStaticMath }) => {
        await activateStaticMath(math, abort.signal, point);
      })
      .catch((error) => {
        if (!abort.signal.aborted) console.error('Math options could not load', error);
      })
      .finally(() => pending.delete(math));
  };
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
  container.addEventListener('contextmenu', activate);
  container.addEventListener('keydown', activate);
  container.addEventListener('copy', copy);
  return () => {
    abort.abort();
    container.removeEventListener('contextmenu', activate);
    container.removeEventListener('keydown', activate);
    container.removeEventListener('copy', copy);
  };
}
