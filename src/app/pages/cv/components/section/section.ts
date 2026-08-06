import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { AutoAnimateDirective } from '../../../../directives/auto-animate';

@Component({
  selector: 'app-section',
  imports: [AutoAnimateDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './section.html',
})
export class SectionComponent {
  readonly number = input.required<number>();
  readonly title = input.required<string>();
  readonly id = input<string>();

  sectionId = computed(
    () =>
      this.id() ??
      this.title()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
  );
}
