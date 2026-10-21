import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { PostTocItem } from '../../../../contracts/post.model';
import type { HeadingSelection } from '../content/heading-navigation';
import { BackToTopComponent } from './back-to-top/back-to-top';
import { ContentsDialogDirective } from './contents-dialog';
import { OutlinePositionDirective } from './outline-position';
import { PostTocComponent } from './toc/post-toc';

@Component({
  selector: 'app-post-navigation',
  imports: [
    PostTocComponent,
    ContentsDialogDirective,
    OutlinePositionDirective,
    BackToTopComponent,
  ],
  templateUrl: './post-navigation.html',
  styleUrl: './post-navigation.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PostNavigationComponent {
  readonly items = input.required<PostTocItem[]>();
  readonly postPath = input.required<string>();
  readonly activeHeadingId = input('');
  readonly readingProgress = input(0);
  readonly sectionSelected = output<HeadingSelection>();
  readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly dialog = viewChild(ContentsDialogDirective);
  readonly tocOpen = computed(() => this.dialog()?.open() ?? false);
  readonly currentSection = computed(
    () =>
      this.items()
        .flatMap((item) => [item, ...item.children])
        .find((item) => item.id === this.activeHeadingId())?.text ?? '',
  );
  readonly sectionCount = computed(() => {
    const count = this.items().length;
    return `${count} ${count === 1 ? 'section' : 'sections'}`;
  });

  toggleToc(trigger?: HTMLElement): void {
    this.dialog()?.toggle(trigger);
  }

  onTocNavigate(selection: HeadingSelection): void {
    const ready = this.dialog()?.close(false);
    this.sectionSelected.emit({ ...selection, ready });
  }
}
