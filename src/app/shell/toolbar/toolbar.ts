import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SITE_CONFIG } from '../../data/site-config';
import { SearchLauncherComponent } from '../../features/search/search-launcher';
import { PageChromeService } from '../../platform/page-chrome.service';
import { ThemeService } from '../../platform/theme.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [NgOptimizedImage, SearchLauncherComponent, RouterLink, RouterLinkActive],
  templateUrl: './toolbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './toolbar.css',
})
export class ToolbarComponent {
  themeService = inject(ThemeService);
  chrome = inject(PageChromeService);
  readonly authorName = SITE_CONFIG.author.name;
  readonly authorAvatar = SITE_CONFIG.author.avatar;

  print() {
    window.print();
  }
}
