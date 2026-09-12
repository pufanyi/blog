import { DOCUMENT } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  Component,
  inject,
  output,
  signal,
  ElementRef,
  viewChild,
  afterNextRender,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../../services/search.service';
import type { SearchResult } from '../../models/search.model';

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
  private readonly trigger = this.document.activeElement as HTMLElement | null;
  private readonly previousBodyOverflow = this.document.body.style.overflow;
  private readonly previousBodyOverscrollBehavior = this.document.body.style.overscrollBehavior;
  private dismissed = false;
  private restoreFocus = true;
  private requestVersion = 0;
  private pendingNavigation: number | undefined;

  readonly closed = output<void>();
  readonly query = signal('');
  readonly results = signal<SearchResult[]>([]);
  readonly activeIndex = signal(0);
  readonly loading = signal(true);
  readonly failed = signal(false);

  constructor() {
    afterNextRender(() => {
      this.dialog().nativeElement.showModal();
      this.inputEl().nativeElement.focus();
      this.document.body.style.overflow = 'hidden';
      this.document.body.style.overscrollBehavior = 'contain';
      void this.updateResults();
    });
  }

  ngOnDestroy(): void {
    this.dismissed = true;
    this.requestVersion++;
    this.dialog().nativeElement.close();
    this.document.body.style.overflow = this.previousBodyOverflow;
    this.document.body.style.overscrollBehavior = this.previousBodyOverscrollBehavior;
    if (this.restoreFocus && this.trigger?.isConnected) this.trigger.focus({ preventScroll: true });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    if (!this.failed()) void this.updateResults();
  }

  reload(): void {
    this.document.defaultView?.location.reload();
  }

  private async updateResults(): Promise<void> {
    const version = ++this.requestVersion;
    const query = this.query();
    this.pendingNavigation = undefined;
    this.results.set([]);
    this.activeIndex.set(0);
    this.failed.set(false);
    this.loading.set(true);
    try {
      await this.searchService.prepare();
      if (!this.isCurrent(version)) return;
      const results = await this.searchService.search(query);
      if (!this.isCurrent(version)) return;
      this.results.set(results);
      if (this.pendingNavigation === version && results.length) this.goTo(results[0]);
    } catch {
      if (this.isCurrent(version)) this.failed.set(true);
    } finally {
      if (this.isCurrent(version)) this.loading.set(false);
    }
  }

  private isCurrent(version: number): boolean {
    return !this.dismissed && version === this.requestVersion;
  }

  onKeydown(event: KeyboardEvent): void {
    // The native dialog handles Escape; CDK closes the Tab loop. Enter on a result
    // or the close button must keep that button's native activation behavior.
    if (event.target !== this.inputEl().nativeElement || event.isComposing) return;
    const length = this.results().length;
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && length) {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex.update(index => (index + delta + length) % length);
      this.document
        .getElementById(`search-result-${this.activeIndex()}`)
        ?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && this.loading() && this.query().trim()) {
      event.preventDefault();
      this.pendingNavigation = this.requestVersion;
    } else if (event.key === 'Enter' && length) {
      event.preventDefault();
      this.goTo(this.results()[this.activeIndex()]);
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
    this.requestVersion++;
    this.dialog().nativeElement.close();
    this.closed.emit();
  }

  matchLabel(field: SearchResult['matchField']): string {
    return { title: 'Title', description: 'Description', content: 'Content' }[field];
  }
}
