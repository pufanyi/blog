import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CitationPreviewComponent } from '../components/citation-preview/citation-preview';

const CITATION_LINK_SELECTOR = '[id^="citation--"] a[href*="#bib-"]';

interface Unsubscribable {
  unsubscribe(): void;
}

@Injectable({ providedIn: 'root' })
export class CitationPreviewService {
  private readonly overlay = inject(Overlay);
  private readonly sanitizer = inject(DomSanitizer);
  private overlayRef: OverlayRef | null = null;
  private origin: HTMLElement | null = null;
  private subscriptions: Unsubscribable[] = [];

  bind(container: HTMLElement): () => void {
    const listeners: (() => void)[] = [];

    for (const link of container.querySelectorAll<HTMLAnchorElement>(CITATION_LINK_SELECTOR)) {
      const handleClick = (event: MouseEvent) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }

        const referenceHref = link.getAttribute('href');
        const reference = referenceHref
          ? this.findReference(container, referenceHref)
          : null;
        if (!referenceHref || !reference) {
          return;
        }

        event.preventDefault();
        this.open(link, reference, referenceHref);
      };

      link.addEventListener('click', handleClick);
      listeners.push(() => link.removeEventListener('click', handleClick));
    }

    return () => {
      for (const removeListener of listeners) removeListener();
      this.close(false);
    };
  }

  close(restoreFocus = true): void {
    const origin = this.origin;
    this.origin = null;
    for (const subscription of this.subscriptions) subscription.unsubscribe();
    this.subscriptions = [];
    this.overlayRef?.dispose();
    this.overlayRef = null;

    if (restoreFocus && origin?.isConnected) {
      queueMicrotask(() => origin.focus({ preventScroll: true }));
    }
  }

  private open(origin: HTMLElement, reference: HTMLElement, referenceHref: string): void {
    if (this.origin === origin && this.overlayRef) {
      this.close();
      return;
    }

    this.close(false);
    this.origin = origin;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(12)
      .withPositions([
        {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 8,
        },
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -8,
        },
      ]);

    const overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      panelClass: 'citation-preview-overlay',
      disposeOnNavigation: true,
    });
    this.overlayRef = overlayRef;

    const componentRef = overlayRef.attach(new ComponentPortal(CitationPreviewComponent));
    componentRef.setInput(
      'entryHtml',
      this.sanitizer.bypassSecurityTrustHtml(reference.innerHTML),
    );
    componentRef.setInput('title', reference.dataset['title'] ?? null);
    componentRef.setInput('authors', reference.dataset['authors'] ?? null);
    componentRef.setInput('year', reference.dataset['year'] ?? null);
    componentRef.setInput('abstract', reference.dataset['abstract'] ?? null);
    componentRef.setInput('paperUrl', this.findPaperUrl(reference));
    componentRef.setInput('referenceHref', referenceHref);

    this.subscriptions = [
      overlayRef.backdropClick().subscribe(() => this.close()),
      overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close();
        }
      }),
      componentRef.instance.closeRequested.subscribe((restoreFocus) => this.close(restoreFocus)),
    ];
  }

  private findReference(container: HTMLElement, href: string): HTMLElement | null {
    const hashIndex = href.indexOf('#');
    if (hashIndex < 0) return null;

    try {
      const id = decodeURIComponent(href.slice(hashIndex + 1));
      return Array.from(container.querySelectorAll<HTMLElement>('.csl-entry[id]')).find(
        (entry) => entry.id === id,
      ) ?? null;
    } catch {
      return null;
    }
  }

  private findPaperUrl(reference: HTMLElement): string | null {
    if (reference.dataset['url']) return reference.dataset['url'];

    const linkedUrl = reference.querySelector<HTMLAnchorElement>('a[href^="http"]')?.href;
    if (linkedUrl) return linkedUrl;

    const match = reference.textContent?.match(/https?:\/\/[^\s]+/);
    return match?.[0].replace(/[),.;]+$/, '') ?? null;
  }
}
