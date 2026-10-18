import { afterNextRender, Directive, ElementRef, inject, OnDestroy, signal } from '@angular/core';

/** Owns only the mobile modal's visibility, exit transition and focus lifetime. */
@Directive({
  selector: 'dialog[appContentsDialog]',
  exportAs: 'contentsDialog',
  host: {
    '[class.is-closing]': 'closing()',
    '(click)': 'onTocDialogClick($event)',
    '(close)': 'onTocDialogClose()',
    '(cancel)': 'onTocDialogCancel($event)',
  },
})
export class ContentsDialogDirective implements OnDestroy {
  readonly open = signal(false);
  readonly closing = signal(false);
  private readonly dialog = inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;
  private viewport: MediaQueryList | null = null;
  private tocTrigger: HTMLElement | null = null;
  private restoreTocTrigger = true;
  private finishClosing: (() => void) | null = null;
  private closeCompletion: Promise<void> | null = null;
  private destroyed = false;
  private readonly onViewportChange = (event: MediaQueryListEvent) => {
    if (event.matches) void this.close(false, false);
  };

  constructor() {
    afterNextRender(() => {
      this.viewport = window.matchMedia('(min-width: 1024px)');
      this.viewport.addEventListener('change', this.onViewportChange);
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.viewport?.removeEventListener('change', this.onViewportChange);
    void this.close(false, false);
  }

  toggle(trigger?: HTMLElement): void {
    const dialog = this.dialog;
    if (!dialog || this.viewport?.matches || this.closing()) {
      return;
    }

    if (dialog.open) {
      this.close();
      return;
    }

    // WebKit on macOS does not focus buttons on pointer activation.
    this.tocTrigger =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    this.restoreTocTrigger = true;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    this.open.set(true);
  }

  close(restoreTrigger = true, animate = true): Promise<void> {
    if (this.finishClosing) {
      this.restoreTocTrigger &&= restoreTrigger;
      const closing = this.closeCompletion!;
      if (!animate) this.finishClosing();
      return closing;
    }
    this.restoreTocTrigger = restoreTrigger;
    const dialog = this.dialog;
    if (dialog?.open) {
      const close = () => {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
          this.onTocDialogClose();
        }
      };
      if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        close();
        return Promise.resolve();
      }
      // Keep the native modal/inert state until the exit finishes. WebKit does
      // not reliably retain dialog display/top-layer state for a CSS-only exit.
      this.closing.set(true);
      this.closeCompletion = new Promise<void>((resolve) => {
        const finish = () => {
          window.clearTimeout(timer);
          dialog.removeEventListener('transitionend', onEnd);
          this.finishClosing = null;
          this.closeCompletion = null;
          this.closing.set(false);
          close();
          resolve();
        };
        const onEnd = (event: TransitionEvent) => {
          if (event.target === dialog && event.propertyName === 'transform') finish();
        };
        // Also settle if styles are overridden or the tab stops painting.
        const timer = window.setTimeout(finish, 240);
        this.finishClosing = finish;
        dialog.addEventListener('transitionend', onEnd);
      });
      return this.closeCompletion;
    }

    this.open.set(false);
    if (!restoreTrigger) {
      this.tocTrigger = null;
      this.restoreTocTrigger = true;
    }
    return Promise.resolve();
  }

  onTocDialogCancel(event: Event): void {
    event.preventDefault();
    void this.close();
  }

  onTocDialogClose(): void {
    this.open.set(false);
    const trigger = this.restoreTocTrigger ? this.tocTrigger : null;
    this.tocTrigger = null;
    this.restoreTocTrigger = true;

    if (trigger?.isConnected) {
      queueMicrotask(() => {
        if (!this.destroyed && trigger.isConnected) trigger.focus({ preventScroll: true });
      });
    }
  }

  onTocDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
