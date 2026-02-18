import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';
import autoAnimate from '@formkit/auto-animate';

@Directive({
  selector: '[appAutoAnimate]',
})
export class AutoAnimateDirective implements AfterViewInit {
  private el = inject(ElementRef<HTMLElement>);

  ngAfterViewInit(): void {
    autoAnimate(this.el.nativeElement);
  }
}
