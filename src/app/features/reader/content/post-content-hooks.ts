import mediumZoom from 'medium-zoom';

const IMAGE_ZOOM_OPTIONS = {
  margin: 24,
  background: 'color-mix(in srgb, var(--background-deep) 86%, transparent)',
};

export function optimizeContentImages(container: HTMLElement): void {
  container.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
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
    (img) => !img.closest('app-image-lightbox'),
  );
  const zoom = images.length ? mediumZoom(images, IMAGE_ZOOM_OPTIONS) : null;

  return () => zoom?.detach();
}
