import { Component, effect, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SECTIONS } from '../../../../constants/sections';
import { ScrollSpyService } from '../../../../services/scroll-spy.service';
import { LanguageService, Lang } from '../../../../services/language.service';
import { A11yModule } from '@angular/cdk/a11y';
import { AutoAnimateDirective } from '../../../../directives/auto-animate';

const WIDE_QUERY = '(min-width: 1301px)';

const TOC_TITLE: Record<Lang, string> = { en: 'Contents', zh: '目录', ja: '目次' };

@Component({
  selector: 'app-table-of-contents',
  templateUrl: './table-of-contents.html',
  imports: [A11yModule, AutoAnimateDirective],
})
export class TableOfContentsComponent implements AfterViewInit, OnDestroy {
  readonly scrollSpy = inject(ScrollSpyService);
  readonly lang = inject(LanguageService).current;
  readonly open = signal(false);
  readonly sections = SECTIONS;
  readonly tocTitle = TOC_TITLE;
  private scrollAnimationFrameId: number | null = null;

  readonly isWide = toSignal(
    inject(BreakpointObserver)
      .observe(WIDE_QUERY)
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  constructor() {
    effect(() => {
      this.open.set(this.isWide());
    });
  }

  ngAfterViewInit(): void {
    this.scrollSpy.observe(this.sections.map((s) => s.id));
  }

  ngOnDestroy(): void {
    if (this.scrollAnimationFrameId !== null) {
      cancelAnimationFrame(this.scrollAnimationFrameId);
      this.scrollAnimationFrameId = null;
    }
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  navigateTo(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      this.smoothScrollTo(el);
      history.replaceState(null, '', `#${id}`);
    }

    if (!this.isWide()) {
      setTimeout(() => this.open.set(false), 150);
    }
  }

  private smoothScrollTo(el: HTMLElement): void {
    const targetY = el.getBoundingClientRect().top + window.scrollY;
    const startY = window.scrollY;
    const deltaY = targetY - startY;

    if (Math.abs(deltaY) < 1) {
      window.scrollTo(0, targetY);
      return;
    }

    if (this.scrollAnimationFrameId !== null) {
      cancelAnimationFrame(this.scrollAnimationFrameId);
    }

    const durationMs = 420;
    const startTime = performance.now();
    const easeInOutCubic = (t: number): number =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const tick = (now: number): void => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + deltaY * eased);

      if (progress < 1) {
        this.scrollAnimationFrameId = requestAnimationFrame(tick);
      } else {
        this.scrollAnimationFrameId = null;
      }
    };

    this.scrollAnimationFrameId = requestAnimationFrame(tick);
  }
}
