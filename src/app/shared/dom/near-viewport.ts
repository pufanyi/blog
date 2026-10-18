/** Run once near the viewport; dispose the observer even if the element never appears. */
export function whenNearViewport(element: Element, action: () => void): () => void {
  const view = element.ownerDocument.defaultView;
  if (!view?.IntersectionObserver) {
    action();
    return () => undefined;
  }
  let active = true;
  const observer = new view.IntersectionObserver(
    (entries) => {
      if (!active || !entries.some((entry) => entry.isIntersecting)) return;
      active = false;
      observer.disconnect();
      action();
    },
    { rootMargin: '600px' },
  );
  observer.observe(element);
  return () => {
    active = false;
    observer.disconnect();
  };
}
