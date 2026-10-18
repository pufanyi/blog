import { CdkTrapFocus } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import type { SearchResult } from '../../../../contracts/search.model';
import { SearchService } from '../search.service';
import { SearchSession } from '../search-session';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CdkTrapFocus],
  templateUrl: './search-modal.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './search-modal.css',
})
export class SearchModalComponent implements OnDestroy {
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  readonly returnFocusTarget = input<HTMLElement | null>(null);
  private readonly previousBodyOverflow = this.document.body.style.overflow;
  private readonly previousBodyOverscrollBehavior = this.document.body.style.overscrollBehavior;
  private dismissed = false;
  private restoreFocus = true;

  readonly closed = output<void>();
  readonly session = new SearchSession(this.searchService, (result) => this.goTo(result));

  constructor() {
    afterNextRender(() => {
      this.dialog().nativeElement.showModal();
      this.inputEl().nativeElement.focus();
      this.document.body.style.overflow = 'hidden';
      this.document.body.style.overscrollBehavior = 'contain';
      void this.session.update();
    });
  }

  ngOnDestroy(): void {
    this.dismissed = true;
    this.session.dispose();
    this.dialog().nativeElement.close();
    this.document.body.style.overflow = this.previousBodyOverflow;
    this.document.body.style.overscrollBehavior = this.previousBodyOverscrollBehavior;
    const trigger = this.returnFocusTarget();
    if (this.restoreFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
  }

  onInput(event: Event): void {
    void this.session.update((event.target as HTMLInputElement).value);
  }

  reload(): void {
    this.document.defaultView?.location.reload();
  }

  onKeydown(event: KeyboardEvent): void {
    // The native dialog handles Escape; CDK closes the Tab loop. Enter on a result
    // or the close button must keep that button's native activation behavior.
    if (event.target !== this.inputEl().nativeElement || event.isComposing) return;
    const length = this.session.results().length;
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && length) {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      this.session.move(delta);
      this.document
        .getElementById(`search-result-${this.session.activeIndex()}`)
        ?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && this.session.loading() && this.session.query().trim()) {
      event.preventDefault();
      this.session.select();
    } else if (event.key === 'Enter' && length) {
      event.preventDefault();
      this.session.select();
    }
  }

  goTo(result: SearchResult): void {
    this.restoreFocus = false;
    this.close();
    void this.router.navigateByUrl(`/blog/${result.slug}`);
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }

  close(): void {
    if (this.dismissed) return;
    this.dismissed = true;
    this.session.dispose();
    this.dialog().nativeElement.close();
    this.closed.emit();
  }

  matchLabel(field: SearchResult['matchField']): string {
    return { title: 'Title', description: 'Description', content: 'Content' }[field];
  }
}
