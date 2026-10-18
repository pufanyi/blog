import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageChromeService } from '../platform/page-chrome.service';
import { FooterComponent } from './footer/footer';
import { ToolbarComponent } from './toolbar/toolbar';

@Component({
  selector: 'app-site-shell',
  host: { '[class.has-reading-dock]': 'chrome.readingDock()' },
  standalone: true,
  imports: [RouterOutlet, ToolbarComponent, FooterComponent],
  templateUrl: './site-shell.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './site-shell.css',
})
export class SiteShellComponent {
  readonly chrome = inject(PageChromeService);
}
