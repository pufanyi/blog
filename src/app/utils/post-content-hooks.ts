import mediumZoom from 'medium-zoom';

const IMAGE_ZOOM_OPTIONS = {
  margin: 24,
  background: 'color-mix(in srgb, var(--background-deep) 86%, transparent)',
};

export function optimizeContentImages(container: HTMLElement): void {
  container.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
  });
}

export function initContentImageZoom(container: HTMLElement): () => void {
  if (typeof document === 'undefined') {
    return () => undefined;
  }

  const root = container;
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('img')).filter(
    img => !img.closest('app-image-lightbox'),
  );
  const zoom = images.length ? mediumZoom(images, IMAGE_ZOOM_OPTIONS) : null;

  return () => zoom?.detach();
}

export function initCodeCopyButtons(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  for (const button of container.querySelectorAll<HTMLButtonElement>('.code-copy')) {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onClick = async () => {
      const code = button.closest('.code-block')?.querySelector('code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent || '');
        if (disposed) return;
        button.classList.add('is-copied');
        button.textContent = 'Copied';
      } catch {
        if (disposed) return;
        button.textContent = 'Copy failed';
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        button.classList.remove('is-copied');
        button.textContent = 'Copy';
      }, 1800);
    };
    button.addEventListener('click', onClick);
    cleanups.push(() => {
      disposed = true;
      clearTimeout(timer);
      button.removeEventListener('click', onClick);
    });
  }
  return () => cleanups.forEach(cleanup => cleanup());
}
