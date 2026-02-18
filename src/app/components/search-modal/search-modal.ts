import { Component, inject, output, signal, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService, SearchResult } from '../../services/search.service';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  templateUrl: './search-modal.html',
  styleUrl: './search-modal.css',
})
export class SearchModalComponent {
  private searchService = inject(SearchService);
  private router = inject(Router);

  closed = output<void>();

  query = signal('');
  results = signal<SearchResult[]>([]);
  activeIndex = signal(0);

  private inputEl = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  constructor() {
    afterNextRender(() => {
      this.inputEl()?.nativeElement.focus();
    });
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
        this.closed.emit();
        break;
    }
  }

  goTo(result: SearchResult) {
    this.closed.emit();
    this.router.navigate(['/post', result.slug]);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('search-backdrop')) {
      this.closed.emit();
    }
  }

  matchLabel(field: SearchResult['matchField']): string {
    switch (field) {
      case 'title': return 'Title';
      case 'description': return 'Description';
      case 'content': return 'Content';
    }
  }
}
