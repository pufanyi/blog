import { Component, inject, signal, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { ToolbarExtensionService } from '../../services/toolbar-extension.service';
import { Lang, LanguageService } from '../../services/language.service';
import { SearchModalComponent } from '../search-modal/search-modal';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [SearchModalComponent, RouterLink],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class ToolbarComponent {
  themeService = inject(ThemeService);
  toolbarExt = inject(ToolbarExtensionService);
  languageService = inject(LanguageService);
  searchOpen = signal(false);
  private router = inject(Router);
  showBlogLink = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects !== '/'),
    ),
    { initialValue: this.router.url !== '/' },
  );

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchOpen.update(v => !v);
    }
  }

  print() {
    window.print();
  }

  cycleLanguage(): void {
    const langOrder: Lang[] = ['en', 'zh', 'ja'];
    const currentLang = this.languageService.current();
    const currentIndex = langOrder.indexOf(currentLang);
    const nextLang = langOrder[(currentIndex + 1) % langOrder.length];
    this.languageService.set(nextLang);
  }
}
