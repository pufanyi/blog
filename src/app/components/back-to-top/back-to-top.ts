import { Component, OnDestroy, signal } from '@angular/core';
import { smoothScrollTo, SmoothScrollHandle } from '../../utils/smooth-scroll';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  template: `
    <button
      class="back-to-top"
      type="button"
      [class.is-visible]="visible()"
      (click)="scrollToTop()"
      aria-label="Back to top"
      title="Back to top"
    >
      <i class="ph ph-arrow-line-up" aria-hidden="true" style="font-size: 20px"></i>
    </button>
  `,
  styleUrl: './back-to-top.css',
})
export class BackToTopComponent implements OnDestroy {
  readonly visible = signal(false);
  private scrollHandle: SmoothScrollHandle | null = null;
  private readonly handleScroll = (): void => {
    if (typeof window !== 'undefined') {
      this.visible.set(window.scrollY > 320);
    }
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      this.handleScroll();
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll);
    }
    this.scrollHandle?.cancel();
  }

  scrollToTop(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.scrollHandle?.cancel();
    this.scrollHandle = smoothScrollTo(0);
  }
}
