import { DOCUMENT } from '@angular/common';
import { Component, inject, output, signal, ElementRef, viewChild, afterNextRender, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService, SearchResult } from '../../services/search.service';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  templateUrl: './search-modal.html',
  styleUrl: './search-modal.css',
})
export class SearchModalComponent implements OnDestroy {
  private searchService = inject(SearchService);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  closed = output<void>();

  query = signal('');
  results = signal<SearchResult[]>([]);
  activeIndex = signal(0);

  private inputEl = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private previousBodyOverflow = '';
  private previousBodyOverscrollBehavior = '';

  constructor() {
    afterNextRender(() => {
      this.inputEl()?.nativeElement.focus();
      this.lockBodyScroll();
    });
  }

  ngOnDestroy() {
    this.unlockBodyScroll();
  }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.results.set(this.searchService.search(value));
    this.activeIndex.set(0);
  }

  onKeydown(event: KeyboardEvent) {
    const len = this.results().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update(i => (i + 1) % Math.max(len, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(i => (i - 1 + Math.max(len, 1)) % Math.max(len, 1));
        break;
      case 'Enter':
        event.preventDefault();
        if (len > 0) this.goTo(this.results()[this.activeIndex()]);
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  goTo(result: SearchResult) {
    this.close();
    this.router.navigate(['/blog', result.slug]);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('search-backdrop')) {
      this.close();
    }
  }

  close() {
    this.closed.emit();
  }

  matchLabel(field: SearchResult['matchField']): string {
    switch (field) {
      case 'title': return 'Title';
      case 'description': return 'Description';
      case 'content': return 'Content';
    }
  }

  private lockBodyScroll() {
    const body = this.document.body;
    this.previousBodyOverflow = body.style.overflow;
    this.previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'contain';
  }

  private unlockBodyScroll() {
    const body = this.document.body;
    body.style.overflow = this.previousBodyOverflow;
    body.style.overscrollBehavior = this.previousBodyOverscrollBehavior;
  }
}
