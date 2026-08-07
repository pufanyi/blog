import { Component, inject, signal, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
}
