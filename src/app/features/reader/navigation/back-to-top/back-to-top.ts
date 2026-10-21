import { ChangeDetectionStrategy, Component, input, OnDestroy, signal } from '@angular/core';
import { SmoothScrollHandle, smoothScrollTo } from '../../../../shared/scroll/smooth-scroll';

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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './back-to-top.css',
  host: {
    '[class.is-dock]': "placement() === 'dock'",
    '[class.is-wide-only]': 'wideOnly()',
  },
})
export class BackToTopComponent implements OnDestroy {
  /** A floating control, or an always-visible button inside the reading dock. */
  readonly placement = input<'floating' | 'dock'>('floating');
  /** Hide the floating control where the reading dock provides its own. */
  readonly wideOnly = input(false);
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
