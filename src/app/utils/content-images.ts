import { ApplicationRef, ComponentRef, EnvironmentInjector, createComponent } from '@angular/core';
import { ImageLightboxComponent } from '../components/image-lightbox/image-lightbox';

export function hydrateContentImages(
  container: HTMLElement,
  environmentInjector: EnvironmentInjector,
  appRef: ApplicationRef,
): () => void {
  const refs: ComponentRef<ImageLightboxComponent>[] = [];

  for (const image of Array.from(container.querySelectorAll<HTMLImageElement>('img'))) {
    const src = image.getAttribute('src');
    const width = image.getAttribute('width');
    const height = image.getAttribute('height');

    if (!src || !width || !height) {
      continue;
    }

    const host = document.createElement('app-image-lightbox');
    const ref = createComponent(ImageLightboxComponent, {
      environmentInjector: environmentInjector,
      hostElement: host,
    });

    ref.setInput('src', src);
    ref.setInput('alt', image.getAttribute('alt') ?? '');
    ref.setInput('width', width);
    ref.setInput('height', height);
    ref.setInput('imgClass', image.className);
    ref.setInput('loading', image.getAttribute('loading') === 'eager' ? 'eager' : 'lazy');
    ref.setInput('sizes', image.getAttribute('sizes') ?? undefined);

    image.replaceWith(host);
    appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    refs.push(ref);
  }

  return () => {
    for (const ref of refs) {
      appRef.detachView(ref.hostView);
      ref.destroy();
    }
  };
}
