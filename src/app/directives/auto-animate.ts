import { AfterViewInit, Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
import type { AnimationController, AutoAnimateOptions } from '@formkit/auto-animate';
import autoAnimate from '@formkit/auto-animate';

@Directive({
  selector: '[appAutoAnimate]',
})
export class AutoAnimateDirective implements AfterViewInit, OnDestroy {
  readonly options = input<Partial<AutoAnimateOptions> | undefined>(undefined, {
    alias: 'appAutoAnimateOptions',
  });

  private el = inject(ElementRef<HTMLElement>);
  private controller: AnimationController | null = null;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.controller = autoAnimate(this.el.nativeElement, this.options());
  }

  ngOnDestroy(): void {
    this.controller?.disable();
    this.controller?.destroy?.();
  }
}
