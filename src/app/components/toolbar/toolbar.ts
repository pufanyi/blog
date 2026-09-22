import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SITE_CONFIG } from '../../data/site-config';
import { ThemeService } from '../../services/theme.service';
import { ToolbarExtensionService } from '../../services/toolbar-extension.service';
import { SearchModalComponent } from '../search-modal/search-modal';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [SearchModalComponent, RouterLink, RouterLinkActive],
  templateUrl: './toolbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './toolbar.css',
})
export class ToolbarComponent {
  themeService = inject(ThemeService);
  toolbarExt = inject(ToolbarExtensionService);
  searchOpen = signal(false);
  readonly authorName = SITE_CONFIG.author.name;

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
