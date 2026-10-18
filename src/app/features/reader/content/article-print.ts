/** Native print shortcuts and the toolbar share the same complete-article behavior. */
export function prepareArticlePrint(container: HTMLElement): () => void {
  const view = container.ownerDocument.defaultView;
  const opened = new Set<HTMLDetailsElement>();
  const before = () => {
    for (const details of container.querySelectorAll('details:not([open])')) {
      const disclosure = details as HTMLDetailsElement;
      opened.add(disclosure);
      disclosure.open = true;
    }
  };
  const after = () => {
    for (const details of opened) details.open = false;
    opened.clear();
  };
  view?.addEventListener('beforeprint', before);
  view?.addEventListener('afterprint', after);
  return () => {
    view?.removeEventListener('beforeprint', before);
    view?.removeEventListener('afterprint', after);
    after();
  };
}
