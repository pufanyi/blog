import { Component, inject, signal, HostListener } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { SearchModalComponent } from '../search-modal/search-modal';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [SearchModalComponent],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class ToolbarComponent {
  themeService = inject(ThemeService);
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
