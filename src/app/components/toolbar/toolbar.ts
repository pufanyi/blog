import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { ToolbarExtensionService } from '../../services/toolbar-extension.service';
import { SearchModalComponent } from '../search-modal/search-modal';

function isBlogList(url: string): boolean {
  return /^\/blog(?:\/page\/\d+)?\/?$/.test(url.split(/[?#]/)[0] ?? '');
}

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [SearchModalComponent, RouterLink],
  templateUrl: './toolbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './toolbar.css',
})
export class ToolbarComponent {
  themeService = inject(ThemeService);
  toolbarExt = inject(ToolbarExtensionService);
  searchOpen = signal(false);
  private router = inject(Router);
  showBlogLink = signal(!isBlogList(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.showBlogLink.set(!isBlogList(event.urlAfterRedirects)));
    // A lazily created shell can miss the initial NavigationEnd, while
    // Router.url may still be `/` during its constructor.
    afterNextRender(() => this.showBlogLink.set(!isBlogList(this.router.url)));
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchOpen.update((v) => !v);
    }
  }

  print() {
    window.print();
  }
}
