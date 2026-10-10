import { Directive, ElementRef, inject, input, type OnChanges, Renderer2 } from '@angular/core';
import type { PostTocItem } from '../../models/post.model';

@Directive({
  selector: '[appPostTocLabel]',
  host: { '(contextmenu)': 'onContextMenu($event)' },
})
export class PostTocLabelDirective implements OnChanges {
  readonly item = input.required<PostTocItem>({ alias: 'appPostTocLabel' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  onContextMenu(event: MouseEvent): void {
    if (
      event.target instanceof Element &&
      event.target.closest('mjx-container[data-static-math]')
    ) {
      event.preventDefault();
    }
  }

  ngOnChanges(): void {
    const item = this.item();
    // The generator copies only text and static MathJax nodes into labelHtml.
    this.renderer.setProperty(
      this.host.nativeElement,
      item.labelHtml ? 'innerHTML' : 'textContent',
      item.labelHtml ?? item.text,
    );
  }
}
